import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ShiftSchedule, SwedishHoliday } from '../types/shift';

interface ShiftCalendarProps {
  schedules: ShiftSchedule[];
  holidays: SwedishHoliday[];
  onDateSelect: (date: string) => void;
  selectedCompany?: string;
  selectedLocation?: string;
}

export const ShiftCalendar: React.FC<ShiftCalendarProps> = ({
  schedules,
  holidays,
  onDateSelect,
  selectedCompany,
  selectedLocation
}) => {
  const getMarkedDates = () => {
    const marked: any = {};
    
    // Markera skiftscheman
    schedules.forEach(schedule => {
      const dateKey = schedule.date;
      if (!marked[dateKey]) {
        marked[dateKey] = { dots: [] };
      }
      marked[dateKey].dots.push({ 
        color: getShiftTypeColor(schedule.shift_type) 
      });
    });
    
    // Markera helgdagar
    holidays.forEach(holiday => {
      const dateKey = holiday.date;
      if (!marked[dateKey]) {
        marked[dateKey] = { dots: [] };
      }
      marked[dateKey].customStyles = {
        container: { backgroundColor: '#ffebee' },
        text: { color: '#d32f2f', fontWeight: 'bold' }
      };
    });
    
    return marked;
  };
  
  const getShiftTypeColor = (shiftType: string) => {
    const colors: { [key: string]: string } = {
      '2-2': '#4CAF50',
      '3-3': '#2196F3',
      '4-4': '#FF9800',
      '5-5': '#9C27B0',
      '6-2': '#F44336',
      '7-7': '#607D8B',
      '2-2-2-4': '#795548'
    };
    return colors[shiftType] || '#757575';
  };
  
  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => onDateSelect(day.dateString)}
        markingType="multi-dot"
        markedDates={getMarkedDates()}
        firstDay={1} // Måndag som första dag
        showWeekNumbers={true}
        locale="sv"
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          selectedDayBackgroundColor: '#2196F3',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#2196F3',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          arrowColor: '#2196F3',
          monthTextColor: '#2196F3'
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
  },
});