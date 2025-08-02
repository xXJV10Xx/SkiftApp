import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleLoginScreen() {
  const router = useRouter();

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: [
      'profile', 
      'email', 
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleLogin(authentication.accessToken, authentication.refreshToken);
    } else if (response?.type === 'error') {
      Alert.alert('Fel', 'Något gick fel vid inloggning med Google');
    }
  }, [response]);

  const handleGoogleLogin = async (accessToken: string, refreshToken?: string) => {
    try {
      // Hämta användarinfo från Google
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
      );
      const userInfo = await userInfoResponse.json();

      // Skicka till backend för att spara tokens
      const backendResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/google-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          access_token: accessToken,
          refresh_token: refreshToken,
          user_info: userInfo
        }),
      });

      if (backendResponse.ok) {
        // Logga in användaren i Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: userInfo.email,
          password: `google_${userInfo.id}` // Temporär lösning
        });

        if (error) {
          // Om användaren inte finns, skapa konto
          const { error: signUpError } = await supabase.auth.signUp({
            email: userInfo.email,
            password: `google_${userInfo.id}`,
            options: {
              data: {
                full_name: userInfo.name,
                avatar_url: userInfo.picture,
                google_id: userInfo.id
              }
            }
          });

          if (signUpError) {
            throw signUpError;
          }
        }

        router.replace('/(tabs)');
      } else {
        throw new Error('Backend error');
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Fel', 'Kunde inte logga in med Google');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Logga in med Google</Text>
        <Text style={styles.subtitle}>
          Anslut ditt Google-konto för att synkronisera dina skift med Google Calendar
        </Text>
        
        <TouchableOpacity
          style={[styles.googleButton, !request && styles.disabled]}
          disabled={!request}
          onPress={() => promptAsync()}
        >
          <Text style={styles.googleButtonText}>🔗 Fortsätt med Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Tillbaka</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  googleButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
    minWidth: 250,
  },
  disabled: {
    backgroundColor: '#ccc',
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
});