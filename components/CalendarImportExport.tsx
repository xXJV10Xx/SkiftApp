import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface CalendarImportExportProps {
  onImportSuccess?: (count: number) => void;
  onExportSuccess?: (url: string) => void;
}

export const CalendarImportExport: React.FC<CalendarImportExportProps> = ({
  onImportSuccess,
  onExportSuccess,
}) => {
  const [icsUrl, setIcsUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleImportICS = async () => {
    if (!icsUrl.trim()) {
      Alert.alert('Fel', 'Vänligen ange en giltig ICS-URL');
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch('/api/import-ics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ icsUrl: icsUrl.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Import lyckades!',
          `${data.imported} skift har importerats från kalendern.`
        );
        onImportSuccess?.(data.imported);
        setIcsUrl('');
      } else {
        Alert.alert('Import misslyckades', data.error || 'Okänt fel uppstod');
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import misslyckades', 'Kunde inte ansluta till servern');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportICS = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export.ics');
      
      if (response.ok) {
        const exportUrl = `${window.location.origin}/api/export.ics`;
        Alert.alert(
          'Export klar!',
          'Din kalender är redo för export. Kopiera länken nedan för att prenumerera i Apple Kalender eller Google Calendar.',
          [
            {
              text: 'Kopiera länk',
              onPress: () => {
                // För web - använd navigator.clipboard
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(exportUrl);
                }
                onExportSuccess?.(exportUrl);
              },
            },
            { text: 'OK' },
          ]
        );
      } else {
        Alert.alert('Export misslyckades', 'Kunde inte skapa kalenderexport');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export misslyckades', 'Kunde inte ansluta till servern');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Import Section */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            📥 Importera Kalender
          </ThemedText>
          <ThemedText style={styles.description}>
            Importera skift från en extern kalender (ICS-format)
          </ThemedText>
          
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>ICS Kalender-URL:</ThemedText>
            <TextInput
              style={styles.textInput}
              value={icsUrl}
              onChangeText={setIcsUrl}
              placeholder="https://example.com/calendar.ics"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, styles.importButton, isImporting && styles.buttonDisabled]}
            onPress={handleImportICS}
            disabled={isImporting}
          >
            <Text style={styles.buttonText}>
              {isImporting ? '⏳ Importerar...' : '📥 Importera Skift'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Export Section */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            📤 Exportera Kalender
          </ThemedText>
          <ThemedText style={styles.description}>
            Exportera dina skift till Apple Kalender, Google Calendar eller andra kalenderapp
          </ThemedText>

          <TouchableOpacity
            style={[styles.button, styles.exportButton, isExporting && styles.buttonDisabled]}
            onPress={handleExportICS}
            disabled={isExporting}
          >
            <Text style={styles.buttonText}>
              {isExporting ? '⏳ Skapar export...' : '📤 Skapa Kalender-länk'}
            </Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <ThemedText style={styles.infoText}>
              💡 <Text style={styles.bold}>Tips:</Text> När du har skapat kalender-länken kan du:
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • Prenumerera i Apple Kalender (iPhone/Mac)
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • Lägga till i Google Calendar
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • Importera i Outlook eller andra kalenderapp
            </ThemedText>
          </View>
        </View>

        {/* Google Calendar Integration */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            📅 Google Calendar Synkning
          </ThemedText>
          <ThemedText style={styles.description}>
            Synka automatiskt med din Google Calendar
          </ThemedText>

          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={() => {
              // Implementera Google OAuth flow här
              Alert.alert('Google Calendar', 'Google Calendar integration kommer snart!');
            }}
          >
            <Text style={styles.buttonText}>
              🔗 Anslut Google Calendar
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  description: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#34495e',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#2c3e50',
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  importButton: {
    backgroundColor: '#3498db',
  },
  exportButton: {
    backgroundColor: '#27ae60',
  },
  googleButton: {
    backgroundColor: '#e74c3c',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
});