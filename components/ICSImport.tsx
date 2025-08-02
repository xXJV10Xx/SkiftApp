import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import { importFromFile, importFromURL } from '../lib/ics-import'

interface ICSImportProps {
  calendarId: string
  onImportComplete?: (count: number) => void
}

export default function ICSImport({ calendarId, onImportComplete }: ICSImportProps) {
  const [icsUrl, setIcsUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFileImport = async () => {
    try {
      setLoading(true)
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/calendar', 'text/plain'],
        copyToCacheDirectory: true
      })

      if (result.canceled) {
        return
      }

      const file = result.assets[0]
      
      // Create File object from URI
      const response = await fetch(file.uri)
      const blob = await response.blob()
      const fileObj = new File([blob], file.name, { type: file.mimeType || 'text/calendar' })

      const importedEvents = await importFromFile(fileObj, calendarId)
      
      Alert.alert(
        '✅ Import klar',
        `Importerade ${importedEvents?.length || 0} skift från ${file.name}`,
        [{ text: 'OK', onPress: () => onImportComplete?.(importedEvents?.length || 0) }]
      )

    } catch (error) {
      console.error('❌ Fil-import misslyckades:', error)
      Alert.alert('❌ Import misslyckades', 'Kunde inte importera ICS-filen')
    } finally {
      setLoading(false)
    }
  }

  const handleUrlImport = async () => {
    if (!icsUrl.trim()) {
      Alert.alert('❌ Fel', 'Ange en giltig URL')
      return
    }

    try {
      setLoading(true)
      
      const importedEvents = await importFromURL(icsUrl.trim(), calendarId)
      
      Alert.alert(
        '✅ Import klar',
        `Importerade ${importedEvents?.length || 0} skift från URL`,
        [{ text: 'OK', onPress: () => onImportComplete?.(importedEvents?.length || 0) }]
      )
      
      setIcsUrl('')

    } catch (error) {
      console.error('❌ URL-import misslyckades:', error)
      Alert.alert('❌ Import misslyckades', 'Kunde inte hämta ICS från URL')
    } finally {
      setLoading(false)
    }
  }

  const commonICSProviders = [
    {
      name: 'Google Calendar',
      description: 'Exportera från Google Calendar',
      instructions: '1. Gå till Google Calendar\n2. Inställningar → Import & export\n3. Exportera → Ladda ner .ics fil'
    },
    {
      name: 'Outlook',
      description: 'Exportera från Outlook',
      instructions: '1. Öppna Outlook\n2. Fil → Öppna och exportera → Importera/exportera\n3. Välj "Exportera till fil" → iCalendar'
    },
    {
      name: 'Apple Calendar',
      description: 'Exportera från Apple Calendar',
      instructions: '1. Öppna Calendar\n2. Välj kalender i sidofältet\n3. Fil → Exportera → Exportera'
    }
  ]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📥 Importera skift</Text>
        <Text style={styles.subtitle}>
          Importera skift från ICS-filer eller kalender-URL:er
        </Text>
      </View>

      {/* URL Import */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Importera från URL</Text>
        <Text style={styles.sectionDescription}>
          Ange URL till en ICS-kalender (t.ex. Google Calendar offentlig länk)
        </Text>
        
        <View style={styles.urlInputContainer}>
          <TextInput
            style={styles.urlInput}
            placeholder="https://calendar.google.com/calendar/ical/..."
            value={icsUrl}
            onChangeText={setIcsUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity 
            style={[styles.importButton, !icsUrl.trim() && styles.importButtonDisabled]}
            onPress={handleUrlImport}
            disabled={!icsUrl.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* File Import */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Importera från fil</Text>
        <Text style={styles.sectionDescription}>
          Välj en ICS-fil från din enhet
        </Text>
        
        <TouchableOpacity 
          style={styles.fileButton}
          onPress={handleFileImport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Ionicons name="document-outline" size={24} color="#3B82F6" />
          )}
          <Text style={styles.fileButtonText}>
            {loading ? 'Importerar...' : 'Välj ICS-fil'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Common Providers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vanliga kalendertjänster</Text>
        
        {commonICSProviders.map((provider, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.providerCard}
            onPress={() => Alert.alert(provider.name, provider.instructions)}
          >
            <View style={styles.providerHeader}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <Ionicons name="information-circle-outline" size={20} color="#64748b" />
            </View>
            <Text style={styles.providerDescription}>{provider.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Tips</Text>
        <Text style={styles.tipsText}>
          • ICS-filer är standardformat för kalendrar{'\n'}
          • Du kan importera från de flesta kalendertjänster{'\n'}
          • Befintliga skift med samma tid kommer att hoppas över{'\n'}
          • Importerade skift läggs till i den valda kalendern
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b'
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16
  },
  urlInputContainer: {
    flexDirection: 'row',
    gap: 12
  },
  urlInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9fafb'
  },
  importButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50
  },
  importButtonDisabled: {
    backgroundColor: '#d1d5db'
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    gap: 12
  },
  fileButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3B82F6'
  },
  providerCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  providerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b'
  },
  providerDescription: {
    fontSize: 14,
    color: '#64748b'
  },
  tipsSection: {
    backgroundColor: '#fefce8',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fbbf24'
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8
  },
  tipsText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20
  }
})