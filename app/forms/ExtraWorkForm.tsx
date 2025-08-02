import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';

interface ExtraWorkFormProps {
  onSend: (formData: any) => void;
}

export default function ExtraWorkForm({ onSend }: ExtraWorkFormProps) {
  const [date, setDate] = useState('');
  const [shift, setShift] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [urgency, setUrgency] = useState('');
  const [skills, setSkills] = useState('');

  const urgencyOptions = ['Låg', 'Normal', 'Hög', 'Akut'];
  const shiftOptions = ['Dagskift', 'Kvällskift', 'Nattskift', 'Helger'];

  const handleSubmit = () => {
    if (!date.trim() || !shift || !description.trim()) {
      alert('Fyll i alla obligatoriska fält');
      return;
    }

    onSend({
      type: 'form',
      form_type: 'extra_work',
      content: `Förfrågan om extra arbete - ${date}`,
      metadata: {
        date: date.trim(),
        shift,
        description: description.trim(),
        hours: hours.trim(),
        urgency,
        skills: skills.trim(),
        timestamp: new Date().toISOString()
      }
    });
  };

  return (
    <ScrollView className="flex-1">
      <View className="p-4">
        <Text className="text-lg font-bold mb-4 text-green-700">🕐 Extra arbete</Text>

        {/* Datum */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2">Datum *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="YYYY-MM-DD eller t.ex. 'Nästa vecka'"
            value={date}
            onChangeText={setDate}
          />
        </View>

        {/* Skift */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2">Skift *</Text>
          <View className="flex-row flex-wrap">
            {shiftOptions.map((option) => (
              <TouchableOpacity
                key={option}
                className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                  shift === option
                    ? 'bg-green-500 border-green-500'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => setShift(option)}
              >
                <Text className={
                  shift === option ? 'text-white' : 'text-gray-700'
                }>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Beskrivning */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2">Beskrivning av arbetet *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="Beskriv vad som behöver göras..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Antal timmar */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2">Uppskattade timmar</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="T.ex. 4 timmar, halvdag, heldag..."
            value={hours}
            onChangeText={setHours}
          />
        </View>

        {/* Brådskande */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2">Prioritet</Text>
          <View className="flex-row flex-wrap">
            {urgencyOptions.map((option) => (
              <TouchableOpacity
                key={option}
                className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                  urgency === option
                    ? option === 'Akut' ? 'bg-red-500 border-red-500'
                    : option === 'Hög' ? 'bg-orange-500 border-orange-500'
                    : 'bg-green-500 border-green-500'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => setUrgency(option)}
              >
                <Text className={
                  urgency === option ? 'text-white' : 'text-gray-700'
                }>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Kompetens som krävs */}
        <View className="mb-6">
          <Text className="text-sm font-medium mb-2">Kompetens som krävs</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="T.ex. Truckkörkort, svetskompetens, el-behörighet..."
            value={skills}
            onChangeText={setSkills}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        {/* Skicka knapp */}
        <TouchableOpacity
          className="bg-green-500 py-4 rounded-lg"
          onPress={handleSubmit}
        >
          <Text className="text-white text-center text-lg font-semibold">
            Skicka förfrågan
          </Text>
        </TouchableOpacity>

        <View className="mt-4 p-3 bg-green-50 rounded-lg">
          <Text className="text-sm text-green-800">
            💡 Tips: Var tydlig med vad som behöver göras och vilken kompetens som krävs. 
            Detta hjälper rätt personer att se förfrågan!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}