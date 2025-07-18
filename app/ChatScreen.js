import React, { useState } from 'react';
import { Button, FlatList, Text, TextInput, View } from 'react-native';

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: '1', user: 'Anna', text: 'Hej, någon som vill byta skift?' },
    { id: '2', user: 'Erik', text: 'Jag kan ta ditt pass på fredag!' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { id: Date.now().toString(), user: 'Du', text: input }]);
      setInput('');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold' }}>{item.user}:</Text>
            <Text>{item.text}</Text>
          </View>
        )}
        style={{ marginBottom: 16 }}
      />
      <TextInput
        placeholder="Skriv ett meddelande..."
        value={input}
        onChangeText={setInput}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 8 }}
      />
      <Button title="Skicka" onPress={sendMessage} />
    </View>
  );
} 