import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  color: string;
  company_id: string;
  department_id: string | null;
  team_id: string | null;
  is_active: boolean;
}

interface ShiftSchedule {
  id: string;
  user_id: string;
  shift_id: string;
  date: string;
  status: string;
  notes: string | null;
  shift?: Shift;
}

interface ShiftSwap {
  id: string;
  requester_id: string;
  requested_user_id: string;
  shift_schedule_id: string;
  status: string;
  reason: string | null;
  created_at: string;
}

export const ShiftManagement: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [schedules, setSchedules] = useState<ShiftSchedule[]>([]);
  const [swaps, setSwaps] = useState<ShiftSwap[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Ladda skift
      const { data: shiftsData } = await supabase
        .from('shifts')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (shiftsData) {
        setShifts(shiftsData);
      }

      // Ladda scheman
      const { data: schedulesData } = await supabase
        .from('shift_schedules')
        .select(`
          *,
          shift:shifts(*)
        `)
        .order('date');
      
      if (schedulesData) {
        setSchedules(schedulesData);
      }

      // Ladda skiftbyten
      const { data: swapsData } = await supabase
        .from('shift_swaps')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (swapsData) {
        setSwaps(swapsData);
      }

    } catch (error) {
      console.error('Fel vid laddning av skiftdata:', error);
      Alert.alert('Fel', 'Kunde inte ladda skiftdata');
    } finally {
      setLoading(false);
    }
  };

  const getSchedulesForDate = (date: string) => {
    return schedules.filter(schedule => schedule.date === date);
  };

  const getPendingSwaps = () => {
    return swaps.filter(swap => swap.status === 'pending');
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM format
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#007AFF';
      case 'confirmed': return '#34C759';
      case 'completed': return '#5856D6';
      case 'cancelled': return '#FF3B30';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Schemalagt';
      case 'confirmed': return 'Bekräftat';
      case 'completed': return 'Genomfört';
      case 'cancelled': return 'Avbokat';
      default: return status;
    }
  };

  const getSwapStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'accepted': return '#34C759';
      case 'rejected': return '#FF3B30';
      case 'cancelled': return '#666';
      default: return '#666';
    }
  };

  const getSwapStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Väntar';
      case 'accepted': return 'Accepterat';
      case 'rejected': return 'Avvisat';
      case 'cancelled': return 'Avbrutet';
      default: return status;
    }
  };

  const handleSwapAction = async (swapId: string, action: 'accept' | 'reject') => {
    try {
      const newStatus = action === 'accept' ? 'accepted' : 'rejected';
      
      const { error } = await supabase
        .from('shift_swaps')
        .update({ status: newStatus })
        .eq('id', swapId);
      
      if (error) throw error;
      
      Alert.alert('Framgång', `Skiftbyte ${action === 'accept' ? 'accepterat' : 'avvisat'}`);
      loadData(); // Ladda om data
      
    } catch (error) {
      console.error('Fel vid hantering av skiftbyte:', error);
      Alert.alert('Fel', 'Kunde inte hantera skiftbyte');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Laddar skiftdata...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Skifthantering</Text>
      
      {/* Skiftbyten */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Väntande skiftbyten</Text>
        {getPendingSwaps().map(swap => (
          <View key={swap.id} style={styles.swapCard}>
            <View style={styles.swapHeader}>
              <Text style={styles.swapTitle}>Skiftbyte begärt</Text>
              <Text style={[styles.swapStatus, { color: getSwapStatusColor(swap.status) }]}>
                {getSwapStatusLabel(swap.status)}
              </Text>
            </View>
            
            <Text style={styles.swapDetails}>
              Anledning: {swap.reason || 'Ingen anledning angiven'}
            </Text>
            
            <Text style={styles.swapDate}>
              Skapad: {new Date(swap.created_at).toLocaleDateString('sv-SE')}
            </Text>
            
            <View style={styles.swapActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleSwapAction(swap.id, 'accept')}
              >
                <Text style={styles.actionButtonText}>Acceptera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleSwapAction(swap.id, 'reject')}
              >
                <Text style={styles.actionButtonText}>Avvisa</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        {getPendingSwaps().length === 0 && (
          <Text style={styles.noData}>Inga väntande skiftbyten</Text>
        )}
      </View>

      {/* Dagens schema */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dagens schema ({selectedDate})</Text>
        {getSchedulesForDate(selectedDate).map(schedule => (
          <View key={schedule.id} style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleName}>
                {schedule.shift?.name || 'Okänt skift'}
              </Text>
              <Text style={[styles.scheduleStatus, { color: getStatusColor(schedule.status) }]}>
                {getStatusLabel(schedule.status)}
              </Text>
            </View>
            
            <View style={styles.scheduleTime}>
              <Text style={styles.timeText}>
                {formatTime(schedule.shift?.start_time || '')} - {formatTime(schedule.shift?.end_time || '')}
              </Text>
              {schedule.shift?.break_duration && schedule.shift.break_duration > 0 && (
                <Text style={styles.breakText}>
                  Rast: {schedule.shift.break_duration} min
                </Text>
              )}
            </View>
            
            {schedule.notes && (
              <Text style={styles.scheduleNotes}>
                Anteckning: {schedule.notes}
              </Text>
            )}
          </View>
        ))}
        
        {getSchedulesForDate(selectedDate).length === 0 && (
          <Text style={styles.noData}>Inga schemalagda skift idag</Text>
        )}
      </View>

      {/* Tillgängliga skift */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tillgängliga skift</Text>
        {shifts.map(shift => (
          <View key={shift.id} style={styles.shiftCard}>
            <View style={[styles.shiftColor, { backgroundColor: shift.color }]} />
            <View style={styles.shiftInfo}>
              <Text style={styles.shiftName}>{shift.name}</Text>
              <Text style={styles.shiftTime}>
                {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
              </Text>
              {shift.break_duration > 0 && (
                <Text style={styles.shiftBreak}>
                  Rast: {shift.break_duration} min
                </Text>
              )}
            </View>
          </View>
        ))}
        
        {shifts.length === 0 && (
          <Text style={styles.noData}>Inga skift konfigurerade</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  swapCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  swapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  swapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  swapStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  swapDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  swapDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  swapActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scheduleStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  scheduleTime: {
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  breakText: {
    fontSize: 12,
    color: '#888',
  },
  scheduleNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  shiftCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shiftColor: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  shiftBreak: {
    fontSize: 12,
    color: '#888',
  },
  noData: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
}); 