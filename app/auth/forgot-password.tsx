import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { resetPassword } = useAuth();

  const handleBackToLogin = () => {
    router.back();
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Fel', 'Vänligen ange din e-postadress');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Fel', 'Vänligen ange en giltig e-postadress');
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(email.trim());
      if (error) {
        Alert.alert('Fel', error.message);
      } else {
        setEmailSent(true);
        Alert.alert(
          'E-post skickat',
          'Vi har skickat instruktioner för lösenordsåterställning till din e-postadress. Kontrollera din inkorg och följ instruktionerna.'
        );
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      Alert.alert('Fel', 'Ett oväntat fel uppstod. Försök igen senare.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <TouchableOpacity onPress={handleBackToLogin} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Glömt lösenord?</Text>
          <Text style={styles.subtitle}>
            {emailSent 
              ? 'Kontrollera din e-post för instruktioner om lösenordsåterställning.'
              : 'Ange din e-postadress så skickar vi instruktioner för att återställa ditt lösenord.'
            }
          </Text>
        </View>

        {!emailSent && (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-postadress"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Skicka återställningslänk</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleBackToLogin} style={styles.backToLogin}>
            <Text style={styles.backToLoginText}>
              {emailSent ? 'Tillbaka till inloggning' : 'Kom ihåg lösenordet? Logga in'}
            </Text>
          </TouchableOpacity>
          
          {emailSent && (
            <TouchableOpacity 
              onPress={() => {
                setEmailSent(false);
                setEmail('');
              }} 
              style={styles.tryAgainButton}
            >
              <Text style={styles.tryAgainText}>Försök med annan e-post</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  backToLogin: {
    marginBottom: 16,
  },
  backToLoginText: {
    color: '#007AFF',
    fontSize: 16,
    textAlign: 'center',
  },
  tryAgainButton: {
    paddingVertical: 8,
  },
  tryAgainText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
}); 