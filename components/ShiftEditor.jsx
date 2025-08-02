import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  Platform 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { uploadShiftsToSupabase, validateShiftData } from '../utils/shiftManager';

export default function ShiftEditor({ onShiftUploaded, onClose }) {
  const [shiftData, setShiftData] = useState({
    date: '',
    team: 31,
    type: 'M',
    start_time: '06:00',
    end_time: '18:00',
    location: 'Arbetsplats'
  });
  const [loading, setLoading] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [mode, setMode] = useState('single'); // 'single' eller 'bulk'

  const handleSingleShiftUpload = async () => {
    setLoading(true);
    try {
      const validation = validateShiftData([shiftData]);
      if (!validation.valid) {
        Alert.alert('Valideringsfel', validation.error);
        return;
      }

      const result = await uploadShiftsToSupabase([shiftData], { overwrite: true });
      
      if (result.success) {
        Alert.alert('Lyckades!', `${result.uploadedCount} skift uppladdade`);
        onShiftUploaded?.(result);
        resetForm();
      } else {
        Alert.alert('Fel', `${result.errorCount} skift misslyckades att laddas upp`);
      }
    } catch (error) {
      console.error('Error uploading shift:', error);
      Alert.alert('Fel', error.message || 'Kunde inte ladda upp skift');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    setLoading(true);
    try {
      if (!bulkData.trim()) {
        Alert.alert('Fel', 'Ange skiftdata i JSON-format');
        return;
      }

      let shifts;
      try {
        shifts = JSON.parse(bulkData);
      } catch (parseError) {
        Alert.alert('Fel', 'Ogiltigt JSON-format');
        return;
      }

      const result = await uploadShiftsToSupabase(shifts, { 
        overwrite: true,
        validateData: true 
      });
      
      if (result.success) {
        Alert.alert(
          'Lyckades!', 
          `${result.uploadedCount} av ${result.totalProcessed} skift uppladdade`
        );
        onShiftUploaded?.(result);
        setBulkData('');
      } else {
        Alert.alert(
          'Delvis lyckades', 
          `${result.uploadedCount} skift uppladdade, ${result.errorCount} misslyckades`
        );
      }
    } catch (error) {
      console.error('Error uploading bulk shifts:', error);
      Alert.alert('Fel', error.message || 'Kunde inte ladda upp skift');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShiftData({
      date: '',
      team: 31,
      type: 'M',
      start_time: '06:00',
      end_time: '18:00',
      location: 'Arbetsplats'
    });
  };

  const generateSampleData = () => {
    const sampleShifts = [
      {
        date: '2024-01-15',
        team: 31,
        type: 'M',
        start_time: '06:00',
        end_time: '14:00',
        location: 'Arbetsplats'
      },
      {
        date: '2024-01-16',
        team: 32,
        type: 'A',
        start_time: '14:00',
        end_time: '22:00',
        location: 'Arbetsplats'
      }
    ];
    setBulkData(JSON.stringify(sampleShifts, null, 2));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Redigera och Ladda upp Skift</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mode selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'single' && styles.activeModeButton]}
          onPress={() => setMode('single')}
        >
          <Text style={[styles.modeButtonText, mode === 'single' && styles.activeModeButtonText]}>
            Enskilt Skift
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'bulk' && styles.activeModeButton]}
          onPress={() => setMode('bulk')}
        >
          <Text style={[styles.modeButtonText, mode === 'bulk' && styles.activeModeButtonText]}>
            Bulk Upload
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'single' ? (
        <View style={styles.singleMode}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Datum (YYYY-MM-DD):</Text>
            <TextInput
              style={styles.input}
              value={shiftData.date}
              onChangeText={(text) => setShiftData({...shiftData, date: text})}
              placeholder="2024-01-15"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lag:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={shiftData.team}
                onValueChange={(value) => setShiftData({...shiftData, team: value})}
                style={styles.picker}
              >
                <Picker.Item label="Lag 31" value={31} />
                <Picker.Item label="Lag 32" value={32} />
                <Picker.Item label="Lag 33" value={33} />
                <Picker.Item label="Lag 34" value={34} />
                <Picker.Item label="Lag 35" value={35} />
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Skifttyp:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={shiftData.type}
                onValueChange={(value) => setShiftData({...shiftData, type: value})}
                style={styles.picker}
              >
                <Picker.Item label="Morgon (M)" value="M" />
                <Picker.Item label="Kväll (A)" value="A" />
                <Picker.Item label="Natt (N)" value="N" />
                <Picker.Item label="Förmiddag (F)" value="F" />
                <Picker.Item label="Eftermiddag (E)" value="E" />
                <Picker.Item label="Dag (D)" value="D" />
              </Picker>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Starttid:</Text>
              <TextInput
                style={styles.input}
                value={shiftData.start_time}
                onChangeText={(text) => setShiftData({...shiftData, start_time: text})}
                placeholder="06:00"
                placeholderTextColor="#999"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Sluttid:</Text>
              <TextInput
                style={styles.input}
                value={shiftData.end_time}
                onChangeText={(text) => setShiftData({...shiftData, end_time: text})}
                placeholder="18:00"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Plats:</Text>
            <TextInput
              style={styles.input}
              value={shiftData.location}
              onChangeText={(text) => setShiftData({...shiftData, location: text})}
              placeholder="Arbetsplats"
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={[styles.uploadButton, loading && styles.disabledButton]}
            onPress={handleSingleShiftUpload}
            disabled={loading}
          >
            <Text style={styles.uploadButtonText}>
              {loading ? 'Laddar upp...' : 'Ladda upp Skift'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bulkMode}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>JSON Skiftdata:</Text>
            <Text style={styles.helpText}>
              Ange skift i JSON-format. Varje skift ska ha: date, team, type, start_time, end_time
            </Text>
            <TextInput
              style={styles.textArea}
              value={bulkData}
              onChangeText={setBulkData}
              placeholder="Ange JSON-data här..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={10}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.sampleButton}
              onPress={generateSampleData}
            >
              <Text style={styles.sampleButtonText}>Generera Exempel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.uploadButton, loading && styles.disabledButton]}
              onPress={handleBulkUpload}
              disabled={loading}
            >
              <Text style={styles.uploadButtonText}>
                {loading ? 'Laddar upp...' : 'Bulk Upload'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Information</Text>
        <Text style={styles.infoText}>
          • Datum format: YYYY-MM-DD (t.ex. 2024-01-15){'\n'}
          • Tid format: HH:MM (t.ex. 06:00){'\n'}
          • Giltiga lag: 31, 32, 33, 34, 35{'\n'}
          • Befintliga skift med samma datum och lag kommer att uppdateras
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modeSelector: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: 15,
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeModeButton: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeModeButtonText: {
    color: '#fff',
  },
  singleMode: {
    margin: 15,
  },
  bulkMode: {
    margin: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  sampleButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  sampleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  infoBox: {
    margin: 15,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
  },
});