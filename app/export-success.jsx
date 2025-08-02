import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { generateCalendarExport } from '../lib/stripeExport';

export default function ExportSuccessScreen() {
  const router = useRouter();
  const { session_id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleDownloadExport = async () => {
    if (!currentUser) {
      Alert.alert('Fel', 'Användare ej inloggad');
      return;
    }

    setLoading(true);
    try {
      const filters = {
        userId: currentUser.id,
        teamFilter: 'ALL',
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(),
        endDate: new Date(new Date().getFullYear(), 11, 31).toISOString()
      };
      
      await generateCalendarExport(filters);
      Alert.alert('Export klar', 'Din kalender har exporterats som ICS-fil');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Fel', 'Ett fel uppstod vid exporten. Försök igen från kalendern.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 justify-center items-center p-6">
      <View className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg">
        <View className="items-center mb-6">
          <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
            <Text className="text-green-600 text-2xl">✓</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center">
            Betalning genomförd!
          </Text>
        </View>

        <Text className="text-gray-600 text-center mb-6">
          Tack för ditt köp! Du har nu tillgång till kalenderexport-funktionen.
          Du kan exportera ditt skiftschema som ICS-fil direkt från kalendern.
        </Text>

        {session_id && (
          <Text className="text-sm text-gray-500 text-center mb-6">
            Transaktions-ID: {session_id}
          </Text>
        )}

        <View className="space-y-4">
          <TouchableOpacity
            onPress={handleDownloadExport}
            disabled={loading}
            className={`bg-green-600 py-3 px-6 rounded-lg ${loading ? 'opacity-50' : ''}`}
          >
            <Text className="text-white text-center font-medium">
              {loading ? 'Genererar export...' : 'Ladda ner kalender nu'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/calendar')}
            className="bg-gray-100 py-3 px-6 rounded-lg"
          >
            <Text className="text-gray-700 text-center font-medium">
              Gå till kalender
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/')}
            className="py-2"
          >
            <Text className="text-blue-600 text-center">
              Tillbaka till startsidan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}