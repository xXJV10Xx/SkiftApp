import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  let token;

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
    return;
  }
  
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Push token:', token);

  return token;
};

export const schedulePushNotification = async (
  title: string,
  body: string,
  data?: any
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Send immediately
  });
};

export const sendChatNotification = async (
  senderName: string,
  message: string,
  teamName: string
) => {
  await schedulePushNotification(
    `Nytt meddelande från ${senderName}`,
    `${message}`,
    {
      type: 'chat',
      team: teamName,
    }
  );
};

// Schedule notification for calendar events
export const scheduleCalendarNotification = async (
  title: string,
  body: string,
  triggerDate: Date,
  data?: any
) => {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: {
        type: 'calendar',
        ...data,
      },
    },
    trigger: {
      date: triggerDate,
    },
  });
  
  return identifier;
};

// Schedule shift reminder notifications
export const scheduleShiftReminder = async (
  shiftDate: Date,
  shiftTime: string,
  shiftType: string,
  reminderMinutes: number = 30
) => {
  const [hours, minutes] = shiftTime.split(':').map(Number);
  const shiftDateTime = new Date(shiftDate);
  shiftDateTime.setHours(hours, minutes, 0, 0);
  
  const reminderTime = new Date(shiftDateTime.getTime() - (reminderMinutes * 60 * 1000));
  
  // Don't schedule notifications for past dates
  if (reminderTime <= new Date()) {
    return null;
  }
  
  const identifier = await scheduleCalendarNotification(
    `Skiftpåminnelse: ${shiftType}`,
    `Ditt ${shiftType.toLowerCase()}skift börjar om ${reminderMinutes} minuter (${shiftTime})`,
    reminderTime,
    {
      shiftDate: shiftDate.toISOString(),
      shiftTime,
      shiftType,
      reminderMinutes,
    }
  );
  
  return identifier;
};

// Schedule custom calendar event notification
export const scheduleCustomEventNotification = async (
  eventTitle: string,
  eventDate: Date,
  notificationTime: Date,
  notes?: string
) => {
  const identifier = await scheduleCalendarNotification(
    `Kalenderpåminnelse: ${eventTitle}`,
    notes || `Du har en händelse: ${eventTitle}`,
    notificationTime,
    {
      eventTitle,
      eventDate: eventDate.toISOString(),
      notes,
    }
  );
  
  return identifier;
};

// Cancel scheduled notification
export const cancelScheduledNotification = async (identifier: string) => {
  await Notifications.cancelScheduledNotificationAsync(identifier);
};

// Get all scheduled notifications
export const getAllScheduledNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
}; 