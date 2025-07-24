import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationData {
  type: 'mention' | 'message' | 'shift_update';
  chatRoomId?: string;
  messageId?: string;
  senderId?: string;
  shiftId?: string;
}

export interface MentionNotification {
  id: string;
  message_id: string;
  mentioned_employee_id: string;
  mentioned_by: string;
  chat_room_id: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Register the device for push notifications and store the token in the database
 */
export async function registerForPushNotifications(employeeId: string): Promise<string | null> {
  try {
    // Check if we're running on a physical device
    if (!Notifications.isAvailableAsync()) {
      console.log('Push notifications are not available on this device');
      return null;
    }

    // Get existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications');
      return null;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Store the token in the database
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        employee_id: employeeId,
        token: token,
        device_type: Platform.OS,
        device_id: tokenData.type, // Use token type as device identifier
        is_active: true,
      }, {
        onConflict: 'employee_id,token'
      });

    if (error) {
      console.error('Error storing push token:', error);
      return null;
    }

    console.log('Push token registered successfully:', token);
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Unregister the device from push notifications
 */
export async function unregisterFromPushNotifications(employeeId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('employee_id', employeeId);

    if (error) {
      console.error('Error unregistering push notifications:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error unregistering push notifications:', error);
    return false;
  }
}

/**
 * Get unread mentions count for the current user
 */
export async function getUnreadMentionsCount(employeeId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('get_unread_mentions_count', { user_employee_id: employeeId });

    if (error) {
      console.error('Error getting unread mentions count:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error getting unread mentions count:', error);
    return 0;
  }
}

/**
 * Get all mentions for the current user
 */
export async function getUserMentions(
  employeeId: string,
  limit: number = 50,
  offset: number = 0
): Promise<MentionNotification[]> {
  try {
    const { data, error } = await supabase
      .from('message_mentions')
      .select(`
        *,
        messages:message_id (
          content,
          created_at,
          sender:sender_id (
            first_name,
            last_name,
            avatar_url
          )
        ),
        chat_rooms:chat_room_id (
          name,
          type
        )
      `)
      .eq('mentioned_employee_id', employeeId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error getting user mentions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting user mentions:', error);
    return [];
  }
}

/**
 * Mark a mention as read
 */
export async function markMentionAsRead(mentionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('message_mentions')
      .update({ is_read: true })
      .eq('id', mentionId);

    if (error) {
      console.error('Error marking mention as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking mention as read:', error);
    return false;
  }
}

/**
 * Mark all mentions as read for a user
 */
export async function markAllMentionsAsRead(employeeId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('message_mentions')
      .update({ is_read: true })
      .eq('mentioned_employee_id', employeeId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all mentions as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking all mentions as read:', error);
    return false;
  }
}

/**
 * Set up notification listeners for the app
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  // Handle notifications received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
    
    const data = notification.request.content.data as PushNotificationData;
    
    // Handle different types of notifications
    switch (data.type) {
      case 'mention':
        console.log('Mention notification received for chat room:', data.chatRoomId);
        break;
      case 'message':
        console.log('Message notification received for chat room:', data.chatRoomId);
        break;
      case 'shift_update':
        console.log('Shift update notification received for shift:', data.shiftId);
        break;
    }

    onNotificationReceived?.(notification);
  });

  // Handle notification taps
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response);
    
    const data = response.notification.request.content.data as PushNotificationData;
    
    // Handle navigation based on notification type
    if (data.type === 'mention' && data.chatRoomId) {
      // Navigate to chat room
      console.log('Navigating to chat room:', data.chatRoomId);
      // navigation.navigate('ChatRoom', { id: data.chatRoomId });
    }

    onNotificationResponse?.(response);
  });

  // Return cleanup function
  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}

/**
 * Subscribe to real-time mentions for a user
 */
export function subscribeToMentions(
  employeeId: string,
  onMention: (mention: MentionNotification) => void
) {
  const subscription = supabase
    .channel('user-mentions')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'message_mentions',
        filter: `mentioned_employee_id=eq.${employeeId}`,
      },
      (payload) => {
        console.log('New mention received:', payload);
        onMention(payload.new as MentionNotification);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Test push notification (for development)
 */
export async function sendTestNotification(employeeId: string): Promise<boolean> {
  try {
    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('employee_id', employeeId)
      .eq('is_active', true);

    if (error || !tokens || tokens.length === 0) {
      console.error('No active push tokens found for user');
      return false;
    }

    // Send test notification using Expo's push service
    const notifications = tokens.map(tokenData => ({
      to: tokenData.token,
      title: 'Test Notification',
      body: 'This is a test notification from Skiftappen',
      data: {
        type: 'test',
      },
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notifications),
    });

    const result = await response.json();
    console.log('Test notification sent:', result);
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
}