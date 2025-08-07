import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCompany } from '../../context/CompanyContext';
import { useShift } from '../../context/ShiftContext';
import { useTheme } from '../../context/ThemeContext';

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const { selectedCompany, selectedTeam } = useCompany();
  const { monthSchedule, generateSchedule, selectedShiftType } = useShift();
  const [currentDate, setCurrentDate] = useState(new Date());

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    generateSchedule(newDate.getFullYear(), newDate.getMonth());
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    generateSchedule(newDate.getFullYear(), newDate.getMonth());
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    generateSchedule(today.getFullYear(), today.getMonth());
  };

  const getShiftColor = (shiftCode: string) => {
    if (shiftCode === 'L') return colors.border; // Ledig = grå
    
    if (selectedCompany && selectedTeam) {
      const teamColor = selectedCompany.colors[selectedTeam];
      if (teamColor) return teamColor;
    }
    
    // Standardfärger för skift
    const shiftColors: Record<string, string> = {
      'M': '#FF6B6B', // Morgon = röd
      'A': '#4ECDC4', // Kväll = turkos
      'N': '#45B7D1', // Natt = blå
      'F': '#96CEB4', // Förmiddag = grön
      'E': '#FFA502', // Eftermiddag = orange
      'D': '#9B59B6'  // Dag = lila
    };
    
    return shiftColors[shiftCode] || '#95A5A6';
  };

  const getShiftName = (shiftCode: string) => {
    const shiftNames: Record<string, string> = {
      'M': 'Morgon',
      'A': 'Kväll',
      'N': 'Natt',
      'F': 'Förmiddag',
      'E': 'Eftermiddag',
      'D': 'Dag',
      'L': 'Ledig'
    };
    return shiftNames[shiftCode] || shiftCode;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); // Remove seconds
  };

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
    todayCell: {
      borderColor: colors.primary,
      borderWidth: 2,
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
    legendContainer: {
      backgroundColor: colors.card,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    legendTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    legendGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    legendColor: {
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    legendText: {
      fontSize: 14,
      color: colors.text,
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
  });

  if (!selectedCompany || !selectedTeam) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Calendar size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Inget schema tillgängligt</Text>
          <Text style={styles.emptyText}>
            Välj företag och lag på startsidan för att se ditt schema
          </Text>
        </View>
      </View>
    );
  }

  // Group schedule by weeks
  const weeks: any[][] = [];
  let currentWeek: any[] = [];
  
  monthSchedule.forEach((day, index) => {
    if (index === 0) {
      // Add empty cells for days before the first day of the month
      const firstDayOfWeek = day.date.getDay();
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push(null);
      }
    }
    
    currentWeek.push(day);
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  // Add the last week if it's not complete
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
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
          </View>
        </View>
        
        <Text style={styles.monthTitle}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <Text style={styles.companyInfo}>
          {selectedCompany.name} - Lag {selectedTeam}
        </Text>
      </View>

      <ScrollView style={styles.calendarContainer}>
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
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((day, dayIndex) => (
                <View
                  key={dayIndex}
                  style={[
                    styles.dayCell,
                    day?.isToday && styles.todayCell,
                    day?.isWeekend && styles.weekendCell,
                  ]}
                >
                  {day && (
                    <>
                      <Text style={styles.dayNumber}>{day.day}</Text>
                      {day.shift.code !== 'L' && (
                        <View
                          style={[
                            styles.shiftBadge,
                            { backgroundColor: getShiftColor(day.shift.code) }
                          ]}
                        >
                          <Text style={styles.shiftText}>
                            {getShiftName(day.shift.code)}
                          </Text>
                        </View>
                      )}
                      {day.shift.time.start && day.shift.time.end && (
                        <Text style={styles.shiftTime}>
                          {formatTime(day.shift.time.start)}-{formatTime(day.shift.time.end)}
                        </Text>
                      )}
                    </>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Förklaring</Text>
        <View style={styles.legendGrid}>
          {['M', 'A', 'N', 'F', 'E', 'D', 'L'].map((shiftCode) => (
            <View key={shiftCode} style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: getShiftColor(shiftCode) }
                ]}
              />
              <Text style={styles.legendText}>
                {getShiftName(shiftCode)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}