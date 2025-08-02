import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { PremiumGate } from './PremiumGate';
import { usePremiumStatus } from '../hooks/usePremiumStatus';

interface Shift {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  description?: string;
}

interface CalendarExportProps {
  shifts: Shift[];
  onExportComplete?: (success: boolean) => void;
}

export const CalendarExport: React.FC<CalendarExportProps> = ({
  shifts,
  onExportComplete,
}) => {
  const { isPremium } = usePremiumStatus();
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'google' | 'apple' | 'ics' | null>(null);

  // Skapa ICS-fil för kalenderexport
  const createICSFile = (shifts: Shift[]): string => {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SkiftApp//SkiftApp//SV',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    shifts.forEach((shift) => {
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${shift.id}@skiftapp.se`,
        `DTSTART:${formatDate(shift.startDate)}`,
        `DTEND:${formatDate(shift.endDate)}`,
        `SUMMARY:${shift.title}`,
        `DESCRIPTION:${shift.description || 'Skift från SkiftApp'}`,
        `LOCATION:${shift.location || ''}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');
    return icsContent.join('\r\n');
  };

  // Exportera till enhetskalender (iOS/Android)
  const exportToDeviceCalendar = async () => {
    try {
      // Begär kalenderbehörigheter
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Behörighet krävs', 'Vi behöver tillgång till din kalender för att exportera skift.');
        return false;
      }

      // Hitta eller skapa SkiftApp-kalender
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      let skiftCalendar = calendars.find(cal => cal.title === 'SkiftApp');

      if (!skiftCalendar) {
        const defaultCalendarSource = Platform.OS === 'ios'
          ? await Calendar.getDefaultCalendarAsync()
          : { isLocalAccount: true, name: 'SkiftApp' };

        const calendarId = await Calendar.createCalendarAsync({
          title: 'SkiftApp',
          color: '#2563eb',
          entityType: Calendar.EntityTypes.EVENT,
          sourceId: defaultCalendarSource.source?.id,
          source: defaultCalendarSource.source,
          name: 'SkiftApp',
          ownerAccount: 'personal',
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });

        skiftCalendar = await Calendar.getCalendarAsync(calendarId);
      }

      // Lägg till alla skift i kalendern
      let successCount = 0;
      for (const shift of shifts) {
        try {
          await Calendar.createEventAsync(skiftCalendar.id, {
            title: shift.title,
            startDate: shift.startDate,
            endDate: shift.endDate,
            location: shift.location,
            notes: shift.description || 'Skift från SkiftApp',
            timeZone: 'Europe/Stockholm',
          });
          successCount++;
        } catch (error) {
          console.error('Error creating event:', error);
        }
      }

      if (successCount > 0) {
        Alert.alert(
          'Export lyckad!',
          `${successCount} av ${shifts.length} skift har lagts till i din kalender.`,
          [{ text: 'OK' }]
        );
        return true;
      } else {
        throw new Error('Inga skift kunde läggas till');
      }

    } catch (error) {
      console.error('Calendar export error:', error);
      Alert.alert('Export misslyckad', 'Kunde inte exportera skift till kalendern.');
      return false;
    }
  };

  // Exportera som ICS-fil
  const exportAsICSFile = async () => {
    try {
      const icsContent = createICSFile(shifts);
      const fileName = `skiftapp-export-${new Date().toISOString().split('T')[0]}.ics`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, icsContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/calendar',
          dialogTitle: 'Exportera skift till kalender',
        });
        return true;
      } else {
        Alert.alert('Delning ej tillgänglig', 'Kunde inte dela kalenderfilen.');
        return false;
      }

    } catch (error) {
      console.error('ICS export error:', error);
      Alert.alert('Export misslyckad', 'Kunde inte skapa kalenderfil.');
      return false;
    }
  };

  // Hantera export
  const handleExport = async (type: 'google' | 'apple' | 'ics') => {
    if (!isPremium) return;

    setIsExporting(true);
    setExportType(type);

    try {
      let success = false;

      switch (type) {
        case 'apple':
        case 'google':
          success = await exportToDeviceCalendar();
          break;
        case 'ics':
          success = await exportAsICSFile();
          break;
      }

      onExportComplete?.(success);

    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const exportContent = (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="calendar-outline" size={32} color="#2563eb" />
        </View>
        <Text style={styles.title}>Kalenderexport</Text>
        <Text style={styles.subtitle}>
          Exportera {shifts.length} skift till din kalender
        </Text>
      </View>

      <View style={styles.exportOptions}>
        {/* Apple Calendar */}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => handleExport('apple')}
          disabled={isExporting}
        >
          <LinearGradient
            colors={['#000000', '#333333']}
            style={styles.exportButtonGradient}
          >
            {isExporting && exportType === 'apple' ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="logo-apple" size={24} color="white" />
            )}
            <Text style={styles.exportButtonText}>Apple Calendar</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Google Calendar */}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => handleExport('google')}
          disabled={isExporting}
        >
          <LinearGradient
            colors={['#4285f4', '#34a853']}
            style={styles.exportButtonGradient}
          >
            {isExporting && exportType === 'google' ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="logo-google" size={24} color="white" />
            )}
            <Text style={styles.exportButtonText}>Google Calendar</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* ICS File */}
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => handleExport('ics')}
          disabled={isExporting}
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={styles.exportButtonGradient}
          >
            {isExporting && exportType === 'ics' ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="download-outline" size={24} color="white" />
            )}
            <Text style={styles.exportButtonText}>Ladda ner ICS-fil</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <View style={styles.infoItem}>
          <Ionicons name="information-circle-outline" size={20} color="#64748b" />
          <Text style={styles.infoText}>
            Skift läggs till i en separat "SkiftApp" kalender
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="sync-outline" size={20} color="#64748b" />
          <Text style={styles.infoText}>
            Uppdateringar synkroniseras automatiskt
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <PremiumGate
      feature="calendar_export"
      featureName="Kalenderexport"
      description="Exportera dina skift till Google Calendar, Apple Calendar eller som ICS-fil"
    >
      {exportContent}
    </PremiumGate>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  exportOptions: {
    marginBottom: 30,
  },
  exportButton: {
    marginBottom: 16,
  },
  exportButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 12,
  },
  info: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 12,
    flex: 1,
  },
});