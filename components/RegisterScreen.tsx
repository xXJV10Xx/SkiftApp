import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useAuth } from '../context/AuthContext'

interface RegisterScreenProps {
  navigation: any
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const validateForm = () => {
    if (!formData.username.trim()) {
      Alert.alert('Saknad information', 'Vänligen ange ett användarnamn')
      return false
    }

    if (!formData.email.trim()) {
      Alert.alert('Saknad information', 'Vänligen ange en email-adress')
      return false
    }

    if (!formData.email.includes('@')) {
      Alert.alert('Ogiltig email', 'Vänligen ange en giltig email-adress')
      return false
    }

    if (formData.password.length < 6) {
      Alert.alert('Svagt lösenord', 'Lösenordet måste vara minst 6 tecken långt')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Lösenord matchar inte', 'Vänligen kontrollera att lösenorden är identiska')
      return false
    }

    return true
  }

  const handleRegister = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const { error } = await signUp(
        formData.email.trim(),
        formData.password,
        formData.username.trim()
      )
      
      if (error) {
        if (error.message.includes('User already registered')) {
          Alert.alert('Konto existerar redan', 'Det finns redan ett konto med denna email-adress')
        } else if (error.message.includes('Password should be at least 6 characters')) {
          Alert.alert('Svagt lösenord', 'Lösenordet måste vara minst 6 tecken långt')
        } else {
          Alert.alert('Registrering misslyckades', error.message || 'Något gick fel vid registrering')
        }
      } else {
        Alert.alert(
          'Registrering lyckades!',
          'Ditt konto har skapats. Du kan nu logga in.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        )
      }
    } catch (error) {
      Alert.alert('Fel', 'Något gick fel vid registrering')
      console.error('Register error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Skapa konto</Text>
            <Text style={styles.subtitle}>Registrera dig för att komma igång med Skiftappen</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Användarnamn</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
                placeholder="Ditt användarnamn"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="din@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lösenord</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Minst 6 tecken"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bekräfta lösenord</Text>
              <TextInput
                style={styles.input}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                placeholder="Ange lösenordet igen"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Skapa konto</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Har du redan ett konto?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Logga in här</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 30,
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
    padding: 15,
    fontSize: 16,
    color: '#1a1a1a',
  },
  registerButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  loginLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
})