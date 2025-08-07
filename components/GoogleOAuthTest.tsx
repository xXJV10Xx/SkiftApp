import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function GoogleOAuthTest() {
  const { signInWithGoogle, user } = useAuth();
  const [testing, setTesting] = useState(false);

  const handleGoogleSignIn = async () => {
    setTesting(true);
    try {
      console.log('🔐 Testing Google OAuth...');
      const { error } = await signInWithGoogle();
      
      if (error) {
        console.error('❌ Google OAuth Error:', error);
        Alert.alert(
          'Google OAuth Error',
          `Error: ${error.message}\n\nPlease check the configuration guide.`,
          [{ text: 'OK' }]
        );
      } else {
        console.log('✅ Google OAuth initiated successfully');
        Alert.alert(
          'Google OAuth Test',
          'Google OAuth initiated successfully! Check if you were redirected to Google.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      Alert.alert(
        'Unexpected Error',
        'An unexpected error occurred. Please check the console for details.',
        [{ text: 'OK' }]
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google OAuth Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Current User:</Text>
        <Text style={styles.statusValue}>
          {user ? `${user.email} (${user.user_metadata?.full_name || 'No name'})` : 'Not logged in'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={handleGoogleSignIn}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Test Google OAuth'}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Debug Information:</Text>
        <Text style={styles.infoText}>
          • Supabase URL: {process.env.EXPO_PUBLIC_SUPABASE_URL || 'Not set'}
        </Text>
        <Text style={styles.infoText}>
          • App Scheme: skiftappen
        </Text>
        <Text style={styles.infoText}>
          • Redirect URL: skiftappen://auth/callback
        </Text>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>If Google OAuth doesn't work:</Text>
        <Text style={styles.instructionsText}>
          1. Check GOOGLE_OAUTH_FIX.md for setup instructions
        </Text>
        <Text style={styles.instructionsText}>
          2. Verify Google Cloud Console credentials
        </Text>
        <Text style={styles.instructionsText}>
          3. Check Supabase Dashboard configuration
        </Text>
        <Text style={styles.instructionsText}>
          4. Restart the development server
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  instructions: {
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f57c00',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
}); 