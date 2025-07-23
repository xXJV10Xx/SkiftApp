import { MaterialIcons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

interface Company {
  id: string
  name: string
  industry: string
  location: string
}

interface Team {
  id: string
  name: string
  color_hex: string
  company_id: string
}

interface Profile {
  id: string
  email: string
  full_name: string
  company_id: string | null
  department_location: string | null
  shift_team_id: string | null
  phone_number: string | null
  employee_id: string | null
}

export const OnboardingFlow: React.FC = () => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  
  // Form data
  const [formData, setFormData] = useState({
    full_name: '',
    company_id: '',
    department_location: '',
    shift_team_id: '',
    phone_number: '',
    employee_id: ''
  })

  // Check if profile is complete
  const [profileComplete, setProfileComplete] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  // Load initial data
  useEffect(() => {
    if (user) {
      loadProfile()
      loadCompanies()
    }
  }, [user])

  // Load user profile
  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error

      setProfile(data)
      setFormData({
        full_name: data.full_name || '',
        company_id: data.company_id || '',
        department_location: data.department_location || '',
        shift_team_id: data.shift_team_id || '',
        phone_number: data.phone_number || '',
        employee_id: data.employee_id || ''
      })

      // Check if profile is complete
      const isComplete = !!(data.company_id && data.department_location && data.shift_team_id)
      setProfileComplete(isComplete)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  // Load companies
  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error loading companies:', error)
      Alert.alert('Fel', 'Kunde inte hämta företag')
    }
  }

  // Load teams for selected company
  const loadTeams = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('shift_teams')
        .select('*')
        .eq('company_id', companyId)
        .order('name')

      if (error) throw error
      setFilteredTeams(data || [])
    } catch (error) {
      console.error('Error loading teams:', error)
      Alert.alert('Fel', 'Kunde inte hämta team')
    }
  }

  // Handle company selection
  const handleCompanyChange = (companyId: string) => {
    setFormData(prev => ({ ...prev, company_id: companyId, shift_team_id: '' }))
    if (companyId) {
      loadTeams(companyId)
    } else {
      setFilteredTeams([])
    }
  }

  // Save profile
  const saveProfile = async () => {
    if (!user) return

    // Validate required fields
    if (!formData.full_name.trim()) {
      Alert.alert('Fel', 'Namn krävs')
      return
    }
    if (!formData.company_id) {
      Alert.alert('Fel', 'Välj företag')
      return
    }
    if (!formData.department_location.trim()) {
      Alert.alert('Fel', 'Avdelning/plats krävs')
      return
    }
    if (!formData.shift_team_id) {
      Alert.alert('Fel', 'Välj team')
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.full_name.trim(),
          company_id: formData.company_id,
          department_location: formData.department_location.trim(),
          shift_team_id: formData.shift_team_id,
          phone_number: formData.phone_number.trim() || null,
          employee_id: formData.employee_id.trim() || null,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      Alert.alert(
        'Profil uppdaterad',
        'Din profil har sparats framgångsrikt!',
        [
          {
            text: 'OK',
            onPress: () => {
              setProfileComplete(true)
              setCurrentStep(1)
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving profile:', error)
      Alert.alert('Fel', 'Kunde inte spara profil')
    } finally {
      setLoading(false)
    }
  }

  // If profile is complete, show completion message
  if (profileComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completeContainer}>
          <MaterialIcons name="check-circle" size={80} color="#28a745" />
          <Text style={styles.completeTitle}>Profil komplett!</Text>
          <Text style={styles.completeText}>
            Din profil är nu komplett och du kan använda appen fullt ut.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setProfileComplete(false)}
          >
            <Text style={styles.buttonText}>Redigera profil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Välkommen till Skiftappen</Text>
          <Text style={styles.subtitle}>
            Låt oss sätta upp din profil för att komma igång
          </Text>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(currentStep / 4) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            Steg {currentStep} av 4
          </Text>
        </View>

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Personlig information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Namn *</Text>
              <TextInput
                style={styles.input}
                value={formData.full_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
                placeholder="Ditt fullständiga namn"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefonnummer</Text>
              <TextInput
                style={styles.input}
                value={formData.phone_number}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone_number: text }))}
                placeholder="070-123 45 67"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Anställnings-ID</Text>
              <TextInput
                style={styles.input}
                value={formData.employee_id}
                onChangeText={(text) => setFormData(prev => ({ ...prev, employee_id: text }))}
                placeholder="Ditt anställnings-ID"
              />
            </View>
          </View>
        )}

        {/* Step 2: Company Selection */}
        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Välj företag</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Företag *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.company_id}
                  onValueChange={handleCompanyChange}
                  style={styles.picker}
                >
                  <Picker.Item label="Välj företag" value="" />
                  {companies.map(company => (
                    <Picker.Item
                      key={company.id}
                      label={company.name}
                      value={company.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {formData.company_id && (
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>
                  {companies.find(c => c.id === formData.company_id)?.name}
                </Text>
                <Text style={styles.companyDetails}>
                  {companies.find(c => c.id === formData.company_id)?.industry} • {' '}
                  {companies.find(c => c.id === formData.company_id)?.location}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Step 3: Department and Team */}
        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Avdelning och team</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Avdelning/plats *</Text>
              <TextInput
                style={styles.input}
                value={formData.department_location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, department_location: text }))}
                placeholder="T.ex. Produktion A, Kontor Stockholm"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Team *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.shift_team_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, shift_team_id: value }))}
                  style={styles.picker}
                >
                  <Picker.Item label="Välj team" value="" />
                  {filteredTeams.map(team => (
                    <Picker.Item
                      key={team.id}
                      label={team.name}
                      value={team.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {formData.shift_team_id && (
              <View style={styles.teamInfo}>
                <View style={[
                  styles.teamColor, 
                  { backgroundColor: filteredTeams.find(t => t.id === formData.shift_team_id)?.color_hex }
                ]} />
                <Text style={styles.teamName}>
                  {filteredTeams.find(t => t.id === formData.shift_team_id)?.name}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Step 4: Review and Save */}
        {currentStep === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Granska och spara</Text>
            
            <View style={styles.reviewContainer}>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Namn:</Text>
                <Text style={styles.reviewValue}>{formData.full_name}</Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Företag:</Text>
                <Text style={styles.reviewValue}>
                  {companies.find(c => c.id === formData.company_id)?.name}
                </Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Avdelning:</Text>
                <Text style={styles.reviewValue}>{formData.department_location}</Text>
              </View>
              
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Team:</Text>
                <Text style={styles.reviewValue}>
                  {filteredTeams.find(t => t.id === formData.shift_team_id)?.name}
                </Text>
              </View>
              
              {formData.phone_number && (
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Telefon:</Text>
                  <Text style={styles.reviewValue}>{formData.phone_number}</Text>
                </View>
              )}
              
              {formData.employee_id && (
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Anställnings-ID:</Text>
                  <Text style={styles.reviewValue}>{formData.employee_id}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Navigation buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setCurrentStep(prev => prev - 1)}
            >
              <Text style={styles.secondaryButtonText}>Tillbaka</Text>
            </TouchableOpacity>
          )}
          
          {currentStep < 4 ? (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => setCurrentStep(prev => prev + 1)}
            >
              <Text style={styles.buttonText}>Nästa</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={saveProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Spara profil</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d4150',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00adf5',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d4150',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  picker: {
    height: 50,
  },
  companyInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 14,
    color: '#6c757d',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  teamColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d4150',
  },
  reviewContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d4150',
  },
  reviewValue: {
    fontSize: 16,
    color: '#6c757d',
    flex: 1,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  primaryButton: {
    backgroundColor: '#00adf5',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#00adf5',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#00adf5',
    fontSize: 16,
    fontWeight: '600',
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
    marginTop: 20,
    marginBottom: 10,
  },
  completeText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 30,
  },
}) 