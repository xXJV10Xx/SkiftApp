import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Alert, StyleSheet, Share } from 'react-native';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import SubscriptionScreen from './SubscriptionScreen';

interface CalendarExportViewProps {
  shifts?: any[]; // Array of shift data
  onExportComplete?: () => void;
}

interface UserData {
  is_premium: boolean;
  has_paid_export: boolean;
  trial_started_at: string;
}

export default function CalendarExportView({ 
  shifts = [], 
  onExportComplete 
}: CalendarExportViewProps) {
  const user = useUser();
  const supabase = useSupabaseClient();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_premium, has_paid_export, trial_started_at')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateICSContent = (shifts: any[]) => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SkiftApp//Shift Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Skiftschema',
      'X-WR-CALDESC:Importerat skiftschema från SkiftApp',
      'X-WR-TIMEZONE:Europe/Stockholm'
    ];

    shifts.forEach((shift, index) => {
      if (!shift.date || !shift.startTime || !shift.endTime) return;

      const shiftDate = new Date(shift.date);
      const startDateTime = new Date(`${shift.date}T${shift.startTime}`);
      const endDateTime = new Date(`${shift.date}T${shift.endTime}`);
      
      // Handle overnight shifts
      if (endDateTime < startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      const formatDateTime = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const uid = `shift-${index}-${timestamp}@skiftapp.se`;
      const summary = shift.type || 'Skift';
      const description = [
        shift.description && `Beskrivning: ${shift.description}`,
        shift.location && `Plats: ${shift.location}`,
        shift.team && `Team: ${shift.team}`,
        'Skapad av SkiftApp'
      ].filter(Boolean).join('\\n');

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${timestamp}`,
        `DTSTART:${formatDateTime(startDateTime)}`,
        `DTEND:${formatDateTime(endDateTime)}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        shift.location && `LOCATION:${shift.location}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');
    return icsContent.filter(Boolean).join('\r\n');
  };

  const handleExportIcs = async () => {
    if (!shifts || shifts.length === 0) {
      Alert.alert('Ingen data', 'Det finns inga skift att exportera.');
      return;
    }

    setExporting(true);

    try {
      const icsContent = generateICSContent(shifts);
      const fileName = `skiftschema-${new Date().toISOString().split('T')[0]}.ics`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Write ICS file
      await FileSystem.writeAsStringAsync(fileUri, icsContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          UTI: 'com.apple.ical.ics',
          mimeType: 'text/calendar',
          dialogTitle: 'Exportera skiftschema till kalender'
        });
      } else {
        // Fallback for platforms without sharing
        await Share.share({
          url: fileUri,
          title: 'Skiftschema Export',
          message: 'Ditt skiftschema har exporterats som en ICS-fil.'
        });
      }

      Alert.alert(
        'Export klar!',
        'Ditt skiftschema har exporterats. Du kan nu importera det i din kalenderapp.',
        [{ text: 'OK', onPress: onExportComplete }]
      );

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export misslyckades', 'Kunde inte exportera schemat. Försök igen.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Laddar...</ThemedText>
      </ThemedView>
    );
  }

  if (!userData) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Kunde inte ladda användardata</ThemedText>
      </ThemedView>
    );
  }

  const trialDays = userData.trial_started_at 
    ? Math.floor((Date.now() - new Date(userData.trial_started_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const trialDaysLeft = Math.max(0, 7 - trialDays);
  const isTrialActive = trialDaysLeft > 0;
  const canExport = userData.is_premium || userData.has_paid_export || isTrialActive;

  if (!canExport) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.lockContainer}>
          <ThemedText type="title" style={styles.lockTitle}>
            📅 Kalenderexport
          </ThemedText>
          <ThemedText style={styles.lockDescription}>
            Export till kalender kräver antingen Premium-prenumeration eller engångsbetalning.
          </ThemedText>
          
          <View style={styles.featureList}>
            <ThemedText style={styles.feature}>📱 Exportera till alla kalenderappar</ThemedText>
            <ThemedText style={styles.feature}>🔄 Automatisk formatering</ThemedText>
            <ThemedText style={styles.feature}>⏰ Inkluderar alla skifttider</ThemedText>
            <ThemedText style={styles.feature}>📍 Plats och beskrivningar</ThemedText>
          </View>
        </View>
        
        <SubscriptionScreen />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">📅 Kalenderexport</ThemedText>
        {userData.is_premium ? (
          <View style={styles.premiumBadge}>
            <ThemedText style={styles.premiumText}>✨ Premium</ThemedText>
          </View>
        ) : userData.has_paid_export ? (
          <View style={styles.paidBadge}>
            <ThemedText style={styles.paidText}>✅ Betald export</ThemedText>
          </View>
        ) : (
          <View style={styles.trialBadge}>
            <ThemedText style={styles.trialText}>🆓 Provperiod</ThemedText>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <ThemedText style={styles.description}>
          Exportera ditt skiftschema till din kalenderapp. Filen kommer att vara kompatibel med Google Kalender, Apple Kalender, Outlook och andra kalenderprogram.
        </ThemedText>

        <View style={styles.shiftInfo}>
          <ThemedText style={styles.shiftCount}>
            📊 {shifts.length} skift att exportera
          </ThemedText>
          {shifts.length > 0 && (
            <ThemedText style={styles.dateRange}>
              📅 {new Date(Math.min(...shifts.map(s => new Date(s.date).getTime()))).toLocaleDateString('sv-SE')} - {new Date(Math.max(...shifts.map(s => new Date(s.date).getTime()))).toLocaleDateString('sv-SE')}
            </ThemedText>
          )}
        </View>

        <TouchableOpacity
          style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
          onPress={handleExportIcs}
          disabled={exporting || shifts.length === 0}
        >
          <ThemedText style={styles.exportButtonText}>
            {exporting ? '📤 Exporterar...' : '📤 Ladda ner .ICS och exportera'}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.instructions}>
          <ThemedText type="subtitle" style={styles.instructionsTitle}>
            Så här importerar du:
          </ThemedText>
          <View style={styles.instructionsList}>
            <ThemedText style={styles.instruction}>
              🍎 <ThemedText style={styles.bold}>Apple Kalender:</ThemedText> Öppna filen direkt eller importera via Inställningar
            </ThemedText>
            <ThemedText style={styles.instruction}>
              📧 <ThemedText style={styles.bold}>Google Kalender:</ThemedText> Gå till Inställningar {'>'} Importera & exportera
            </ThemedText>
            <ThemedText style={styles.instruction}>
              💼 <ThemedText style={styles.bold}>Outlook:</ThemedText> Fil {'>'} Öppna & exportera {'>'} Importera/exportera
            </ThemedText>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  premiumText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  paidBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  paidText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trialBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  trialText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    opacity: 0.8,
  },
  shiftInfo: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  shiftCount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dateRange: {
    fontSize: 14,
    opacity: 0.7,
  },
  exportButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  exportButtonDisabled: {
    backgroundColor: '#ccc',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructions: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
  },
  instructionsTitle: {
    marginBottom: 15,
  },
  instructionsList: {
    gap: 12,
  },
  instruction: {
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
  lockContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    marginBottom: 30,
  },
  lockTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  lockDescription: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
    lineHeight: 22,
  },
  featureList: {
    gap: 8,
    alignItems: 'flex-start',
  },
  feature: {
    fontSize: 14,
  },
});