import { Calendar, Check, Clock, User, Users, X } from 'lucide-react-native';
import React from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShiftChangeRequest } from './ShiftChangeForm';

interface ShiftChangeMessageProps {
  data: ShiftChangeRequest;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  isOwnMessage?: boolean;
}

export default function ShiftChangeMessage({ 
  data, 
  onApprove, 
  onReject, 
  isOwnMessage = false 
}: ShiftChangeMessageProps) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return colors.success || '#10B981';
      case 'rejected':
        return colors.error || '#EF4444';
      default:
        return colors.warning || '#F59E0B';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Godkänd';
      case 'rejected':
        return 'Avvisad';
      default:
        return 'Väntar på svar';
    }
  };

  const handleApprove = () => {
    if (!data.id) return;
    
    Alert.alert(
      'Godkänn skiftbyte',
      'Är du säker på att du vill godkänna denna skiftbyte-förfrågan?',
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Godkänn', 
          style: 'default',
          onPress: () => onApprove?.(data.id!)
        }
      ]
    );
  };

  const handleReject = () => {
    if (!data.id) return;
    
    Alert.alert(
      'Avvisa skiftbyte',
      'Är du säker på att du vill avvisa denna skiftbyte-förfrågan?',
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Avvisa', 
          style: 'destructive',
          onPress: () => onReject?.(data.id!)
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      maxWidth: '100%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    section: {
      marginBottom: 12,
    },
    sectionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
    },
    sectionColumn: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    shiftInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 8,
      borderRadius: 8,
      marginBottom: 4,
    },
    shiftText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 6,
    },
    reasonContainer: {
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    reasonText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    approveButton: {
      backgroundColor: colors.success || '#10B981',
    },
    rejectButton: {
      backgroundColor: colors.error || '#EF4444',
    },
    buttonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    timestamp: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
  });

  const canTakeAction = !isOwnMessage && data.status === 'pending' && onApprove && onReject;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Users size={18} color={colors.primary} />
          <Text style={styles.title}>Skiftbyte-förfrågan</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(data.status) }]}>
          <Text style={styles.statusText}>{getStatusText(data.status)}</Text>
        </View>
      </View>

      <View style={styles.sectionRow}>
        <View style={styles.sectionColumn}>
          <Text style={styles.sectionTitle}>Nuvarande skift</Text>
          <View style={styles.shiftInfo}>
            <Calendar size={16} color={colors.textSecondary} />
            <Text style={styles.shiftText}>{data.current_shift_date}</Text>
          </View>
          <View style={styles.shiftInfo}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={styles.shiftText}>{data.current_shift_time}</Text>
          </View>
        </View>

        <View style={styles.sectionColumn}>
          <Text style={styles.sectionTitle}>Önskat skift</Text>
          <View style={styles.shiftInfo}>
            <Calendar size={16} color={colors.textSecondary} />
            <Text style={styles.shiftText}>{data.requested_shift_date}</Text>
          </View>
          <View style={styles.shiftInfo}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={styles.shiftText}>{data.requested_shift_time}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Anledning</Text>
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonText}>{data.reason}</Text>
        </View>
      </View>

      {canTakeAction && (
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.rejectButton]} 
            onPress={handleReject}
          >
            <X size={16} color="white" />
            <Text style={styles.buttonText}>Avvisa</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.approveButton]} 
            onPress={handleApprove}
          >
            <Check size={16} color="white" />
            <Text style={styles.buttonText}>Godkänn</Text>
          </TouchableOpacity>
        </View>
      )}

      {data.created_at && (
        <Text style={styles.timestamp}>
          {new Date(data.created_at).toLocaleString('sv-SE')}
        </Text>
      )}
    </View>
  );
}