import React from 'react';
import {
    Alert,
    Linking,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Shift {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  shift_team_id: string;
  team_name: string;
  color_hex: string;
}

interface CalendarIntegrationProps {
  shift: Shift;
  onSuccess?: () => void;
}

export default function CalendarIntegration({ shift, onSuccess }: CalendarIntegrationProps) {
  const addToCalendar = async () => {
    try {
      const startDate = new Date(shift.start_time);
      const endDate = new Date(shift.end_time);
      
      // Format dates for calendar
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      const startFormatted = formatDate(startDate);
      const endFormatted = formatDate(endDate);
      
      // Create calendar event URL
      const eventTitle = encodeURIComponent(shift.title);
      const eventDescription = encodeURIComponent(`Skift: ${shift.team_name}`);
      const location = encodeURIComponent('Arbetsplats');
      
      let calendarUrl = '';
      
      if (Platform.OS === 'ios') {
        // iOS Calendar (EventKit)
        calendarUrl = `calshow://?event=${eventTitle}&start=${startFormatted}&end=${endFormatted}&location=${location}&notes=${eventDescription}`;
      } else if (Platform.OS === 'android') {
        // Android Calendar Intent
        calendarUrl = `content://com.android.calendar/time/${startDate.getTime()}`;
        
        // Alternative: Use Google Calendar web URL
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${startFormatted}/${endFormatted}&details=${eventDescription}&location=${location}`;
        
        // Try to open Google Calendar first, fallback to native calendar
        const canOpenGoogleCalendar = await Linking.canOpenURL(googleCalendarUrl);
        if (canOpenGoogleCalendar) {
          await Linking.openURL(googleCalendarUrl);
          onSuccess?.();
          return;
        }
      }
      
      // Try to open native calendar
      const canOpenCalendar = await Linking.canOpenURL(calendarUrl);
      if (canOpenCalendar) {
        await Linking.openURL(calendarUrl);
        onSuccess?.();
      } else {
        // Fallback: Create a calendar event file
        await createCalendarEventFile();
      }
      
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert(
        'Fel',
        'Kunde inte lägga till i kalender. Kontrollera att du har en kalenderapp installerad.'
      );
    }
  };

  const createCalendarEventFile = async () => {
    try {
      const startDate = new Date(shift.start_time);
      const endDate = new Date(shift.end_time);
      
      // Create ICS file content
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Skiftapp//Calendar Event//SV',
        'BEGIN:VEVENT',
        `UID:${shift.id}@skiftapp.com`,
        `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `SUMMARY:${shift.title}`,
        `DESCRIPTION:Skift: ${shift.team_name}`,
        `LOCATION:Arbetsplats`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
      
      // For React Native, we can share the ICS content
      // In a real app, you might want to use react-native-share or similar
      Alert.alert(
        'Kalenderfil skapad',
        'En kalenderfil har skapats. Du kan importera den till din kalenderapp.',
        [
          {
            text: 'Kopiera',
            onPress: () => {
              // In a real implementation, you would copy to clipboard
              console.log('ICS Content:', icsContent);
            }
          },
          {
            text: 'Avbryt',
            style: 'cancel'
          }
        ]
      );
      
      onSuccess?.();
      
    } catch (error) {
      console.error('Error creating calendar file:', error);
      Alert.alert('Fel', 'Kunde inte skapa kalenderfil.');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.shiftInfo}>
        <Text style={styles.shiftTitle}>{shift.title}</Text>
        <Text style={styles.shiftTime}>
          {formatDate(shift.start_time)} • {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
        </Text>
        <Text style={styles.shiftTeam}>{shift.team_name}</Text>
      </View>
      
      <TouchableOpacity
        style={styles.addToCalendarButton}
        onPress={addToCalendar}
      >
        <Text style={styles.buttonText}>Lägg till i kalender</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  shiftInfo: {
    marginBottom: 16,
  },
  shiftTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  shiftTeam: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  addToCalendarButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 