import { Calendar, ChevronLeft, ChevronRight, Clock, Plus, MoreHorizontal } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase, Shift, subscribeToShifts } from '../../lib/supabase';

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load shifts for the current month
  const loadShifts = async (date: Date = currentDate) => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get first day of month and last day of month
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('owner_id', user.id)
        .gte('start_time', firstDay.toISOString())
        .lte('start_time', lastDay.toISOString())
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading shifts:', error);
        Alert.alert('Fel', 'Kunde inte ladda arbetspass');
        return;
      }

      setShifts(data || []);
    } catch (error) {
      console.error('Error loading shifts:', error);
      Alert.alert('Fel', 'Ett oväntat fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadShifts();
    setRefreshing(false);
  };

  // Load shifts when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadShifts();
    }
  }, [user]);

  // Setup realtime subscription for shifts
  useEffect(() => {
    if (!user) return;

    const subscription = subscribeToShifts(user.id, (payload) => {
      console.log('Shift update received:', payload);
      // Reload shifts when there's a change
      loadShifts();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const goToPreviousMonth = async () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    await loadShifts(newDate);
  };

  const goToNextMonth = async () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    await loadShifts(newDate);
  };

  const goToToday = async () => {
    const today = new Date();
    setCurrentDate(today);
    await loadShifts(today);
  };

  // Get shifts for a specific date
  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return (
        shiftDate.getDate() === date.getDate() &&
        shiftDate.getMonth() === date.getMonth() &&
        shiftDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Format duration
  const getShiftDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10;
    return `${diffHours}h`;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const monthNames = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];

  const weekDays = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];

  const calendarDays = generateCalendarDays();
  const today = new Date();

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.monthYear, { color: colors.text }]}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <ChevronRight size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={goToToday} style={[styles.todayButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.todayButtonText, { color: colors.background }]}>
            Idag
          </Text>
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <View style={[styles.calendar, { backgroundColor: colors.card }]}>
        {/* Week days header */}
        <View style={styles.weekDaysHeader}>
          {weekDays.map((day, index) => (
            <Text key={index} style={[styles.weekDay, { color: colors.textSecondary }]}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((date, index) => {
            if (!date) {
              return <View key={index} style={styles.emptyDay} />;
            }

            const dayShifts = getShiftsForDate(date);
            const isToday = date.toDateString() === today.toDateString();

            return (
              <View key={index} style={styles.dayContainer}>
                <View style={[
                  styles.dayHeader,
                  isToday && { backgroundColor: colors.primary }
                ]}>
                  <Text style={[
                    styles.dayNumber,
                    { color: isToday ? colors.background : colors.text }
                  ]}>
                    {date.getDate()}
                  </Text>
                </View>

                {/* Shifts for this day */}
                <View style={styles.dayShifts}>
                  {dayShifts.slice(0, 2).map((shift, shiftIndex) => (
                    <View
                      key={shift.id}
                      style={[
                        styles.shiftIndicator,
                        { backgroundColor: colors.primary }
                      ]}
                    >
                      <Text style={[styles.shiftTime, { color: colors.background }]}>
                        {formatTime(shift.start_time)}
                      </Text>
                    </View>
                  ))}
                  {dayShifts.length > 2 && (
                    <Text style={[styles.moreShifts, { color: colors.textSecondary }]}>
                      +{dayShifts.length - 2}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Upcoming shifts */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Kommande pass
          </Text>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Laddar pass...
            </Text>
          </View>
        ) : shifts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Inga pass schemalagda denna månad
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Tryck på + för att lägga till ett nytt pass
            </Text>
          </View>
        ) : (
          <View style={styles.shiftsList}>
            {shifts.slice(0, 5).map((shift) => (
              <View key={shift.id} style={[styles.shiftCard, { backgroundColor: colors.background }]}>
                <View style={styles.shiftCardContent}>
                  <View style={styles.shiftInfo}>
                    <Text style={[styles.shiftTitle, { color: colors.text }]}>
                      {shift.title}
                    </Text>
                    <View style={styles.shiftDetails}>
                      <Clock size={14} color={colors.textSecondary} />
                      <Text style={[styles.shiftTime, { color: colors.textSecondary }]}>
                        {formatTime(shift.start_time)} - {formatTime(shift.end_time)} 
                        ({getShiftDuration(shift.start_time, shift.end_time)})
                      </Text>
                    </View>
                    {shift.location && (
                      <Text style={[styles.shiftLocation, { color: colors.textSecondary }]}>
                        📍 {shift.location}
                      </Text>
                    )}
                    {shift.description && (
                      <Text style={[styles.shiftDescription, { color: colors.textSecondary }]}>
                        {shift.description}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.shiftMenu}>
                    <MoreHorizontal size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  todayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendar: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: '14.28%',
    height: 60,
  },
  dayContainer: {
    width: '14.28%',
    height: 60,
    padding: 2,
  },
  dayHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    borderRadius: 12,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayShifts: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftIndicator: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginVertical: 1,
    minWidth: 30,
  },
  shiftTime: {
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  moreShifts: {
    fontSize: 8,
    fontWeight: '600',
  },
  section: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  shiftsList: {
    gap: 12,
  },
  shiftCard: {
    borderRadius: 8,
    padding: 12,
  },
  shiftCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shiftInfo: {
    flex: 1,
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  shiftDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  shiftLocation: {
    fontSize: 14,
    marginBottom: 4,
  },
  shiftDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  shiftMenu: {
    padding: 4,
  },
});