import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, Share } from 'react-native';
import { useSubscription } from '../hooks/useSubscription';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface Shift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  position?: string;
  location?: string;
  notes?: string;
}

interface CalendarExportProps {
  shifts: Shift[];
  companyName?: string;
}

export default function CalendarExport({ shifts, companyName = 'Skiftappen' }: CalendarExportProps) {
  const { subscriptionStatus, checkExportAccess } = useSubscription();
  const [exporting, setExporting] = useState(false);

  const generateICSContent = (shifts: Shift[]): string => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Skiftappen//Shift Calendar//SV',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${companyName} - Skift`,
      'X-WR-TIMEZONE:Europe/Stockholm',
      'X-WR-CALDESC:Skiftschema från Skiftappen'
    ].join('\r\n');

    shifts.forEach((shift, index) => {
      const shiftDate = new Date(shift.date);
      const [startHour, startMinute] = shift.start_time.split(':').map(Number);
      const [endHour, endMinute] = shift.end_time.split(':').map(Number);
      
      const startDateTime = new Date(shiftDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      const endDateTime = new Date(shiftDate);
      endDateTime.setHours(endHour, endMinute, 0, 0);
      
      // Hantera skift som går över midnatt
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      const formatDateTime = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const uid = `shift-${shift.id}-${index}@skiftappen.com`;
      const summary = shift.position ? `Skift - ${shift.position}` : 'Skift';
      const location = shift.location || companyName;
      const description = [
        `Skift: ${shift.start_time} - ${shift.end_time}`,
        shift.position && `Position: ${shift.position}`,
        shift.notes && `Anteckningar: ${shift.notes}`,
        'Skapad av Skiftappen'
      ].filter(Boolean).join('\\n');

      icsContent += '\r\n' + [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${timestamp}`,
        `DTSTART:${formatDateTime(startDateTime)}`,
        `DTEND:${formatDateTime(endDateTime)}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      ].join('\r\n');
    });

    icsContent += '\r\nEND:VCALENDAR';
    return icsContent;
  };

  const handleExportICS = async () => {
    if (!checkExportAccess()) {
      return;
    }

    if (shifts.length === 0) {
      Alert.alert('Inga skift', 'Det finns inga skift att exportera.');
      return;
    }

    setExporting(true);

    try {
      const icsContent = generateICSContent(shifts);
      const fileName = `skift-${companyName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.ics`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, icsContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/calendar',
          dialogTitle: 'Exportera skift till kalender',
        });
      } else {
        // Fallback för plattformar som inte stöder Sharing
        Alert.alert(
          'Export klar',
          `Kalenderfilen har sparats som ${fileName}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Exportfel', 'Kunde inte exportera skiften. Försök igen.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportToGoogleCalendar = async () => {
    if (!checkExportAccess()) {
      return;
    }

    try {
      const icsContent = generateICSContent(shifts);
      const encodedContent = encodeURIComponent(icsContent);
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Import%20Shifts&details=${encodedContent}`;
      
      // Detta skulle öppna Google Calendar i webläsaren
      // I en riktig app skulle du använda WebBrowser.openBrowserAsync
      Alert.alert(
        'Google Calendar',
        'Öppnar Google Calendar för import...',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Google Calendar export error:', error);
      Alert.alert('Exportfel', 'Kunde inte öppna Google Calendar.');
    }
  };

  if (subscriptionStatus.loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Laddar...</ThemedText>
      </ThemedView>
    );
  }

  if (!subscriptionStatus.hasExportAccess) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.lockedSection}>
          <Text style={styles.lockIcon}>🔒</Text>
          <ThemedText style={styles.lockedTitle}>Kalenderexport</ThemedText>
          <ThemedText style={styles.lockedDescription}>
            Köp export-funktionen för att exportera dina skift till Google Calendar, Apple Calendar eller andra kalenderappar.
          </ThemedText>
          <Text style={styles.price}>99 kr - Engångsköp</Text>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        📅 Kalenderexport
      </ThemedText>
      
      <ThemedText style={styles.description}>
        Exportera {shifts.length} skift till din kalender
      </ThemedText>

      <View style={styles.buttonContainer}>
        <Text 
          style={[styles.exportButton, exporting && styles.disabledButton]}
          onPress={exporting ? undefined : handleExportICS}
        >
          {exporting ? 'Exporterar...' : '📱 Ladda ner .ics-fil'}
        </Text>
        
        <Text 
          style={[styles.exportButton, styles.googleButton]}
          onPress={handleExportToGoogleCalendar}
        >
          📅 Öppna i Google Calendar
        </Text>
      </View>

      <ThemedView style={styles.infoSection}>
        <ThemedText style={styles.infoTitle}>ℹ️ Så här gör du:</ThemedText>
        <ThemedText style={styles.infoText}>
          1. Tryck på "Ladda ner .ics-fil"{'\n'}
          2. Öppna filen i din kalenderapp{'\n'}
          3. Skiften importeras automatiskt{'\n'}
          4. Synkroniseras med alla dina enheter
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  exportButton: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#007AFF',
    color: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.6,
  },
  lockedSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lockedDescription: {
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.7,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  infoSection: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    lineHeight: 20,
    opacity: 0.8,
  },
});