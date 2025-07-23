import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface Shift {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  shift_team_id: string;
  team_name: string;
  color_hex: string;
  user_id: string;
  shift_type: string;
  notes?: string;
}

interface ShiftTeam {
  id: string;
  name: string;
  color_hex: string;
  description?: string;
}

interface CalendarDay {
  date: Date;
  shifts: Shift[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

export default function AdvancedCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [teams, setTeams] = useState<ShiftTeam[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Memoized functions for better performance
  const fetchTeams = useCallback(async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('shift_teams')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching teams:', error);
        setError('Kunde inte hämta team.');
        Alert.alert('Fel', 'Kunde inte hämta team.');
      } else {
        setTeams(data || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Ett oväntat fel uppstod.');
    }
  }, []);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .rpc('get_calendar_shifts', {
          team_filter_id: selectedFilter,
        });

      if (error) {
        console.error('Error fetching shifts:', error);
        setError('Kunde inte hämta skift.');
        Alert.alert('Fel', 'Kunde inte hämta skift.');
      } else {
        setShifts(data || []);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
      setError('Ett oväntat fel uppstod.');
    } finally {
      setLoading(false);
    }
  }, [selectedFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTeams(), fetchShifts()]);
    setRefreshing(false);
  }, [fetchTeams, fetchShifts]);

  // Generate calendar days with memoization
  const generateCalendarDays = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const date = new Date(d);
      const dayShifts = shifts.filter(shift => {
        const shiftDate = new Date(shift.start_time);
        return shiftDate.toDateString() === date.toDateString();
      });
      
      days.push({
        date,
        shifts: dayShifts,
        isToday: date.toDateString() === today.toDateString(),
        isCurrentMonth: date.getMonth() === month,
      });
    }
    
    setCalendarDays(days);
  }, [currentDate, shifts]);

  // Memoized month navigation
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  }, []);

  // Memoized filter change
  const handleFilterChange = useCallback((filter: string) => {
    setSelectedFilter(filter);
  }, []);

  // Effects
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  useEffect(() => {
    generateCalendarDays();
  }, [generateCalendarDays]);

  // Memoized utility functions
  const getMonthName = useCallback((date: Date) => {
    const months = [
      'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
      'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
    ];
    return months[date.getMonth()];
  }, []);

  const renderShift = useCallback((shift: Shift) => (
    <View
      key={shift.id}
      style={[
        styles.shiftItem,
        { backgroundColor: shift.color_hex },
      ]}
    >
      <Text style={styles.shiftTitle} numberOfLines={1}>
        {shift.title}
      </Text>
      <Text style={styles.shiftTime}>
        {new Date(shift.start_time).toLocaleTimeString('sv-SE', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  ), []);

  const renderCalendarDay = useCallback((day: CalendarDay) => {
    const hasShifts = day.shifts.length > 0;
    const isLeisureDay = !hasShifts && day.isCurrentMonth;

    return (
      <View
        key={day.date.toISOString()}
        style={[
          styles.calendarDay,
          day.isToday && styles.today,
          !day.isCurrentMonth && styles.otherMonth,
        ]}
      >
        <Text
          style={[
            styles.dayNumber,
            day.isToday && styles.todayText,
            !day.isCurrentMonth && styles.otherMonthText,
          ]}
        >
          {day.date.getDate()}
        </Text>
        
        {isLeisureDay && (
          <View style={styles.leisureIndicator}>
            <Text style={styles.leisureText}>L</Text>
          </View>
        )}
        
        {day.shifts.map(renderShift)}
      </View>
    );
  }, [renderShift]);

  // Memoized filter options
  const filterOptions = useMemo(() => [
    { id: 'all', label: 'Alla team' },
    ...teams.map(team => ({ id: team.id, label: team.name, color: team.color_hex }))
  ], [teams]);

  if (error && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Försök igen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('prev')}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>
          {getMonthName(currentDate)} {currentDate.getFullYear()}
        </Text>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateMonth('next')}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Team filter */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.filterOption,
                selectedFilter === option.id && styles.filterOptionSelected,
              ]}
              onPress={() => handleFilterChange(option.id)}
            >
              {option.color && (
                <View
                  style={[
                    styles.teamColorDot,
                    { backgroundColor: option.color },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === option.id && styles.filterTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Calendar grid */}
      <View style={styles.calendarContainer}>
        {/* Day headers */}
        <View style={styles.dayHeaders}>
          {['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'].map((day) => (
            <Text key={day} style={styles.dayHeader}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar days */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Laddar skift...</Text>
          </View>
        ) : (
          <View style={styles.calendarGrid}>
            {calendarDays.map(renderCalendarDay)}
          </View>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Team</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {teams.map((team) => (
            <View key={team.id} style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: team.color_hex },
                ]}
              />
              <Text style={styles.legendText}>{team.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  filterContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterOptionSelected: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextSelected: {
    color: '#fff',
  },
  teamColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  calendarContainer: {
    flex: 1,
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  calendarGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    padding: 4,
    backgroundColor: '#fff',
  },
  today: {
    backgroundColor: '#f0f8ff',
  },
  otherMonth: {
    backgroundColor: '#f9f9f9',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  todayText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  otherMonthText: {
    color: '#ccc',
  },
  leisureIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  leisureText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  shiftItem: {
    padding: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  shiftTitle: {
    fontSize: 8,
    fontWeight: '600',
    color: '#fff',
  },
  shiftTime: {
    fontSize: 7,
    color: '#fff',
    opacity: 0.9,
  },
  legendContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
}); 