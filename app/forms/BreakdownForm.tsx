import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';

interface BreakdownFormProps {
  onSend: (formData: any) => void;
}

export default function BreakdownForm({ onSend }: BreakdownFormProps) {
  const [machine, setMachine] = useState('');
  const [problem, setProblem] = useState('');
  const [priority, setPriority] = useState('');
  const [estimatedFixTime, setEstimatedFixTime] = useState('');
  const [safetyIssue, setSafetyIssue] = useState(false);
  const [productionImpact, setProductionImpact] = useState('');
  const [contactedMaintenance, setContactedMaintenance] = useState(false);

  const priorityOptions = ['Låg', 'Medium', 'Hög', 'Kritisk'];
  const impactOptions = ['Ingen påverkan', 'Delvis stopp', 'Fullständigt stopp'];

  const handleSubmit = () => {
    if (!machine.trim() || !problem.trim() || !priority) {
      alert('Fyll i alla obligatoriska fält');
      return;
    }

    onSend({
      type: 'form',
      form_type: 'breakdown',
      content: `🚨 Haveri rapporterat: ${machine}`,
      metadata: {
        machine: machine.trim(),
        problem: problem.trim(),
        priority,
        estimated_fix_time: estimatedFixTime.trim(),
        safety_issue: safetyIssue,
        production_impact: productionImpact,
        contacted_maintenance: contactedMaintenance,
        timestamp: new Date().toISOString()
      }
    });
  };

  return (
    <ScrollView className="flex-1">
      <View className="p-4">
        <Text className="text-lg font-bold mb-4 text-red-700">⚠️ Haverirapport</Text>

        {/* Maskin/utrustning */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2">Maskin/Utrustning *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="T.ex. Linje 3, Pump A, Kran 2..."
            value={machine}
            onChangeText={setMachine}
          />
        </View>

        {/* Problem beskrivning */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2">Problembeskrivning *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="Beskriv vad som har hänt och vad som inte fungerar..."
            value={problem}
            onChangeText={setProblem}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Prioritet */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2">Prioritet *</Text>
          <View className="flex-row flex-wrap">
            {priorityOptions.map((option) => (
              <TouchableOpacity
                key={option}
                className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                  priority === option
                    ? option === 'Kritisk' ? 'bg-red-600 border-red-600'
                    : option === 'Hög' ? 'bg-red-500 border-red-500'
                    : option === 'Medium' ? 'bg-orange-500 border-orange-500'
                    : 'bg-yellow-500 border-yellow-500'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => setPriority(option)}
              >
                <Text className={
                  priority === option ? 'text-white' : 'text-gray-700'
                }>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Produktionspåverkan */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2">Påverkan på produktion</Text>
          <View className="flex-row flex-wrap">
            {impactOptions.map((option) => (
              <TouchableOpacity
                key={option}
                className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                  productionImpact === option
                    ? 'bg-red-500 border-red-500'
                    : 'bg-white border-gray-300'
                }`}
                onPress={() => setProductionImpact(option)}
              >
                <Text className={
                  productionImpact === option ? 'text-white' : 'text-gray-700'
                }>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Uppskattad reparationstid */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2">Uppskattad reparationstid</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3"
            placeholder="T.ex. 2 timmar, 1 dag, okänt..."
            value={estimatedFixTime}
            onChangeText={setEstimatedFixTime}
          />
        </View>

        {/* Säkerhetsproblem */}
        <View className="mb-4">
          <TouchableOpacity
            className={`flex-row items-center p-3 rounded-lg border ${
              safetyIssue ? 'bg-red-50 border-red-300' : 'bg-white border-gray-300'
            }`}
            onPress={() => setSafetyIssue(!safetyIssue)}
          >
            <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
              safetyIssue ? 'bg-red-500 border-red-500' : 'border-gray-400'
            }`}>
              {safetyIssue && <Text className="text-white text-xs">✓</Text>}
            </View>
            <Text className="text-sm font-medium">
              Detta är ett säkerhetsproblem
            </Text>
          </TouchableOpacity>
        </View>

        {/* Underhåll kontaktat */}
        <View className="mb-6">
          <TouchableOpacity
            className={`flex-row items-center p-3 rounded-lg border ${
              contactedMaintenance ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'
            }`}
            onPress={() => setContactedMaintenance(!contactedMaintenance)}
          >
            <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
              contactedMaintenance ? 'bg-green-500 border-green-500' : 'border-gray-400'
            }`}>
              {contactedMaintenance && <Text className="text-white text-xs">✓</Text>}
            </View>
            <Text className="text-sm font-medium">
              Underhållspersonal har kontaktats
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skicka knapp */}
        <TouchableOpacity
          className="bg-red-500 py-4 rounded-lg"
          onPress={handleSubmit}
        >
          <Text className="text-white text-center text-lg font-semibold">
            Rapportera haveri
          </Text>
        </TouchableOpacity>

        <View className="mt-4 p-3 bg-red-50 rounded-lg">
          <Text className="text-sm text-red-800">
            🚨 Viktigt: Vid säkerhetsproblem eller kritiska haverier, kontakta även 
            ansvarig chef eller vakthavande direkt!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}