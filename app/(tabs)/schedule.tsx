import { Calendar, ChevronLeft, ChevronRight, Clock, Grid, List } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCompany } from '../../context/CompanyContext';
import { useShift } from '../../context/ShiftContext';
import { useTheme } from '../../context/ThemeContext';

type ViewMode = 'monthly' | 'yearly';

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const { selectedCompany, selectedTeam } = useCompany();
  const { monthSchedule, generateSchedule, selectedShiftType } = useShift();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [yearlySchedule, setYearlySchedule] = useState<any[]>([]);

  // Generate schedule when date or company changes
  useEffect(() => {
    if (selectedCompany && selectedTeam) {
      if (viewMode === 'monthly') {
        generateSchedule(currentDate.getFullYear(), currentDate.getMonth());
      } else {
        generateYearlySchedule(currentDate.getFullYear());
      }
    }
  }, [currentDate, selectedCompany, selectedTeam, viewMode]);

  const generateYearlySchedule = async (year: number) => {
    const yearData = [];
    for (let month = 0; month < 12; month++) {
      await generateSchedule(year, month);
      // Store a copy of the current month schedule
      yearData.push({
        month,
        year,
        monthName: new Date(year, month).toLocaleDateString('sv-SE', { month: 'long' }),
        schedule: [...monthSchedule]
      });
    }
    setYearlySchedule(yearData);
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
  };

  const goToPreviousYear = () => {
    const newDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);
    setCurrentDate(newDate);
  };

  const goToNextYear = () => {
    const newDate = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
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
    viewModeToggle: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 2,
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      gap: 4,
    },
    activeToggle: {
      backgroundColor: colors.primary,
    },
    toggleText: {
      fontSize: 12,
      fontWeight: '600',
    },
    headerControls: {
      alignItems: 'center',
      marginBottom: 16,
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
    yearlyGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      padding: 8,
    },
    yearlyMonthCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      width: '47%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    yearlyMonthTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    yearlyMonthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    yearlyDayHeader: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '600',
      width: '14.28%',
      textAlign: 'center',
      marginBottom: 4,
    },
    yearlyDayCell: {
      width: '14.28%',
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      marginBottom: 2,
    },
    yearlyTodayCell: {
      backgroundColor: colors.primary + '20',
      borderRadius: 4,
    },
    yearlyDayNumber: {
      fontSize: 10,
      color: colors.text,
      fontWeight: '500',
    },
    yearlyShiftDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      position: 'absolute',
      bottom: 1,
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
          <View style={styles.viewModeToggle}>
            <TouchableOpacity 
              style={[styles.toggleButton, viewMode === 'monthly' && styles.activeToggle]}
              onPress={() => setViewMode('monthly')}
            >
              <Calendar size={16} color={viewMode === 'monthly' ? 'white' : colors.text} />
              <Text style={[styles.toggleText, { color: viewMode === 'monthly' ? 'white' : colors.text }]}>
                Månad
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, viewMode === 'yearly' && styles.activeToggle]}
              onPress={() => setViewMode('yearly')}
            >
              <Grid size={16} color={viewMode === 'yearly' ? 'white' : colors.text} />
              <Text style={[styles.toggleText, { color: viewMode === 'yearly' ? 'white' : colors.text }]}>
                År
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerControls}>
          <View style={styles.navigationButtons}>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={viewMode === 'monthly' ? goToPreviousMonth : goToPreviousYear}
            >
              <ChevronLeft size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
              <Text style={styles.todayButtonText}>Idag</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navButton} 
              onPress={viewMode === 'monthly' ? goToNextMonth : goToNextYear}
            >
              <ChevronRight size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.monthTitle}>
          {viewMode === 'monthly' 
            ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
            : `${currentDate.getFullYear()}`
          }
        </Text>
        <Text style={styles.companyInfo}>
          {selectedCompany.name} - Lag {selectedTeam}
        </Text>
      </View>

      <ScrollView style={styles.calendarContainer}>
        {viewMode === 'monthly' ? (
          <>
            {/* Monthly View - Week header */}
            <View style={styles.weekHeader}>
              {dayNames.map((day) => (
                <Text key={day} style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Monthly View - Calendar grid */}
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
          </>
        ) : (
          <>
            {/* Yearly View - Month grid */}
            <View style={styles.yearlyGrid}>
              {Array.from({ length: 12 }, (_, monthIndex) => {
                const monthDate = new Date(currentDate.getFullYear(), monthIndex, 1);
                const monthName = monthDate.toLocaleDateString('sv-SE', { month: 'long' });
                
                // Generate mini calendar for this month
                const daysInMonth = new Date(currentDate.getFullYear(), monthIndex + 1, 0).getDate();
                const firstDay = new Date(currentDate.getFullYear(), monthIndex, 1).getDay();
                
                const monthDays = [];
                // Add empty cells for days before month starts
                for (let i = 0; i < firstDay; i++) {
                  monthDays.push(null);
                }
                // Add days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(currentDate.getFullYear(), monthIndex, day);
                  const isToday = date.toDateString() === new Date().toDateString();
                  
                  // Get shift for this day (simplified - would need actual schedule data)
                  const shiftCode = ((day + monthIndex) % 4) === 0 ? 'F' : 
                                   ((day + monthIndex) % 4) === 1 ? 'E' :
                                   ((day + monthIndex) % 4) === 2 ? 'N' : 'L';
                  
                  monthDays.push({
                    day,
                    date,
                    isToday,
                    shift: { code: shiftCode }
                  });
                }
                
                return (
                  <View key={monthIndex} style={styles.yearlyMonthCard}>
                    <Text style={styles.yearlyMonthTitle}>{monthName}</Text>
                    <View style={styles.yearlyMonthGrid}>
                      {['S', 'M', 'T', 'O', 'T', 'F', 'L'].map((day, i) => (
                        <Text key={i} style={styles.yearlyDayHeader}>{day}</Text>
                      ))}
                      {monthDays.map((day, dayIndex) => (
                        <View
                          key={dayIndex}
                          style={[
                            styles.yearlyDayCell,
                            day?.isToday && styles.yearlyTodayCell
                          ]}
                        >
                          {day && (
                            <>
                              <Text style={styles.yearlyDayNumber}>{day.day}</Text>
                              {day.shift.code !== 'L' && (
                                <View 
                                  style={[
                                    styles.yearlyShiftDot,
                                    { backgroundColor: getShiftColor(day.shift.code) }
                                  ]} 
                                />
                              )}
                            </>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
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