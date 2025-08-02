import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';

interface ShiftHandoverFormProps {
  onSend: (formData: any) => void;
}

export default function ShiftHandoverForm({ onSend }: ShiftHandoverFormProps) {
  const [fromShift, setFromShift] = useState('');
  const [toShift, setToShift] = useState('');
  const [status, setStatus] = useState('');
  const [comments, setComments] = useState('');
  const [issues, setIssues] = useState('');
  const [completedTasks, setCompletedTasks] = useState('');

  const statusOptions = ['Allt OK', 'Mindre problem', 'Större problem', 'Akut'];

  const handleSubmit = () => {
    if (!fromShift.trim() || !toShift.trim() || !status) {
      alert('Fyll i alla obligatoriska fält');
      return;
    }

    onSend({
      type: 'form',
      form_type: 'shift_handover',
      content: `Skiftöverlämning från ${fromShift} till ${toShift}`,
      metadata: {
        from_shift: fromShift.trim(),
        to_shift: toShift.trim(),
        status,
        comments: comments.trim(),
        issues: issues.trim(),
        completed_tasks: completedTasks.trim(),
        timestamp: new Date().toISOString()
      }
    });
  };

  return (
    <ScrollView className="flex-1">
      <View className="p-4">
        <Text className="text-lg font-bold mb-4">Skiftöverlämning</Text>

        {/* Från skift */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2">Från skift *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="T.ex. Dagskift A"
            value={fromShift}
            onChangeText={setFromShift}
          />
        </View>

        {/* Till skift */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2">Till skift *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="T.ex. Nattskift B"
            value={toShift}
            onChangeText={setToShift}
          />
        </View>

        {/* Status */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2">Övergripande status *</Text>
          <View className="flex-row flex-wrap">
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option}
                className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                  status === option
                    ? 'bg-orange-500 border-orange-500'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => setStatus(option)}
              >
                <Text className={
                  status === option ? 'text-white' : 'text-gray-700'
                }>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Slutförda uppgifter */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2">Slutförda uppgifter</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="Lista vad som blev klart under skiftet..."
            value={completedTasks}
            onChangeText={setCompletedTasks}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Problem/issues */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2">Problem att uppmärksamma</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="Beskriv eventuella problem eller saker att hålla koll på..."
            value={issues}
            onChangeText={setIssues}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Kommentarer */}
        <View className="mb-6">
          <Text className="text-sm font-medium mb-2">Övriga kommentarer</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="Ytterligare information för nästa skift..."
            value={comments}
            onChangeText={setComments}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Skicka knapp */}
        <TouchableOpacity
          className="bg-orange-500 py-4 rounded-lg"
          onPress={handleSubmit}
        >
          <Text className="text-white text-center text-lg font-semibold">
            Skicka överlämning
          </Text>
        </TouchableOpacity>

        <View className="mt-4 p-3 bg-orange-50 rounded-lg">
          <Text className="text-sm text-orange-800">
            💡 Tips: En bra skiftöverlämning hjälper nästa skift att komma igång snabbt 
            och undvika problem. Var tydlig och konkret!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}