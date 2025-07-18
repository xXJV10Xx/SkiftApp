import React from 'react';
import { Button, Text, View } from 'react-native';
import CalendarScreen from '../CalendarScreen';

export default function WelcomeCalendarScreen({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 22, textAlign: 'center', marginVertical: 20 }}>Välkommen till Skiftappen!</Text>
      <CalendarScreen />
      <Button title="Gå till appen" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })} />
    </View>
  );
} 