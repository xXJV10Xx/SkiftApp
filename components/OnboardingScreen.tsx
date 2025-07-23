import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { useAuth } from '../context/AuthContext'
import { supabase, ShiftTeam } from '../lib/supabase'

export default function OnboardingScreen() {
  const { updateProfile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [shiftTeams, setShiftTeams] = useState<ShiftTeam[]>([])
  const [formData, setFormData] = useState({
    company: '',
    department_location: '',
    shift_team_id: '',
  })

  // Fetch available shift teams
  useEffect(() => {
    fetchShiftTeams()
  }, [])

  const fetchShiftTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('shift_teams')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching shift teams:', error)
        Alert.alert('Fel', 'Kunde inte hämta lag-information')
        return
      }

      setShiftTeams(data || [])
    } catch (error) {
      console.error('Error fetching shift teams:', error)
      Alert.alert('Fel', 'Något gick fel vid hämtning av lag')
    }
  }

  const handleSubmit = async () => {
    // Validate form
    if (!formData.company.trim()) {
      Alert.alert('Saknad information', 'Vänligen ange företagsnamn')
      return
    }

    if (!formData.department_location.trim()) {
      Alert.alert('Saknad information', 'Vänligen ange avdelning/plats')
      return
    }

    if (!formData.shift_team_id) {
      Alert.alert('Saknad information', 'Vänligen välj ett lag')
      return
    }

    setLoading(true)

    try {
      const { error } = await updateProfile({
        company: formData.company.trim(),
        department_location: formData.department_location.trim(),
        shift_team_id: formData.shift_team_id,
      })

      if (error) {
        Alert.alert('Fel', 'Kunde inte spara profil-information')
        console.error('Error updating profile:', error)
      } else {
        Alert.alert('Välkommen!', 'Din profil har skapats framgångsrikt')
        await refreshProfile()
      }
    } catch (error) {
      Alert.alert('Fel', 'Något gick fel vid sparande av profil')
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedTeam = shiftTeams.find(team => team.id === formData.shift_team_id)

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Välkommen till Skiftappen!</Text>
        <Text style={styles.subtitle}>
          För att komma igång behöver vi lite information om dig och ditt arbete.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Företag *</Text>
            <TextInput
              style={styles.input}
              value={formData.company}
              onChangeText={(text) => setFormData({ ...formData, company: text })}
              placeholder="Ange ditt företagsnamn"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Avdelning/Plats *</Text>
            <TextInput
              style={styles.input}
              value={formData.department_location}
              onChangeText={(text) => setFormData({ ...formData, department_location: text })}
              placeholder="T.ex. Produktion, Kontor Stockholm"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Välj ditt lag *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.shift_team_id}
                onValueChange={(itemValue) => 
                  setFormData({ ...formData, shift_team_id: itemValue })
                }
                style={styles.picker}
              >
                <Picker.Item label="Välj ett lag..." value="" />
                {shiftTeams.map((team) => (
                  <Picker.Item
                    key={team.id}
                    label={team.name}
                    value={team.id}
                  />
                ))}
              </Picker>
            </View>
            
            {selectedTeam && (
              <View style={styles.teamPreview}>
                <View 
                  style={[
                    styles.teamColorIndicator, 
                    { backgroundColor: selectedTeam.color_hex }
                  ]} 
                />
                <Text style={styles.teamPreviewText}>
                  {selectedTeam.name}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Slutför registrering</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.note}>
          * Obligatoriska fält
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  teamPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  teamColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  teamPreviewText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  note: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
})