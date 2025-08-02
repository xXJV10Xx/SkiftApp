import { useContext } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { AuthContext, AuthProvider } from './app/AuthProvider';
import LoginScreen from './app/LoginScreen';
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import StripeCheckoutButton from './components/StripeCheckoutButton';

function MainApp() {
  const { user, logout } = useContext(AuthContext);

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <View style={styles.container}>
      <Text>Välkommen, {user.email}!</Text>
      <StripeCheckoutButton />
      <Button title="Logga ut" onPress={logout} />
    </View>
  );
}

export default function App() {
  const stripePublishableKey = Constants.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY;
  
  return (
    <StripeProvider publishableKey={stripePublishableKey}>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
