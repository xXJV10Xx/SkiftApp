import { useContext } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useAuth } from './context/AuthContext';
import LoginScreen from './app/auth/login'; // rätt sökväg till LoginScreen

export default function MainApp() {
  const { user, signOut } = useAuth();

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <View style={styles.container}>
      <Text>Välkommen, {user.email}!</Text>
      <Button title="Logga ut" onPress={signOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
