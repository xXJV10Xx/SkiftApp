import { Calendar, Clock, User, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useCompany } from '../context/CompanyContext';
import { useTheme } from '../context/ThemeContext';

interface ShiftChangeFormProps {
  onSubmit?: (formData: ShiftChangeRequest) => void;
  onCancel?: () => void;
  isEmbedded?: boolean;
  initialData?: Partial<ShiftChangeRequest>;
}

export interface ShiftChangeRequest {
  id?: string;
  requester_id: string;
  current_shift_date: string;
  current_shift_time: string;
  requested_shift_date: string;
  requested_shift_time: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  target_employee_id?: string;
  created_at?: string;
}

export default function ShiftChangeForm({ 
  onSubmit, 
  onCancel, 
  isEmbedded = false,
  initialData 
}: ShiftChangeFormProps) {
  const { colors } = useTheme();
  const { selectedCompany, selectedTeam } = useCompany();
  
  const [currentDate, setCurrentDate] = useState(initialData?.current_shift_date || '');
  const [currentTime, setCurrentTime] = useState(initialData?.current_shift_time || '');
  const [requestedDate, setRequestedDate] = useState(initialData?.requested_shift_date || '');
  const [requestedTime, setRequestedTime] = useState(initialData?.requested_shift_time || '');
  const [reason, setReason] = useState(initialData?.reason || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentDate || !currentTime || !requestedDate || !requestedTime || !reason.trim()) {
      Alert.alert('Fel', 'Alla fält måste fyllas i');
      return;
    }

    const formData: ShiftChangeRequest = {
      requester_id: '', // Will be set by the parent component
      current_shift_date: currentDate,
      current_shift_time: currentTime,
      requested_shift_date: requestedDate,
      requested_shift_time: requestedTime,
      reason: reason.trim(),
      status: 'pending'
    };

    try {
      setLoading(true);
      onSubmit?.(formData);
    } catch (error) {
      console.error('Error submitting shift change request:', error);
      Alert.alert('Fel', 'Kunde inte skicka skiftbyte-förfrågan');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isEmbedded ? colors.surface : colors.card,
      borderRadius: 12,
      padding: 16,
      margin: isEmbedded ? 0 : 16,
      borderWidth: isEmbedded ? 1 : 0,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 8,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    inputRow: {
      flexDirection: 'row',
      gap: 8,
    },
    inputContainer: {
      flex: 1,
    },
    label: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      color: colors.text,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 16,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    submitButton: {
      backgroundColor: colors.primary,
    },
    cancelButton: {
      backgroundColor: colors.textSecondary,
    },
    buttonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    infoText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Users size={20} color={colors.primary} />
        <Text style={styles.title}>Skiftbyte-förfrågan</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nuvarande skift</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Datum</Text>
            <TextInput
              style={styles.input}
              value={currentDate}
              onChangeText={setCurrentDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tid</Text>
            <TextInput
              style={styles.input}
              value={currentTime}
              onChangeText={setCurrentTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Önskat skift</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Datum</Text>
            <TextInput
              style={styles.input}
              value={requestedDate}
              onChangeText={setRequestedDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tid</Text>
            <TextInput
              style={styles.input}
              value={requestedTime}
              onChangeText={setRequestedTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Anledning</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={reason}
          onChangeText={setReason}
          placeholder="Beskriv anledningen till skiftbytet..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={500}
        />
        <Text style={styles.infoText}>
          {reason.length}/500 tecken
        </Text>
      </View>

      <View style={styles.buttonRow}>
        {onCancel && (
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Avbryt</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.button, styles.submitButton]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Skickar...' : 'Skicka förfrågan'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}