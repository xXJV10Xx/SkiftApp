import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { exportToGoogleCalendar, getAuthUrl, getTokensFromCode } from '../lib/googleCalendar';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

interface GoogleCalendarExportProps {
  events: Array<{
    title: string;
    description?: string;
    start: string | Date;
    end: string | Date;
  }>;
  onExportComplete?: () => void;
}

export default function GoogleCalendarExport({ events, onExportComplete }: GoogleCalendarExportProps) {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [googleTokens, setGoogleTokens] = useState(null);

  const handleGoogleAuth = async () => {
    setIsAuthenticating(true);
    try {
      // Generera OAuth URL
      const authUrl = getAuthUrl();
      
      // Öppna webbläsare för autentisering
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000'
      );

      if (result.type === 'success' && result.url) {
        // Extrahera authorization code från URL
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        
        if (code) {
          // Hämta tokens
          const tokens = await getTokensFromCode(code);
          setGoogleTokens(tokens);
          Alert.alert('Framgång', 'Google Kalender-autentisering slutförd!');
        } else {
          Alert.alert('Fel', 'Kunde inte hämta auktoriseringskod');
        }
      } else {
        Alert.alert('Avbruten', 'Google-autentisering avbröts');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      Alert.alert('Fel', 'Ett fel uppstod vid Google-autentisering');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleExportToGoogle = async () => {
    if (!googleTokens) {
      Alert.alert('Fel', 'Du måste först autentisera med Google');
      return;
    }

    if (!events || events.length === 0) {
      Alert.alert('Ingen data', 'Inga skift att exportera');
      return;
    }

    setIsExporting(true);
    try {
      await exportToGoogleCalendar(events, googleTokens);
      Alert.alert(
        'Export slutförd!', 
        `${events.length} skift har exporterats till Google Kalender`,
        [{ text: 'OK', onPress: onExportComplete }]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export misslyckades', 'Ett fel uppstod vid export till Google Kalender');
    } finally {
      setIsExporting(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Du måste vara inloggad för att exportera till Google Kalender</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google Kalender Export</Text>
      <Text style={styles.description}>
        Exportera dina skift till Google Kalender
      </Text>

      {!googleTokens ? (
        <TouchableOpacity
          style={[styles.button, styles.authButton, isAuthenticating && styles.buttonDisabled]}
          onPress={handleGoogleAuth}
          disabled={isAuthenticating}
        >
          <Ionicons name="logo-google" size={20} color="#fff" />
          <Text style={styles.buttonText}>
            {isAuthenticating ? 'Autentiserar...' : 'Anslut till Google Kalender'}
          </Text>
          {isAuthenticating && <ActivityIndicator size="small" color="#fff" style={styles.spinner} />}
        </TouchableOpacity>
      ) : (
        <View>
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#28a745" />
            <Text style={styles.statusText}>Ansluten till Google Kalender</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.button, styles.exportButton, isExporting && styles.buttonDisabled]}
            onPress={handleExportToGoogle}
            disabled={isExporting}
          >
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {isExporting ? 'Exporterar...' : `Exportera ${events?.length || 0} skift`}
            </Text>
            {isExporting && <ActivityIndicator size="small" color="#fff" style={styles.spinner} />}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Information:</Text>
        <Text style={styles.infoItem}>• Skift exporteras till din primära Google Kalender</Text>
        <Text style={styles.infoItem}>• Befintliga händelser påverkas inte</Text>
        <Text style={styles.infoItem}>• Du kan redigera eller ta bort exporterade händelser i Google Kalender</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  authButton: {
    backgroundColor: '#4285F4',
  },
  exportButton: {
    backgroundColor: '#28a745',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  spinner: {
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#d4edda',
    borderRadius: 6,
  },
  statusText: {
    marginLeft: 8,
    color: '#155724',
    fontWeight: '500',
  },
  info: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});