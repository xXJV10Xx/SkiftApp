import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useCompany } from '../context/CompanyContext';
import { useShift } from '../context/ShiftContext';
import { useTheme } from '../context/ThemeContext';

interface WeekShiftWidgetProps {
  onPress?: () => void;
  compact?: boolean;
}

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  shift: {
    code: string;
    time: {
      start: string;
      end: string;
    };
  };
  isToday: boolean;
}

export default function WeekShiftWidget({ onPress, compact = false }: WeekShiftWidgetProps) {
  const { colors } = useTheme();
  const { selectedCompany, selectedTeam } = useCompany();
  const { monthSchedule, loading } = useShift();
  const [currentWeek, setCurrentWeek] = useState(0); // 0 = current week, 1 = next week, etc.

  const getWeekDays = (weekOffset: number = 0): WeekDay[] => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Get Monday of current week
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + (weekOffset * 7));
    
    const weekDays: WeekDay[] = [];
    const dayNames = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      
      // Find shift for this date from monthSchedule
      const daySchedule = monthSchedule.find(day => 
        day.date.toDateString() === date.toDateString()
      );
      
      weekDays.push({
        date,
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        shift: daySchedule?.shift || { code: 'L', time: { start: '', end: '' } },
        isToday: date.toDateString() === today.toDateString(),
      });
    }
    
    return weekDays;
  };

  const weekDays = getWeekDays(currentWeek);

  const getShiftColor = (shiftCode: string) => {
    if (shiftCode === 'L') return colors.textSecondary;
    
    const teamColor = selectedCompany?.colors[selectedTeam || ''];
    if (teamColor) return teamColor;
    
    const shiftColors: Record<string, string> = {
      'M': '#FF6B6B', // Morgon
      'A': '#4ECDC4', // Kväll
      'N': '#45B7D1', // Natt
      'F': '#96CEB4', // Förmiddag
      'E': '#FFA502', // Eftermiddag
      'D': '#9B59B6'  // Dag
    };
    
    return shiftColors[shiftCode] || colors.primary;
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

  const getWeekTitle = () => {
    const firstDay = weekDays[0];
    const lastDay = weekDays[6];
    
    if (!firstDay || !lastDay) return 'Vecka';
    
    const sameMonth = firstDay.date.getMonth() === lastDay.date.getMonth();
    
    if (sameMonth) {
      return `${firstDay.dayNumber}-${lastDay.dayNumber} ${firstDay.date.toLocaleDateString('sv-SE', { month: 'short' })}`;
    } else {
      return `${firstDay.dayNumber} ${firstDay.date.toLocaleDateString('sv-SE', { month: 'short' })} - ${lastDay.dayNumber} ${lastDay.date.toLocaleDateString('sv-SE', { month: 'short' })}`;
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(prev => prev - 1);
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => prev + 1);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(0);
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: compact ? 12 : 16,
      padding: compact ? 12 : 16,
      margin: compact ? 8 : 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: compact ? 12 : 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    title: {
      fontSize: compact ? 14 : 16,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 8,
    },
    weekTitle: {
      fontSize: compact ? 12 : 14,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    navigation: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    navButton: {
      padding: 4,
      borderRadius: 4,
    },
    currentWeekButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: colors.surface,
      borderRadius: 6,
    },
    currentWeekText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: '600',
    },
    weekContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dayContainer: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: 1,
    },
    dayHeader: {
      alignItems: 'center',
      marginBottom: compact ? 6 : 8,
    },
    dayName: {
      fontSize: compact ? 10 : 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    dayNumber: {
      fontSize: compact ? 12 : 14,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 2,
    },
    todayNumber: {
      color: colors.primary,
    },
    shiftContainer: {
      alignItems: 'center',
      minHeight: compact ? 40 : 50,
      justifyContent: 'center',
    },
    shiftIndicator: {
      width: compact ? 24 : 32,
      height: compact ? 24 : 32,
      borderRadius: compact ? 12 : 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    shiftCode: {
      fontSize: compact ? 10 : 12,
      fontWeight: 'bold',
      color: 'white',
    },
    shiftTime: {
      fontSize: compact ? 8 : 10,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: compact ? 10 : 12,
    },
    noShiftText: {
      fontSize: compact ? 8 : 10,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loadingText: {
      fontSize: compact ? 12 : 14,
      color: colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
      paddingVertical: 20,
    },
  });

  const Widget = (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Calendar size={compact ? 16 : 20} color={colors.primary} />
          <Text style={styles.title}>Veckans skift</Text>
          <Text style={styles.weekTitle}>{getWeekTitle()}</Text>
        </View>
        <View style={styles.navigation}>
          <TouchableOpacity style={styles.navButton} onPress={goToPreviousWeek}>
            <ChevronLeft size={compact ? 16 : 20} color={colors.textSecondary} />
          </TouchableOpacity>
          {currentWeek !== 0 && (
            <TouchableOpacity style={styles.currentWeekButton} onPress={goToCurrentWeek}>
              <Text style={styles.currentWeekText}>Nu</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.navButton} onPress={goToNextWeek}>
            <ChevronRight size={compact ? 16 : 20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Laddar...</Text>
      ) : (
        <View style={styles.weekContainer}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.dayContainer}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day.dayName}</Text>
                <Text style={[styles.dayNumber, day.isToday && styles.todayNumber]}>
                  {day.dayNumber}
                </Text>
              </View>
              
              <View style={styles.shiftContainer}>
                {day.shift.code === 'L' ? (
                  <Text style={styles.noShiftText}>Ledig</Text>
                ) : (
                  <>
                    <View 
                      style={[
                        styles.shiftIndicator,
                        { backgroundColor: getShiftColor(day.shift.code) }
                      ]}
                    >
                      <Text style={styles.shiftCode}>{day.shift.code}</Text>
                    </View>
                    {day.shift.time.start && day.shift.time.end && (
                      <Text style={styles.shiftTime}>
                        {day.shift.time.start.slice(0, 5)}{'\n'}
                        {day.shift.time.end.slice(0, 5)}
                      </Text>
                    )}
                  </>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {Widget}
    </TouchableOpacity>
  ) : Widget;
}