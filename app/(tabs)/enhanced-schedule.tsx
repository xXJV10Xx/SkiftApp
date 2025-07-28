import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Wifi, WifiOff } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useCompany } from '../../context/CompanyContext';
import { useRealTimeSchedule } from '../../context/RealTimeScheduleContext';
import { useTheme } from '../../context/ThemeContext';

export default function EnhancedScheduleScreen() {
  const { colors } = useTheme();
  const { selectedCompany, selectedTeam, selectedDepartment } = useCompany();
  const {
    schedules,
    currentMonthSchedules,
    todaySchedule,
    nextShift,
    loading,
    error,
    lastUpdated,
    refreshSchedules,
    getScheduleForDate,
    getSchedulesForDateRange
  } = useRealTimeSchedule();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshSchedules();
    } catch (error) {
      console.error('Error refreshing schedules:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshSchedules]);

  // Navigation functions
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
  };

  // Get shift color based on shift type
  const getShiftColor = (shiftType: string) => {
    const shiftColors: Record<string, string> = {
      'Dagskift': '#4ECDC4',
      'Kvällsskift': '#FF6B6B', 
      'Nattskift': '#45B7D1',
      'Morgonpass': '#96CEB4',
      'Eftermiddagspass': '#FFA502',
      'Helgpass': '#9B59B6',
      'Ledig': '#95A5A6'
    };
    
    // Use team color if available
    if (selectedCompany && selectedTeam) {
      const teamColor = selectedCompany.colors[selectedTeam];
      if (teamColor) return teamColor;
    }
    
    return shiftColors[shiftType] || '#95A5A6';
  };

  // Format time for display
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); // Remove seconds
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days = [];
    const currentDay = new Date(startDate);
    
    // Generate 6 weeks worth of days
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(currentDay);
        const isCurrentMonth = date.getMonth() === month;
        const isToday = date.toDateString() === new Date().toDateString();
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const schedule = getScheduleForDate(date);
        
        weekDays.push({
          date,
          day: date.getDate(),
          isCurrentMonth,
          isToday,
          isWeekend,
          schedule
        });
        
        currentDay.setDate(currentDay.getDate() + 1);
      }
      days.push(weekDays);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];
  const dayNames = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.card,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    navigationButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    navButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 8,
    },
    todayButton: {
      backgroundColor: colors.secondary,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    todayButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    refreshButton: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 8,
      marginLeft: 8,
    },
    monthTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    companyInfo: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    statusBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
    },
    statusText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    onlineIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    calendarContainer: {
      padding: 16,
    },
    weekHeader: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    weekDay: {
      flex: 1,
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      paddingVertical: 8,
    },
    calendarGrid: {
      gap: 1,
    },
    weekRow: {
      flexDirection: 'row',
      gap: 1,
    },
    dayCell: {
      flex: 1,
      minHeight: 80,
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    otherMonthCell: {
      opacity: 0.3,
    },
    todayCell: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    selectedCell: {
      backgroundColor: colors.surface,
    },
    weekendCell: {
      backgroundColor: colors.surface,
    },
    dayNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    shiftBadge: {
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginBottom: 2,
    },
    shiftText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'white',
    },
    shiftTime: {
      fontSize: 9,
      color: colors.textSecondary,
    },
    shiftLocation: {
      fontSize: 8,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      backgroundColor: '#FFE6E6',
      padding: 12,
      margin: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#FF6B6B',
    },
    errorText: {
      color: '#D63031',
      fontSize: 14,
      textAlign: 'center',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    quickInfo: {
      backgroundColor: colors.card,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    quickInfoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    quickInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    quickInfoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    quickInfoValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
  });

  // Show empty state if no company/team selected
  if (!selectedCompany || !selectedTeam) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Calendar size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Inget schema tillgängligt</Text>
          <Text style={styles.emptyText}>
            Välj företag och lag på startsidan för att se ditt schema från den senaste skrapningen
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Schema</Text>
          <View style={styles.navigationButtons}>
            <TouchableOpacity style={styles.navButton} onPress={goToPreviousMonth}>
              <ChevronLeft size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
              <Text style={styles.todayButtonText}>Idag</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
              <ChevronRight size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} disabled={loading}>
              <RefreshCw size={16} color={loading ? colors.textSecondary : colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.monthTitle}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <Text style={styles.companyInfo}>
          {selectedCompany.name} - Lag {selectedTeam}
          {selectedDepartment && ` - ${selectedDepartment}`}
        </Text>
        
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            {schedules.length} scheman laddade
          </Text>
          <View style={styles.onlineIndicator}>
            <Wifi size={12} color={colors.primary} />
            <Text style={styles.statusText}>
              {lastUpdated ? `Uppdaterad ${lastUpdated.toLocaleTimeString('sv-SE')}` : 'Laddar...'}
            </Text>
          </View>
        </View>
      </View>

      {/* Error display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Fel vid laddning av schema: {error}
          </Text>
        </View>
      )}

      <ScrollView 
        style={styles.calendarContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Week header */}
        <View style={styles.weekHeader}>
          {dayNames.map((day) => (
            <Text key={day} style={styles.weekDay}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((day, dayIndex) => (
                <TouchableOpacity
                  key={dayIndex}
                  style={[
                    styles.dayCell,
                    !day.isCurrentMonth && styles.otherMonthCell,
                    day.isToday && styles.todayCell,
                    day.isWeekend && styles.weekendCell,
                    selectedDate?.toDateString() === day.date.toDateString() && styles.selectedCell,
                  ]}
                  onPress={() => setSelectedDate(day.date)}
                >
                  <Text style={styles.dayNumber}>{day.day}</Text>
                  {day.schedule && (
                    <>
                      <View
                        style={[
                          styles.shiftBadge,
                          { backgroundColor: getShiftColor(day.schedule.shift_type) }
                        ]}
                      >
                        <Text style={styles.shiftText}>
                          {day.schedule.shift_type}
                        </Text>
                      </View>
                      {(day.schedule.start_time || day.schedule.end_time) && (
                        <Text style={styles.shiftTime}>
                          {formatTime(day.schedule.start_time)}-{formatTime(day.schedule.end_time)}
                        </Text>
                      )}
                      {day.schedule.location && (
                        <Text style={styles.shiftLocation}>
                          {day.schedule.location}
                        </Text>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Quick info footer */}
      <View style={styles.quickInfo}>
        <Text style={styles.quickInfoTitle}>Snabbinfo</Text>
        <View style={styles.quickInfoRow}>
          <Text style={styles.quickInfoLabel}>Dagens pass:</Text>
          <Text style={styles.quickInfoValue}>
            {todaySchedule ? todaySchedule.shift_type : 'Inget pass'}
          </Text>
        </View>
        <View style={styles.quickInfoRow}>
          <Text style={styles.quickInfoLabel}>Nästa pass:</Text>
          <Text style={styles.quickInfoValue}>
            {nextShift ? `${nextShift.shift_type} (${new Date(nextShift.date).toLocaleDateString('sv-SE')})` : 'Inget kommande pass'}
          </Text>
        </View>
        <View style={styles.quickInfoRow}>
          <Text style={styles.quickInfoLabel}>Denna månad:</Text>
          <Text style={styles.quickInfoValue}>
            {currentMonthSchedules.length} scheman
          </Text>
        </View>
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}