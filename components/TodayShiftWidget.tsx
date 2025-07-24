import { Calendar, Clock, MapPin, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useCompany } from '../context/CompanyContext';
import { useShift } from '../context/ShiftContext';
import { useTheme } from '../context/ThemeContext';

interface TodayShiftWidgetProps {
  onPress?: () => void;
  compact?: boolean;
}

export default function TodayShiftWidget({ onPress, compact = false }: TodayShiftWidgetProps) {
  const { colors } = useTheme();
  const { selectedCompany, selectedTeam } = useCompany();
  const { currentShift, loading } = useShift();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const getShiftStatus = () => {
    if (!currentShift?.shift) return 'Inget skift';
    
    const now = new Date();
    const today = now.toDateString();
    const shiftDate = currentShift.date?.toDateString();
    
    if (shiftDate !== today) return 'Inget skift idag';
    
    const shift = currentShift.shift;
    if (!shift.time?.start || !shift.time?.end) return 'Okänd tid';
    
    const [startHour, startMin] = shift.time.start.split(':').map(Number);
    const [endHour, endMin] = shift.time.end.split(':').map(Number);
    
    const startTime = new Date();
    startTime.setHours(startHour, startMin, 0, 0);
    
    const endTime = new Date();
    endTime.setHours(endHour, endMin, 0, 0);
    
    // Handle overnight shifts
    if (endTime < startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    
    if (now < startTime) {
      const timeDiff = startTime.getTime() - now.getTime();
      const hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutesUntil = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hoursUntil > 0) {
        return `Börjar om ${hoursUntil}h ${minutesUntil}min`;
      } else {
        return `Börjar om ${minutesUntil} minuter`;
      }
    } else if (now >= startTime && now <= endTime) {
      const timeDiff = endTime.getTime() - now.getTime();
      const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hoursLeft > 0) {
        return `Pågår - ${hoursLeft}h ${minutesLeft}min kvar`;
      } else {
        return `Pågår - ${minutesLeft} minuter kvar`;
      }
    } else {
      return 'Skiftet är avslutat';
    }
  };

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
    return shiftNames[shiftCode] || 'Okänt skift';
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
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
      marginBottom: compact ? 8 : 12,
    },
    title: {
      fontSize: compact ? 14 : 16,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 8,
    },
    currentTime: {
      fontSize: compact ? 12 : 14,
      color: colors.textSecondary,
      marginLeft: 'auto',
    },
    shiftInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: compact ? 6 : 8,
    },
    shiftIndicator: {
      width: compact ? 12 : 16,
      height: compact ? 12 : 16,
      borderRadius: compact ? 6 : 8,
      marginRight: 12,
    },
    shiftName: {
      fontSize: compact ? 14 : 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    timeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: compact ? 6 : 8,
    },
    timeText: {
      fontSize: compact ? 12 : 14,
      color: colors.text,
      marginLeft: 8,
    },
    statusContainer: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: compact ? 8 : 12,
      marginTop: compact ? 6 : 8,
    },
    statusText: {
      fontSize: compact ? 12 : 14,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
    },
    teamInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: compact ? 6 : 8,
    },
    teamText: {
      fontSize: compact ? 11 : 12,
      color: colors.textSecondary,
      marginLeft: 6,
    },
    loadingText: {
      fontSize: compact ? 12 : 14,
      color: colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    noShiftText: {
      fontSize: compact ? 12 : 14,
      color: colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

  const Widget = (
    <View style={styles.container}>
      <View style={styles.header}>
        <Calendar size={compact ? 16 : 20} color={colors.primary} />
        <Text style={styles.title}>Dagens skift</Text>
        <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Laddar...</Text>
      ) : !currentShift?.shift || currentShift.shift.code === 'L' ? (
        <Text style={styles.noShiftText}>Inget skift idag</Text>
      ) : (
        <>
          <View style={styles.shiftInfo}>
            <View 
              style={[
                styles.shiftIndicator, 
                { backgroundColor: getShiftColor(currentShift.shift.code) }
              ]} 
            />
            <Text style={styles.shiftName}>
              {getShiftName(currentShift.shift.code)}
            </Text>
          </View>

          {currentShift.shift.time?.start && currentShift.shift.time?.end && (
            <View style={styles.timeInfo}>
              <Clock size={compact ? 14 : 16} color={colors.textSecondary} />
              <Text style={styles.timeText}>
                {currentShift.shift.time.start} - {currentShift.shift.time.end}
              </Text>
            </View>
          )}

          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{getShiftStatus()}</Text>
          </View>

          {selectedTeam && (
            <View style={styles.teamInfo}>
              <User size={compact ? 12 : 14} color={colors.textSecondary} />
              <Text style={styles.teamText}>Lag {selectedTeam}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );

  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {Widget}
    </TouchableOpacity>
  ) : Widget;
}