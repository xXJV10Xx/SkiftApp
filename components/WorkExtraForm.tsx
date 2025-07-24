import { Calendar, Clock, MapPin, User, Users } from 'lucide-react-native';
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

interface WorkExtraFormProps {
  onSubmit?: (formData: WorkExtraRequest) => void;
  onCancel?: () => void;
  isEmbedded?: boolean;
  initialData?: Partial<WorkExtraRequest>;
}

export interface WorkExtraRequest {
  id?: string;
  requester_id: string;
  date: string;
  start_time: string;
  end_time: string;
  position: string;
  location: string;
  description: string;
  hourly_rate?: string;
  status: 'open' | 'interested' | 'filled' | 'cancelled';
  created_at?: string;
}

export default function WorkExtraForm({ 
  onSubmit, 
  onCancel, 
  isEmbedded = false,
  initialData 
}: WorkExtraFormProps) {
  const { colors } = useTheme();
  const { selectedCompany, selectedTeam } = useCompany();
  
  const [date, setDate] = useState(initialData?.date || '');
  const [startTime, setStartTime] = useState(initialData?.start_time || '');
  const [endTime, setEndTime] = useState(initialData?.end_time || '');
  const [position, setPosition] = useState(initialData?.position || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [hourlyRate, setHourlyRate] = useState(initialData?.hourly_rate || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!date || !startTime || !endTime || !position || !description.trim()) {
      Alert.alert('Fel', 'Alla obligatoriska fält måste fyllas i');
      return;
    }

    const formData: WorkExtraRequest = {
      requester_id: '', // Will be set by the parent component
      date,
      start_time: startTime,
      end_time: endTime,
      position,
      location,
      description: description.trim(),
      hourly_rate: hourlyRate,
      status: 'open'
    };

    try {
      setLoading(true);
      onSubmit?.(formData);
    } catch (error) {
      console.error('Error submitting work extra request:', error);
      Alert.alert('Fel', 'Kunde inte skicka extrajobb-förfrågan');
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
    requiredLabel: {
      fontSize: 12,
      color: colors.error || colors.textSecondary,
      marginBottom: 4,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Users size={20} color={colors.primary} />
        <Text style={styles.title}>Extrajobb tillgängligt</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datum och tid</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <Text style={styles.requiredLabel}>Datum *</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
        <View style={[styles.inputRow, { marginTop: 8 }]}>
          <View style={styles.inputContainer}>
            <Text style={styles.requiredLabel}>Starttid *</Text>
            <TextInput
              style={styles.input}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.requiredLabel}>Sluttid *</Text>
            <TextInput
              style={styles.input}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Arbetsinformation</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.requiredLabel}>Position/Roll *</Text>
          <TextInput
            style={styles.input}
            value={position}
            onChangeText={setPosition}
            placeholder="T.ex. Sjuksköterska, Undersköterska..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={[styles.inputContainer, { marginTop: 8 }]}>
          <Text style={styles.label}>Plats</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Avdelning eller specifik plats"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={[styles.inputContainer, { marginTop: 8 }]}>
          <Text style={styles.label}>Timlön</Text>
          <TextInput
            style={styles.input}
            value={hourlyRate}
            onChangeText={setHourlyRate}
            placeholder="Timlön (valfritt)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Beskrivning</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Beskriv arbetsuppgifterna och eventuella krav..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={500}
        />
        <Text style={styles.infoText}>
          {description.length}/500 tecken
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
            {loading ? 'Skickar...' : 'Publicera extrajobb'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}