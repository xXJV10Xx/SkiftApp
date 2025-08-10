// 🏭 CORRECTED SSAB Oxelösund App Component
// Updated to use the corrected 3-shift schedule for teams 31-35

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
import SSABFinalCorrect from './SSAB_Final_Correct';

// ✅ Supabase client with correct credentials
const supabase = createClient(
  'https://fsefeherdbtsddqimjco.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk'
);

interface Shift {
  id?: string;
  team: number;
  date: string;
  type: 'F' | 'E' | 'N' | 'L';
  start_time: string;
  end_time: string;
  created_at?: string;
  is_generated?: boolean;
}

interface TeamStats {
  team: number;
  totalShifts: number;
  morningShifts: number;
  afternoonShifts: number;
  nightShifts: number;
  freeDays: number;
}

export default function SSABUpdatedApp() {
  // State
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [stats, setStats] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('2025-01');
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch data from Supabase
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🏭 Fetching SSAB Oxelösund corrected data...');

      // Build date range for selected month
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(selectedMonth + '-01');
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Last day of month
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch shifts from Supabase
      let query = supabase
        .from('shifts')
        .select('*')
        .in('team', [31, 32, 33, 34, 35])
        .gte('date', startDate)
        .lte('date', endDateStr)
        .order('date', { ascending: true })
        .order('team', { ascending: true });

      if (selectedTeam) {
        query = query.eq('team', selectedTeam);
      }

      const { data: shiftsData, error: shiftsError } = await query;

      if (shiftsError) {
        throw new Error(`Error fetching shifts: ${shiftsError.message}`);
      }

      const processedShifts = (shiftsData || []).map(shift => ({
        ...shift,
        start_time: shift.start_time || '',
        end_time: shift.end_time || ''
      }));

      setShifts(processedShifts);
      console.log(`✅ ${processedShifts.length} shifts loaded`);

      // Calculate statistics
      calculateStats(processedShifts);

    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [selectedTeam, selectedMonth]);

  // ✅ Calculate team statistics
  const calculateStats = (shifts: Shift[]) => {
    const teamStats: { [key: number]: TeamStats } = {};
    
    // Initialize stats for teams 31-35
    for (let team = 31; team <= 35; team++) {
      teamStats[team] = {
        team,
        totalShifts: 0,
        morningShifts: 0,
        afternoonShifts: 0,
        nightShifts: 0,
        freeDays: 0
      };
    }

    // Count shifts by type
    shifts.forEach(shift => {
      const stat = teamStats[shift.team];
      if (stat) {
        stat.totalShifts++;
        
        switch (shift.type) {
          case 'F':
            stat.morningShifts++;
            break;
          case 'E':
            stat.afternoonShifts++;
            break;
          case 'N':
            stat.nightShifts++;
            break;
          case 'L':
            stat.freeDays++;
            break;
        }
      }
    });

    setStats(Object.values(teamStats));
  };

  // Load data when component mounts or dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ Refresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // ✅ Update Supabase with corrected schedule
  const updateScheduleToCorrect = async () => {
    try {
      console.log('🔄 Updating to corrected SSAB schedule...');
      setLoading(true);

      // Generate corrected schedule for current year
      const correctedResult = SSABFinalCorrect.generateForProduction();
      
      Alert.alert(
        'Schedule Correction',
        `Generated ${correctedResult.shifts.length} corrected shifts.\n\nSuccess rate: ${Math.round((correctedResult.validation.stats.perfectDays/correctedResult.validation.stats.totalDays)*100)}%\n\nThis corrects the schedule to follow exact SSAB Oxelösund patterns.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Update Database', 
            onPress: async () => {
              try {
                // Delete existing data for teams 31-35
                const { error: deleteError } = await supabase
                  .from('shifts')
                  .delete()
                  .in('team', [31, 32, 33, 34, 35])
                  .gte('date', '2025-01-01')
                  .lte('date', '2025-12-31');

                if (deleteError) {
                  throw deleteError;
                }

                // Insert corrected data in batches
                const batchSize = 1000;
                for (let i = 0; i < correctedResult.supabaseData.length; i += batchSize) {
                  const batch = correctedResult.supabaseData.slice(i, i + batchSize);
                  
                  const { error: insertError } = await supabase
                    .from('shifts')
                    .insert(batch);

                  if (insertError) {
                    throw insertError;
                  }
                }

                Alert.alert('Success', 'Schedule updated with corrected SSAB Oxelösund patterns!');
                fetchData(); // Refresh data
              } catch (error) {
                Alert.alert('Error', `Failed to update schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          }
        ]
      );

    } catch (error) {
      Alert.alert('Error', `Failed to generate corrected schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle shift details
  const handleShiftPress = (shift: Shift) => {
    const shiftTypeName = {
      'F': 'Förmiddagsskift',
      'E': 'Eftermiddagsskift', 
      'N': 'Nattskift',
      'L': 'Ledig'
    }[shift.type];

    Alert.alert(
      `Team ${shift.team} - ${shift.date}`,
      `${shiftTypeName}\n\n` +
      `Typ: ${shift.type}\n` +
      `Tid: ${shift.start_time} - ${shift.end_time}\n` +
      `Datum: ${shift.date}`,
      [{ text: 'OK' }]
    );
  };

  // ✅ Team selector
  const renderTeamSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Välj Team</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.teamButton, selectedTeam === null && styles.selectedTeam]}
          onPress={() => setSelectedTeam(null)}
        >
          <Text style={[styles.teamButtonText, selectedTeam === null && styles.selectedTeamText]}>
            Alla Teams
          </Text>
        </TouchableOpacity>
        {[31, 32, 33, 34, 35].map(team => (
          <TouchableOpacity
            key={team}
            style={[styles.teamButton, selectedTeam === team && styles.selectedTeam]}
            onPress={() => setSelectedTeam(team)}
          >
            <Text style={[styles.teamButtonText, selectedTeam === team && styles.selectedTeamText]}>
              Lag {team}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // ✅ Month selector
  const renderMonthSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Välj Månad</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
          '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'
        ].map(month => (
          <TouchableOpacity
            key={month}
            style={[styles.monthButton, selectedMonth === month && styles.selectedMonth]}
            onPress={() => setSelectedMonth(month)}
          >
            <Text style={[styles.monthButtonText, selectedMonth === month && styles.selectedMonthText]}>
              {month}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // ✅ Shifts list
  const renderShifts = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Skift ({shifts.length})</Text>
      {shifts.length === 0 ? (
        <Text style={styles.noData}>Inga skift hittade för vald period</Text>
      ) : (
        <ScrollView style={styles.shiftsList}>
          {shifts.map((shift, index) => (
            <TouchableOpacity
              key={`${shift.team}-${shift.date}-${index}`}
              style={styles.shiftItem}
              onPress={() => handleShiftPress(shift)}
            >
              <View style={[styles.shiftTypeIndicator, { backgroundColor: getShiftColor(shift.type) }]} />
              <View style={styles.shiftContent}>
                <Text style={styles.shiftTitle}>Lag {shift.team}</Text>
                <Text style={styles.shiftDetails}>
                  {shift.date} • {getShiftTypeName(shift.type)}
                </Text>
                <Text style={styles.shiftTime}>
                  {shift.start_time} - {shift.end_time}
                </Text>
              </View>
              <Text style={[styles.shiftType, { color: getShiftColor(shift.type) }]}>
                {shift.type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  // ✅ Statistics
  const renderStats = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Statistik</Text>
      {stats.map(stat => (
        <View key={stat.team} style={styles.statItem}>
          <Text style={styles.statTitle}>Lag {stat.team}</Text>
          <View style={styles.statRow}>
            <Text style={styles.statText}>F: {stat.morningShifts}</Text>
            <Text style={styles.statText}>E: {stat.afternoonShifts}</Text>
            <Text style={styles.statText}>N: {stat.nightShifts}</Text>
            <Text style={styles.statText}>L: {stat.freeDays}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  // ✅ Control buttons
  const renderControls = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Åtgärder</Text>
      <View style={styles.controlButtons}>
        <TouchableOpacity style={styles.controlButton} onPress={updateScheduleToCorrect}>
          <Text style={styles.controlButtonText}>🔄 Korrigera Schema</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={fetchData}>
          <Text style={styles.controlButtonText}>🔄 Uppdatera Data</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Helper functions
  const getShiftColor = (type: string) => {
    switch (type) {
      case 'F': return '#4CAF50'; // Green
      case 'E': return '#FF9800'; // Orange
      case 'N': return '#2196F3'; // Blue
      case 'L': return '#9E9E9E'; // Gray
      default: return '#000000';
    }
  };

  const getShiftTypeName = (type: string) => {
    switch (type) {
      case 'F': return 'Förmiddag';
      case 'E': return 'Eftermiddag';
      case 'N': return 'Natt';
      case 'L': return 'Ledig';
      default: return 'Okänd';
    }
  };

  // Main render
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
          <Text style={styles.subtitle}>Korrigerat 3-Skift System (Lag 31-35)</Text>
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
        {renderMonthSelector()}
        {renderShifts()}
        {renderStats()}
        {renderControls()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ✅ Korrigerat schema enligt SSAB Oxelösund specifikationer
          </Text>
          <Text style={styles.footerText}>
            📊 Teams 31-35 följer exakta mönster och regler
          </Text>
        </View>
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
    fontSize: 14,
    color: 'white',
    marginTop: 5,
    textAlign: 'center',
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
  teamButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedTeam: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  teamButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTeamText: {
    color: 'white',
  },
  monthButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedMonth: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  monthButtonText: {
    fontSize: 12,
    color: '#333',
  },
  selectedMonthText: {
    color: 'white',
  },
  shiftsList: {
    maxHeight: 300,
  },
  shiftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
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
  shiftTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  shiftType: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    margin: 20,
    padding: 15,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#2e7d32',
    textAlign: 'center',
    marginBottom: 5,
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default SSABUpdatedApp;