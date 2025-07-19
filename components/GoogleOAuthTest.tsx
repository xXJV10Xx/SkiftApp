import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function GoogleOAuthTest() {
  const { signInWithGoogle } = useAuth();
  const [testing, setTesting] = useState(false);

  const testGoogleOAuth = async () => {
    setTesting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert('Google OAuth Error', error.message);
      } else {
        Alert.alert('Success', 'Google OAuth initiated successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google OAuth Test</Text>
      <Text style={styles.description}>
        Test if Google OAuth is properly configured
      </Text>
      
      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={testGoogleOAuth}
        disabled={testing}
      >
        <Ionicons name="logo-google" size={20} color="#fff" />
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Test Google OAuth'}
        </Text>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Setup Checklist:</Text>
        <Text style={styles.infoItem}>✅ Supabase Google provider enabled</Text>
        <Text style={styles.infoItem}>✅ Google Cloud OAuth credentials created</Text>
        <Text style={styles.infoItem}>✅ Redirect URLs configured</Text>
        <Text style={styles.infoItem}>✅ App scheme set to "skiftappen"</Text>
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
  button: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
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