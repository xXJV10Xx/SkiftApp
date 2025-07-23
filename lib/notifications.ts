import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// FCM Token management
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    token = tokenData.data;
    console.log('Push token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  return token;
}

// Update user's FCM token in the database
export async function updateUserFCMToken(userId: string, fcmToken: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ fcm_token: fcmToken })
      .eq('id', userId);

    if (error) {
      console.error('Error updating FCM token:', error);
      return false;
    }

    console.log('FCM token updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return false;
  }
}

// Clear FCM token on logout
export async function clearUserFCMToken(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ fcm_token: null })
      .eq('id', userId);

    if (error) {
      console.error('Error clearing FCM token:', error);
      return false;
    }

    console.log('FCM token cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing FCM token:', error);
    return false;
  }
}

// Handle notification received while app is in foreground
export function setupNotificationListeners() {
  // Handle notification received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
    
    // Handle different notification types
    const data = notification.request.content.data;
    if (data?.type === 'chat_message') {
      // Handle chat message notification
      console.log('Chat message notification:', data);
    }
  });

  // Handle notification response (when user taps on notification)
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response:', response);
    
    const data = response.notification.request.content.data;
    if (data?.type === 'chat_message') {
      // Navigate to chat
      console.log('Navigate to chat:', data.chat_id);
      // You can use your navigation system here
    }
  });

  return {
    notificationListener,
    responseListener,
  };
}

// Clean up notification listeners
export function removeNotificationListeners(listeners: any) {
  if (listeners.notificationListener) {
    Notifications.removeNotificationSubscription(listeners.notificationListener);
  }
  if (listeners.responseListener) {
    Notifications.removeNotificationSubscription(listeners.responseListener);
  }
} 