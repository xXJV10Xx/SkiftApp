import { useContext } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { AuthContext, AuthProvider } from './app/AuthProvider';
import LoginScreen from './app/LoginScreen';

function MainApp() {
  const { user, logout } = useContext(AuthContext);

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <View style={styles.container}>
      <Text>Välkommen, {user.email}!</Text>
      <Button title="Logga ut" onPress={logout} />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
