import { useContext } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { AuthContext } from './AuthProvider';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text>Välkommen, {user.email}!</Text>
      <Button title="Logga ut" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
