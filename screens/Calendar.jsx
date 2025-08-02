import React, { useState, useEffect } from 'react';
import { View, Alert, Text } from 'react-native';
import CalendarToolbar from '../components/CalendarToolbar';
import { handleExportCheckout, checkExportAccess, generateCalendarExport } from '../lib/stripeExport';
import { supabase } from '../lib/supabase';

export default function CalendarScreen() {
  const [view, setView] = useState('month');
  const [team, setTeam] = useState('ALL');
  const [hasExportAccess, setHasExportAccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setCurrentUser(user);
        
        // Get employee data
        const { data: employee } = await supabase
          .from('employees')
          .select('id, has_paid_export')
          .eq('email', user.email)
          .single();

        if (employee) {
          setHasExportAccess(employee.has_paid_export || false);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!currentUser) {
      Alert.alert('Fel', 'Du måste vara inloggad för att exportera');
      return;
    }

    try {
      if (hasExportAccess) {
        // User has already paid, generate export directly
        const filters = {
          userId: currentUser.id,
          teamFilter: team,
          startDate: getFilterStartDate(),
          endDate: getFilterEndDate()
        };
        
        await generateCalendarExport(filters);
        Alert.alert('Export klar', 'Din kalender har exporterats som ICS-fil');
      } else {
        // User needs to pay first
        await handleExportCheckout(currentUser.email);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Fel', 'Ett fel uppstod vid exporten. Försök igen.');
    }
  };

  const getFilterStartDate = () => {
    const now = new Date();
    if (view === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else {
      return new Date(now.getFullYear(), 0, 1).toISOString();
    }
  };

  const getFilterEndDate = () => {
    const now = new Date();
    if (view === 'month') {
      return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    } else {
      return new Date(now.getFullYear(), 11, 31).toISOString();
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Laddar...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <CalendarToolbar
        view={view}
        setView={setView}
        team={team}
        setTeam={setTeam}
        onExport={handleExport}
        hasExportAccess={hasExportAccess}
      />
      
      {/* Calendar content based on view */}
      <View className="flex-1 p-4">
        {view === 'month' ? (
          <MonthView team={team} />
        ) : (
          <YearView team={team} />
        )}
      </View>
    </View>
  );
}

// Placeholder components for calendar views
function MonthView({ team }) {
  return (
    <View className="flex-1 bg-white rounded-lg p-4">
      <Text className="text-lg font-semibold mb-4">Månadsvy</Text>
      <Text className="text-gray-600">
        Visar skift för {team === 'ALL' ? 'alla lag' : `Lag ${team}`}
      </Text>
      {/* Add actual calendar implementation here */}
    </View>
  );
}

function YearView({ team }) {
  return (
    <View className="flex-1 bg-white rounded-lg p-4">
      <Text className="text-lg font-semibold mb-4">Årsvy</Text>
      <Text className="text-gray-600">
        Visar årsöversikt för {team === 'ALL' ? 'alla lag' : `Lag ${team}`}
      </Text>
      {/* Add actual year view implementation here */}
    </View>
  );
}