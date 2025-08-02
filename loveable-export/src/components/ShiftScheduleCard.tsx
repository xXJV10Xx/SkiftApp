import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShiftSchedule } from '../types/shift';

interface ShiftScheduleCardProps {
  schedule: ShiftSchedule;
  onPress: () => void;
  showDetails?: boolean;
}

export const ShiftScheduleCard: React.FC<ShiftScheduleCardProps> = ({
  schedule,
  onPress,
  showDetails = true
}) => {
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
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={[
          styles.shiftTypeBadge,
          { backgroundColor: getShiftTypeColor(schedule.shift_type) }
        ]}>
          <Text style={styles.shiftTypeText}>{schedule.shift_type}</Text>
        </View>
        <Text style={styles.companyName}>{schedule.company_name}</Text>
      </View>
      
      {showDetails && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {schedule.start_time} - {schedule.end_time}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{schedule.location}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{schedule.department}</Text>
          </View>
        </View>
      )}
      
      {schedule.is_weekend && (
        <View style={styles.weekendBadge}>
          <Text style={styles.weekendText}>Helg</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shiftTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  shiftTypeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  weekendBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ff5722',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  weekendText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});