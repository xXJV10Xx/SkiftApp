import React from 'react';
import { Text, View } from 'react-native';

export default function GuestScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Du är inloggad som gäst. Här kan du titta på scheman men inte chatta eller ändra något.</Text>
    </View>
  );
} 