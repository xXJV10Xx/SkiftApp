import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Shift, shiftApi } from '../lib/api/shiftApi';
import { useTheme } from '../context/ThemeContext';

interface ShiftTradeFormProps {
  shift: Shift;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ShiftTradeForm({ shift, visible, onClose, onSuccess }: ShiftTradeFormProps) {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const formatShiftTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleDateString('sv-SE')} ${start.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })} - ${end.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  const handleSubmit = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await shiftApi.createTradeRequest(shift.id, message.trim() || undefined);
      
      Alert.alert(
        'Skiftbyte skapat!',
        'Din förfrågan om skiftbyte har skickats till teamet.',
        [{ text: 'OK', onPress: () => {
          onSuccess();
          onClose();
          setMessage('');
        }}]
      );
    } catch (error) {
      console.error('Error creating trade request:', error);
      Alert.alert(
        'Fel',
        error instanceof Error ? error.message : 'Kunde inte skapa skiftbyte-förfrågan'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.text }]}>Avbryt</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Skiftbyte</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.submitText}>Skicka</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={[styles.shiftInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.shiftTitle, { color: colors.text }]}>Skift att byta bort</Text>
            <Text style={[styles.shiftTime, { color: colors.text }]}>
              {formatShiftTime(shift.start_time, shift.end_time)}
            </Text>
            {shift.position && (
              <Text style={[styles.shiftPosition, { color: colors.textSecondary }]}>
                {shift.position}
              </Text>
            )}
            {shift.location && (
              <Text style={[styles.shiftLocation, { color: colors.textSecondary }]}>
                📍 {shift.location}
              </Text>
            )}
          </View>

          <View style={styles.messageSection}>
            <Text style={[styles.messageLabel, { color: colors.text }]}>
              Meddelande till teamet (valfritt)
            </Text>
            <TextInput
              style={[
                styles.messageInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                }
              ]}
              value={message}
              onChangeText={setMessage}
              placeholder="T.ex. 'Behöver byta pga läkarbesök'"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              💡 När du skickar denna förfrågan kommer ditt skift att markeras som "Väntar på byte" 
              och dina teamkamrater får en notifikation. De som är intresserade kan starta en 
              privat chatt med dig för att diskutera bytet.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  shiftInfo: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  shiftTime: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  shiftPosition: {
    fontSize: 14,
    marginBottom: 2,
  },
  shiftLocation: {
    fontSize: 14,
  },
  messageSection: {
    marginBottom: 24,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  infoBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});