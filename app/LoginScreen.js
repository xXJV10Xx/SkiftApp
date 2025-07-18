import * as Google from 'expo-auth-session/providers/google';
import React, { useEffect } from 'react';
import { Button, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { setUser } = useAuth();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '189333127323-qgrjg25e28fe8cgp46jmiesaablnfa1n.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      // Här kan du hämta användarinfo från Google om du vill
      setUser({ email: 'googleuser@example.com', token: authentication.accessToken });
    }
  }, [response]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Logga in</Text>
      <Button
        title="Logga in med Google"
        disabled={!request}
        onPress={() => promptAsync()}
      />
      {/* Lägg till fler inloggningsalternativ här */}
    </View>
  );
}
