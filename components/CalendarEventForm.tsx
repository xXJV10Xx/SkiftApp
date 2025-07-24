import { Calendar, Clock, Bell, FileText, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Switch,
    ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { scheduleCustomEventNotification, cancelScheduledNotification } from '../lib/notifications';

interface CalendarEvent {
  id?: string;
  title: string;
  date: Date;
  time: string;
  notes: string;
  hasNotification: boolean;
  notificationTime: Date;
  notificationId?: string;
}

interface CalendarEventFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  initialEvent?: Partial<CalendarEvent>;
}

export default function CalendarEventForm({ 
  visible, 
  onClose, 
  onSave, 
  initialEvent 
}: CalendarEventFormProps) {
  const { colors } = useTheme();
  
  const [title, setTitle] = useState(initialEvent?.title || '');
  const [date, setDate] = useState(initialEvent?.date || new Date());
  const [time, setTime] = useState(initialEvent?.time || '09:00');
  const [notes, setNotes] = useState(initialEvent?.notes || '');
  const [hasNotification, setHasNotification] = useState(initialEvent?.hasNotification || false);
  const [notificationTime, setNotificationTime] = useState(
    initialEvent?.notificationTime || new Date(Date.now() + 30 * 60 * 1000) // 30 min från nu
  );
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showNotificationTimePicker, setShowNotificationTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Fel', 'Titel måste fyllas i');
      return;
    }

    try {
      setLoading(true);
      
      let notificationId: string | undefined;
      
      if (hasNotification) {
        // Schedule notification
        notificationId = await scheduleCustomEventNotification(
          title,
          date,
          notificationTime,
          notes
        );
      }

      const event: CalendarEvent = {
        id: initialEvent?.id || Date.now().toString(),
        title: title.trim(),
        date,
        time,
        notes: notes.trim(),
        hasNotification,
        notificationTime,
        notificationId,
      };

      onSave(event);
      resetForm();
      onClose();
      
      Alert.alert(
        'Framgång', 
        hasNotification 
          ? 'Händelse sparad med notifikation'
          : 'Händelse sparad'
      );
    } catch (error) {
      console.error('Error saving calendar event:', error);
      Alert.alert('Fel', 'Kunde inte spara händelsen');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDate(new Date());
    setTime('09:00');
    setNotes('');
    setHasNotification(false);
    setNotificationTime(new Date(Date.now() + 30 * 60 * 1000));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('sv-SE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    scrollContent: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    dateTimeButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateTimeText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    switchLabel: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    notificationSection: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
    },
    notificationLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    buttonContainer: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    cancelButton: {
      backgroundColor: colors.textSecondary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    infoText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Lägg till händelse</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            <View style={styles.section}>
              <Text style={styles.label}>Titel</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Vad ska du göra?"
                placeholderTextColor={colors.textSecondary}
                maxLength={100}
              />
              <Text style={styles.infoText}>{title.length}/100 tecken</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Datum</Text>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={colors.primary} />
                <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Tid</Text>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={20} color={colors.primary} />
                <Text style={styles.dateTimeText}>{time}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Anteckningar</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Lägg till detaljer..."
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={500}
              />
              <Text style={styles.infoText}>{notes.length}/500 tecken</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Påminnelse</Text>
                <Switch
                  value={hasNotification}
                  onValueChange={setHasNotification}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={hasNotification ? 'white' : colors.textSecondary}
                />
              </View>

              {hasNotification && (
                <View style={styles.notificationSection}>
                  <Text style={styles.notificationLabel}>Påminnelsetid</Text>
                  <TouchableOpacity 
                    style={styles.dateTimeButton}
                    onPress={() => setShowNotificationTimePicker(true)}
                  >
                    <Bell size={20} color={colors.primary} />
                    <Text style={styles.dateTimeText}>
                      {formatDateTime(notificationTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Avbryt</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Sparar...' : 'Spara'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
              minimumDate={new Date()}
            />
          )}

          {/* Time Picker */}
          {showTimePicker && (
            <DateTimePicker
              value={new Date(`2000-01-01T${time}:00`)}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  const hours = selectedTime.getHours().toString().padStart(2, '0');
                  const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
                  setTime(`${hours}:${minutes}`);
                }
              }}
            />
          )}

          {/* Notification Time Picker */}
          {showNotificationTimePicker && (
            <DateTimePicker
              value={notificationTime}
              mode="datetime"
              display="default"
              onChange={(event, selectedTime) => {
                setShowNotificationTimePicker(false);
                if (selectedTime) {
                  setNotificationTime(selectedTime);
                }
              }}
              minimumDate={new Date()}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}