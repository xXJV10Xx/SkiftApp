// 🏭 SSAB Oxelösund App Component
// Komplett React Native app som hämtar data från Supabase och hanterar alla klick-funktioner

import { createClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SSAB_CONFIG } from './ssab_config';

// Supabase client
const supabase = createClient(
  SSAB_CONFIG.SUPABASE_URL,
  SSAB_CONFIG.SUPABASE_ANON_KEY
);

interface Shift {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  shift_type: 'F' | 'E' | 'N' | 'L';
  team_name: string;
  team_color: string;
  cycle_day: number;
  is_generated: boolean;
}

interface Team {
  id: string;
  name: string;
  color_hex: string;
  description: string;
}

interface Stats {
  team_name: string;
  total_shifts: number;
  morning_shifts: number;
  afternoon_shifts: number;
  night_shifts: number;
  free_days: number;
  total_hours: number;
  average_shift_length: number;
}

export default function SSABOxelosundApp() {
  // State
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<Stats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('2025-01-01');
  const [error, setError] = useState<string | null>(null);

  // Hämta data från Supabase
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Hämta SSAB Oxelösund teams
      console.log('🏭 Hämtar SSAB Oxelösund teams...');
      const { data: teamsData, error: teamsError } = await supabase
        .from('shift_teams')
        .select('*')
        .eq('company_id', (await supabase.from('companies').select('id').eq('name', 'SSAB OXELÖSUND').single()).data?.id);

      if (teamsError) {
        throw new Error(`Fel vid hämtning av teams: ${teamsError.message}`);
      }

      setTeams(teamsData || []);
      console.log(`✅ ${teamsData?.length || 0} teams hittade`);

      // 2. Hämta skift för valt team och datum
      console.log('🏭 Hämtar skift...');
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select(`
          *,
          shift_teams!inner(name, color_hex)
        `)
        .eq('shift_teams.name', selectedTeam === 'all' ? 'Lag 31' : selectedTeam)
        .gte('start_time', selectedDate)
        .lte('start_time', new Date(selectedDate).toISOString().split('T')[0] + 'T23:59:59')
        .order('start_time');

      if (shiftsError) {
        throw new Error(`Fel vid hämtning av skift: ${shiftsError.message}`);
      }

      setShifts(shiftsData || []);
      console.log(`✅ ${shiftsData?.length || 0} skift hittade`);

      // 3. Hämta statistik
      console.log('🏭 Hämtar statistik...');
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_ssab_oxelosund_stats', {
          p_start_date: selectedDate,
          p_end_date: new Date(selectedDate).toISOString().split('T')[0]
        });

      if (statsError) {
        console.warn('Varning: Kunde inte hämta statistik:', statsError.message);
      } else {
        setStats(statsData || []);
        console.log(`✅ Statistik hittad för ${statsData?.length || 0} teams`);
      }

    } catch (err) {
      console.error('❌ Fel vid hämtning av data:', err);
      setError(err instanceof Error ? err.message : 'Okänt fel');
    } finally {
      setLoading(false);
    }
  }, [selectedTeam, selectedDate]);

  // Ladda data vid mount och när dependencies ändras
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh funktion
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Klick-funktioner
  const handleTeamSelect = (teamName: string) => {
    console.log('👆 Team valt:', teamName);
    setSelectedTeam(teamName);
  };

  const handleDateSelect = (date: string) => {
    console.log('📅 Datum valt:', date);
    setSelectedDate(date);
  };

  const handleShiftClick = (shift: Shift) => {
    console.log('👆 Skift klickat:', shift.title);
    Alert.alert(
      'Skift Detaljer',
      `${shift.title}\n\n` +
      `Team: ${shift.team_name}\n` +
      `Typ: ${getShiftTypeText(shift.shift_type)}\n` +
      `Start: ${new Date(shift.start_time).toLocaleString()}\n` +
      `Slut: ${new Date(shift.end_time).toLocaleString()}\n` +
      `Cykeldag: ${shift.cycle_day}`,
      [{ text: 'OK' }]
    );
  };

  const handleStatsClick = (stat: Stats) => {
    console.log('📊 Statistik klickad:', stat.team_name);
    Alert.alert(
      `${stat.team_name} Statistik`,
      `Totalt skift: ${stat.total_shifts}\n` +
      `Förmiddag: ${stat.morning_shifts}\n` +
      `Eftermiddag: ${stat.afternoon_shifts}\n` +
      `Natt: ${stat.night_shifts}\n` +
      `Lediga dagar: ${stat.free_days}\n` +
      `Totala timmar: ${stat.total_hours}h\n` +
      `Genomsnittlig skifttid: ${stat.average_shift_length}h`,
      [{ text: 'OK' }]
    );
  };

  const handleValidateRules = async () => {
    console.log('🔍 Validerar SSAB Oxelösund regler...');
    try {
      const { data: validation, error } = await supabase
        .rpc('validate_ssab_oxelosund_rules', {
          p_start_date: '2023-01-01',
          p_end_date: '2025-12-31'
        });

      if (error) {
        Alert.alert('Validering Fel', error.message);
        return;
      }

      const validationText = validation?.map(rule => 
        `${rule.validation_rule}: ${rule.status}\n${rule.details}`
      ).join('\n\n') || 'Ingen validering tillgänglig';

      Alert.alert('SSAB Oxelösund Regler Validering', validationText);
    } catch (err) {
      Alert.alert('Fel', 'Kunde inte validera regler');
    }
  };

  const handleGenerateShifts = async () => {
    console.log('🔄 Genererar skift...');
    try {
      const { data, error } = await supabase
        .rpc('generate_ssab_oxelosund_shifts', {
          p_start_date: '2025-01-01',
          p_end_date: '2025-12-31'
        });

      if (error) {
        Alert.alert('Generering Fel', error.message);
        return;
      }

      Alert.alert('Skift Genererade', `${data || 0} skift har genererats!`);
      fetchData(); // Uppdatera data
    } catch (err) {
      Alert.alert('Fel', 'Kunde inte generera skift');
    }
  };

  const handleExportData = () => {
    console.log('📤 Exporterar data...');
    const exportData = {
      teams,
      shifts,
      stats,
      config: SSAB_CONFIG,
      timestamp: new Date().toISOString()
    };

    Alert.alert(
      'Exportera Data',
      `Data exporterad:\n` +
      `- ${teams.length} teams\n` +
      `- ${shifts.length} skift\n` +
      `- ${stats.length} statistik poster\n\n` +
      `Data sparas i konsolen.`,
      [{ text: 'OK' }]
    );

    console.log('📤 Exporterad data:', exportData);
  };

  // Helper funktioner
  const getShiftTypeText = (type: string) => {
    switch (type) {
      case 'F': return 'Förmiddagsskift';
      case 'E': return 'Eftermiddagsskift';
      case 'N': return 'Nattskift';
      case 'L': return 'Ledig';
      default: return 'Okänd';
    }
  };

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'F': return '#4CAF50';
      case 'E': return '#FF9800';
      case 'N': return '#2196F3';
      case 'L': return '#9E9E9E';
      default: return '#000000';
    }
  };

  // Render funktioner
  const renderTeamSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Välj Team</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.teamButton, selectedTeam === 'all' && styles.selectedTeam]}
          onPress={() => handleTeamSelect('all')}
        >
          <Text style={[styles.teamButtonText, selectedTeam === 'all' && styles.selectedTeamText]}>
            Alla Teams
          </Text>
        </TouchableOpacity>
        {teams.map(team => (
          <TouchableOpacity
            key={team.id}
            style={[styles.teamButton, selectedTeam === team.name && styles.selectedTeam]}
            onPress={() => handleTeamSelect(team.name)}
          >
            <View style={[styles.teamColor, { backgroundColor: team.color_hex }]} />
            <Text style={[styles.teamButtonText, selectedTeam === team.name && styles.selectedTeamText]}>
              {team.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderShifts = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Skift ({shifts.length})</Text>
      {shifts.length === 0 ? (
        <Text style={styles.noData}>Inga skift hittade</Text>
      ) : (
        shifts.map(shift => (
          <TouchableOpacity
            key={shift.id}
            style={styles.shiftItem}
            onPress={() => handleShiftClick(shift)}
          >
            <View style={[styles.shiftTypeIndicator, { backgroundColor: getShiftTypeColor(shift.shift_type) }]} />
            <View style={styles.shiftContent}>
              <Text style={styles.shiftTitle}>{shift.title}</Text>
              <Text style={styles.shiftDetails}>
                {new Date(shift.start_time).toLocaleDateString()} - {shift.team_name}
              </Text>
            </View>
            <Text style={styles.shiftType}>{shift.shift_type}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Statistik</Text>
      {stats.length === 0 ? (
        <Text style={styles.noData}>Ingen statistik tillgänglig</Text>
      ) : (
        stats.map(stat => (
          <TouchableOpacity
            key={stat.team_name}
            style={styles.statItem}
            onPress={() => handleStatsClick(stat)}
          >
            <Text style={styles.statTitle}>{stat.team_name}</Text>
            <Text style={styles.statDetails}>
              {stat.total_shifts} skift • {stat.total_hours}h • {stat.average_shift_length}h/skift
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Åtgärder</Text>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleValidateRules}>
          <Text style={styles.actionButtonText}>Validera Regler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleGenerateShifts}>
          <Text style={styles.actionButtonText}>Generera Skift</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
          <Text style={styles.actionButtonText}>Exportera Data</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Huvudrender
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Hämtar SSAB Oxelösund data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>🏭 SSAB Oxelösund</Text>
          <Text style={styles.subtitle}>3-Skift System</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
              <Text style={styles.retryButtonText}>Försök igen</Text>
            </TouchableOpacity>
          </View>
        )}

        {renderTeamSelector()}
        {renderShifts()}
        {renderStats()}
        {renderActionButtons()}
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    margin: 20,
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  retryButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f44336',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
  },
  section: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  teamSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  teamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedTeam: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  teamColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  teamButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTeamText: {
    color: 'white',
  },
  shiftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  shiftTypeIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  shiftContent: {
    flex: 1,
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  shiftDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  shiftType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  statItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default SSABOxelosundApp; 