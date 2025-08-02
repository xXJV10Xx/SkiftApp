import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button } from './ui/Button';
import { ChatForm, markInterested } from '../lib/chatUtils';
import { supabase } from '../lib/supabase';

interface FormDisplayProps {
  form: ChatForm;
  currentUserId?: string;
  onInterestMarked?: (formId: string) => void;
}

export default function FormDisplay({ form, currentUserId, onInterestMarked }: FormDisplayProps) {
  const [isMarkingInterest, setIsMarkingInterest] = useState(false);
  const [isInterested, setIsInterested] = useState(
    currentUserId ? form.interested_user_ids.includes(currentUserId) : false
  );

  const getFormTypeDisplay = (type: string) => {
    switch (type) {
      case 'skiftöverlämning':
        return { title: 'Skiftöverlämning', emoji: '📋', color: '#007AFF' };
      case 'jobba extra':
        return { title: 'Jobba Extra', emoji: '💪', color: '#FF9500' };
      case 'haveri':
        return { title: 'Haveri', emoji: '⚠️', color: '#FF3B30' };
      default:
        return { title: 'Formulär', emoji: '📄', color: '#8E8E93' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE');
  };

  const formatShift = (shift: string) => {
    const shifts: { [key: string]: string } = {
      'F': 'Förmiddag',
      'E': 'Eftermiddag', 
      'N': 'Natt'
    };
    return shifts[shift.toUpperCase()] || shift;
  };

  const handleMarkInterested = async () => {
    if (!currentUserId) {
      Alert.alert('Fel', 'Du måste vara inloggad för att markera intresse');
      return;
    }

    if (currentUserId === form.sender_id) {
      Alert.alert('Info', 'Du kan inte markera intresse för ditt eget formulär');
      return;
    }

    if (isInterested) {
      Alert.alert('Info', 'Du har redan markerat intresse för detta formulär');
      return;
    }

    setIsMarkingInterest(true);

    try {
      const success = await markInterested(form.id, currentUserId);
      
      if (success) {
        setIsInterested(true);
        Alert.alert(
          'Intresse markerat!', 
          'En privat chatt har startats med formulärets avsändare.',
          [{ text: 'OK' }]
        );
        onInterestMarked?.(form.id);
      }
    } catch (error) {
      console.error('Error marking interest:', error);
      Alert.alert('Fel', 'Kunde inte markera intresse');
    } finally {
      setIsMarkingInterest(false);
    }
  };

  const formTypeInfo = getFormTypeDisplay(form.type);
  const isOwnForm = currentUserId === form.sender_id;

  return (
    <View style={[styles.container, { borderLeftColor: formTypeInfo.color }]}>
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Text style={styles.emoji}>{formTypeInfo.emoji}</Text>
          <Text style={[styles.typeText, { color: formTypeInfo.color }]}>
            {formTypeInfo.title}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {formatDate(form.created_at)}
        </Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Datum:</Text>
          <Text style={styles.detailValue}>{formatDate(form.date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Skift:</Text>
          <Text style={styles.detailValue}>{formatShift(form.shift)}</Text>
        </View>
        {form.sender && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Från:</Text>
            <Text style={styles.detailValue}>
              {form.sender.first_name && form.sender.last_name
                ? `${form.sender.first_name} ${form.sender.last_name}`
                : form.sender.username}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.description}>{form.description}</Text>

      {form.interested_user_ids.length > 0 && (
        <View style={styles.interestedContainer}>
          <Text style={styles.interestedText}>
            {form.interested_user_ids.length} person(er) intresserad(e)
          </Text>
        </View>
      )}

      {!isOwnForm && (
        <View style={styles.actionContainer}>
          {isInterested ? (
            <View style={styles.interestedBadge}>
              <Text style={styles.interestedBadgeText}>✓ Intresse markerat</Text>
            </View>
          ) : (
            <Button
              title={isMarkingInterest ? 'Markerar...' : 'Intresserad'}
              onPress={handleMarkInterested}
              disabled={isMarkingInterest}
              variant="outline"
              size="sm"
            />
          )}
        </View>
      )}

      {isOwnForm && (
        <View style={styles.ownFormBadge}>
          <Text style={styles.ownFormBadgeText}>Ditt formulär</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  typeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    width: 60,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  interestedContainer: {
    backgroundColor: '#F0F8FF',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  interestedText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  actionContainer: {
    alignItems: 'flex-end',
  },
  interestedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  ownFormBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-end',
  },
  ownFormBadgeText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '500',
  },
});