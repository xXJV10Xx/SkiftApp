import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Button, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileSetupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 22, marginBottom: 20 }}>Profilinställningar</Text>
      <TouchableOpacity onPress={pickImage} style={{ marginBottom: 20 }}>
        {image ? (
          <Image source={{ uri: image }} style={{ width: 100, height: 100, borderRadius: 50 }} />
        ) : (
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }}>
            <Text>Välj bild</Text>
          </View>
        )}
      </TouchableOpacity>
      <TextInput
        placeholder="Namn"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, width: 200, marginBottom: 20 }}
      />
      <Button title="Next" onPress={() => navigation.navigate('CompanyShift', { name, image })} />
    </View>
  );
} 