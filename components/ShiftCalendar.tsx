import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COMPANIES, SHIFT_TYPES } from '../data/companies';
import {
    calculateMonthShifts,
    calculateMonthStatistics,
    formatDateSwedish,
    getShiftNameSwedish,
    isValidDateRange
} from '../lib/shiftCalculations';

interface ShiftCalendarProps {
  companyId: string;
  team: string;
  shiftTypeId: string;
}

export function ShiftCalendar({ companyId, team, shiftTypeId }: ShiftCalendarProps) {
  const { colors } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Validera datum intervall
  if (!isValidDateRange(currentDate)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Datum måste vara mellan 2020-2030
        </Text>
      </View>
    );
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Beräkna skift för månaden
  const monthShifts = calculateMonthShifts(year, month, companyId, team, shiftTypeId);
  const statistics = calculateMonthStatistics(year, month, companyId, team, shiftTypeId);

  // Hämta företags- och skiftinfo
  const company = COMPANIES[companyId];
  const shiftType = SHIFT_TYPES[shiftTypeId];

  // Generera kalenderdagar
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const calendarDays = [];
  
  // Lägg till tomma dagar för att matcha veckodagar
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Lägg till alla dagar i månaden
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateString = date.toISOString().split('T')[0];
    const shift = monthShifts[dateString];
    
    calendarDays.push({
      day,
      date,
      shift,
      isToday: date.toDateString() === new Date().toDateString()
    });
  }

  // Navigera till föregående månad
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    if (isValidDateRange(newDate)) {
      setCurrentDate(newDate);
    }
  };

  // Navigera till nästa månad
  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    if (isValidDateRange(newDate)) {
      setCurrentDate(newDate);
    }
  };

  // Navigera till föregående år
  const goToPreviousYear = () => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() - 1);
    if (isValidDateRange(newDate)) {
      setCurrentDate(newDate);
    }
  };

  // Navigera till nästa år
  const goToNextYear = () => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + 1);
    if (isValidDateRange(newDate)) {
      setCurrentDate(newDate);
    }
  };

  // Gå till dagens datum
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Formatera månadsnamn på svenska
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Kalenderheader */}
      <View style={styles.header}>
        <View style={styles.navigation}>
          <TouchableOpacity onPress={goToPreviousYear} style={styles.navButton}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.monthYear, { color: colors.text }]}>
            {getMonthName(currentDate)}
          </Text>
          
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={goToNextYear} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={goToToday} style={[styles.todayButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.todayButtonText}>Idag</Text>
        </TouchableOpacity>
      </View>

      {/* Veckodagar */}
      <View style={styles.weekDays}>
        {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map((day, index) => (
          <Text key={index} style={[styles.weekDay, { color: colors.textSecondary }]}>
            {day}
          </Text>
        ))}
      </View>

      {/* Kalenderdagar */}
      <View style={styles.calendar}>
        {calendarDays.map((dayData, index) => (
          <View key={index} style={styles.dayContainer}>
            {dayData ? (
              <TouchableOpacity
                style={[
                  styles.day,
                  dayData.isToday && { borderColor: colors.primary, borderWidth: 2 },
                  dayData.shift && { backgroundColor: dayData.shift.color + '20' }
                ]}
                onPress={() => setSelectedDate(dayData.date)}
              >
                <Text style={[
                  styles.dayNumber,
                  { color: colors.text },
                  dayData.isToday && { color: colors.primary, fontWeight: 'bold' }
                ]}>
                  {dayData.day}
                </Text>
                {dayData.shift && dayData.shift.code !== 'L' && (
                  <View style={[styles.shiftIndicator, { backgroundColor: dayData.shift.color }]}>
                    <Text style={styles.shiftCode}>{dayData.shift.code}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyDay} />
            )}
          </View>
        ))}
      </View>

      {/* Statistik */}
      <View style={styles.statistics}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Arbetsdagar</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{statistics.totalWorkDays}</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Arbetstimmar</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{Math.round(statistics.totalWorkHours)}h</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Cykeldag</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{statistics.currentCycleDay}</Text>
        </View>
      </View>

      {/* Vald dag detaljer */}
      {selectedDate && monthShifts[selectedDate.toISOString().split('T')[0]] && (
        <View style={[styles.selectedDayDetails, { backgroundColor: colors.background }]}>
          <Text style={[styles.selectedDayTitle, { color: colors.text }]}>
            {formatDateSwedish(selectedDate)}
          </Text>
          
          {(() => {
            const shift = monthShifts[selectedDate.toISOString().split('T')[0]];
            return (
              <View style={styles.shiftDetails}>
                <Text style={[styles.shiftName, { color: colors.text }]}>
                  {getShiftNameSwedish(shift.code)}
                </Text>
                
                {shift.time.start && shift.time.end && (
                  <Text style={[styles.shiftTime, { color: colors.textSecondary }]}>
                    {shift.time.start} - {shift.time.end}
                  </Text>
                )}
                
                <Text style={[styles.cycleInfo, { color: colors.textSecondary }]}>
                  Cykeldag {shift.cycleDay} av {shiftType.cycle}
                </Text>
                
                {statistics.nextShiftDate && (
                  <Text style={[styles.nextShiftInfo, { color: colors.textSecondary }]}>
                    Nästa skift: {statistics.daysUntilNextShift} dagar
                  </Text>
                )}
              </View>
            );
          })()}
        </View>
      )}

      {/* Företags- och teaminfo */}
      <View style={styles.companyInfo}>
        <Text style={[styles.companyName, { color: colors.text }]}>
          {company?.name} - {team}
        </Text>
        <Text style={[styles.shiftTypeName, { color: colors.textSecondary }]}>
          {shiftType?.name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  todayButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  day: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    padding: 4,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  shiftIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  shiftCode: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  emptyDay: {
    flex: 1,
  },
  statistics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedDayDetails: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  shiftDetails: {
    alignItems: 'center',
  },
  shiftName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  shiftTime: {
    fontSize: 14,
    marginBottom: 4,
  },
  cycleInfo: {
    fontSize: 12,
    marginBottom: 4,
  },
  nextShiftInfo: {
    fontSize: 12,
  },
  companyInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  shiftTypeName: {
    fontSize: 14,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
}); 