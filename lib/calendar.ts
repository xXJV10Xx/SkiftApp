import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import { Shift } from './supabase';

export interface CalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  allDay?: boolean;
}

// Request calendar permissions
export async function requestCalendarPermissions(): Promise<boolean> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Kalenderbehörighet krävs',
        'För att lägga till pass i din kalender behöver appen tillgång till kalendern.',
        [
          { text: 'Avbryt', style: 'cancel' },
          { 
            text: 'Inställningar', 
            onPress: () => {
              // On iOS, this will redirect to Settings
              if (Platform.OS === 'ios') {
                Calendar.requestCalendarPermissionsAsync();
              }
            }
          }
        ]
      );
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting calendar permissions:', error);
    return false;
  }
}

// Get default calendar
export async function getDefaultCalendar(): Promise<Calendar.Calendar | null> {
  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    // Find the default calendar
    let defaultCalendar = calendars.find(cal => cal.isPrimary) || 
                         calendars.find(cal => cal.allowsModifications) ||
                         calendars[0];

    if (!defaultCalendar) {
      console.error('No writable calendar found');
      return null;
    }

    return defaultCalendar;
  } catch (error) {
    console.error('Error getting default calendar:', error);
    return null;
  }
}

// Add shift to calendar
export async function addShiftToCalendar(shift: Shift): Promise<boolean> {
  try {
    // Request permissions
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      return false;
    }

    // Get default calendar
    const defaultCalendar = await getDefaultCalendar();
    if (!defaultCalendar) {
      Alert.alert('Fel', 'Kunde inte hitta en kalender att lägga till passet i');
      return false;
    }

    // Prepare event data
    const eventData: Calendar.Event = {
      title: shift.title,
      startDate: new Date(shift.start_time),
      endDate: new Date(shift.end_time),
      location: shift.location || undefined,
      notes: shift.description || undefined,
      calendarId: defaultCalendar.id,
      timeZone: Calendar.getTimeZone(),
    };

    // Create the event
    const eventId = await Calendar.createEventAsync(defaultCalendar.id, eventData);
    
    if (eventId) {
      Alert.alert(
        'Framgång!', 
        `Passet "${shift.title}" har lagts till i din kalender.`,
        [{ text: 'OK' }]
      );
      return true;
    } else {
      throw new Error('Failed to create event');
    }
  } catch (error) {
    console.error('Error adding shift to calendar:', error);
    Alert.alert(
      'Fel', 
      'Kunde inte lägga till passet i kalendern. Försök igen senare.',
      [{ text: 'OK' }]
    );
    return false;
  }
}

// Add custom event to calendar
export async function addEventToCalendar(event: CalendarEvent): Promise<boolean> {
  try {
    // Request permissions
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      return false;
    }

    // Get default calendar
    const defaultCalendar = await getDefaultCalendar();
    if (!defaultCalendar) {
      Alert.alert('Fel', 'Kunde inte hitta en kalender att lägga till händelsen i');
      return false;
    }

    // Prepare event data
    const eventData: Calendar.Event = {
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location || undefined,
      notes: event.notes || undefined,
      allDay: event.allDay || false,
      calendarId: defaultCalendar.id,
      timeZone: Calendar.getTimeZone(),
    };

    // Create the event
    const eventId = await Calendar.createEventAsync(defaultCalendar.id, eventData);
    
    if (eventId) {
      Alert.alert(
        'Framgång!', 
        `Händelsen "${event.title}" har lagts till i din kalender.`,
        [{ text: 'OK' }]
      );
      return true;
    } else {
      throw new Error('Failed to create event');
    }
  } catch (error) {
    console.error('Error adding event to calendar:', error);
    Alert.alert(
      'Fel', 
      'Kunde inte lägga till händelsen i kalendern. Försök igen senare.',
      [{ text: 'OK' }]
    );
    return false;
  }
}

// Check if event exists in calendar
export async function checkEventExistsInCalendar(
  title: string, 
  startDate: Date, 
  endDate: Date
): Promise<boolean> {
  try {
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      return false;
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    for (const calendar of calendars) {
      const events = await Calendar.getEventsAsync(
        [calendar.id],
        startDate,
        endDate
      );
      
      const existingEvent = events.find(event => 
        event.title === title &&
        Math.abs(new Date(event.startDate).getTime() - startDate.getTime()) < 60000 && // Within 1 minute
        Math.abs(new Date(event.endDate).getTime() - endDate.getTime()) < 60000
      );
      
      if (existingEvent) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if event exists:', error);
    return false;
  }
}

// Open device calendar at specific date
export async function openCalendarAtDate(date: Date): Promise<void> {
  try {
    // This will open the device's calendar app
    // Note: This is a platform-specific feature and may not work on all devices
    if (Platform.OS === 'ios') {
      // iOS calendar URL scheme
      const calendarUrl = `calshow:${date.getTime() / 1000}`;
      // You would need to use Linking.openURL(calendarUrl) here
      console.log('Would open iOS calendar with URL:', calendarUrl);
    } else if (Platform.OS === 'android') {
      // Android calendar intent
      const timestamp = date.getTime();
      console.log('Would open Android calendar at timestamp:', timestamp);
    }
  } catch (error) {
    console.error('Error opening calendar:', error);
  }
}