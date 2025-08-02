import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';

interface FormulärSkiftProps {
  groupId: string;
  formType: 'skiftöverlämning' | 'jobba extra' | 'haveri';
  onFormSent?: () => void;
}

export default function FormulärSkift({ groupId, formType, onFormSent }: FormulärSkiftProps) {
  const [date, setDate] = useState('');
  const [shift, setShift] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getFormTitle = () => {
    switch (formType) {
      case 'skiftöverlämning':
        return 'Skiftöverlämning';
      case 'jobba extra':
        return 'Jobba Extra';
      case 'haveri':
        return 'Haveri';
      default:
        return 'Formulär';
    }
  };

  const getDescriptionPlaceholder = () => {
    switch (formType) {
      case 'skiftöverlämning':
        return 'Beskriv vad som hänt under skiftet, viktiga noteringar...';
      case 'jobba extra':
        return 'Beskriv vilken typ av extraarbete som behövs...';
      case 'haveri':
        return 'Beskriv haveriet, vad som hänt och eventuella åtgärder...';
      default:
        return 'Beskrivning...';
    }
  };

  async function sendForm() {
    if (!date || !shift || !description.trim()) {
      Alert.alert('Fel', 'Alla fält måste fyllas i');
      return;
    }

    // Validate date format (basic check)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('Fel', 'Datum måste vara i format YYYY-MM-DD');
      return;
    }

    // Validate shift
    if (!['F', 'E', 'N', 'f', 'e', 'n'].includes(shift)) {
      Alert.alert('Fel', 'Skift måste vara F, E eller N');
      return;
    }

    setIsLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        Alert.alert('Fel', 'Du måste vara inloggad');
        return;
      }

      const { data, error } = await supabase.from('forms').insert([{
        type: formType,
        sender_id: user.user.id,
        group_id: groupId,
        date,
        shift: shift.toUpperCase(),
        description: description.trim(),
        interested_user_ids: []
      }]);

      if (error) {
        console.error('Error sending form:', error);
        Alert.alert('Fel', 'Kunde inte skicka formuläret');
      } else {
        Alert.alert('Skickat!', `${getFormTitle()} har skickats`);
        // Clear form
        setDate('');
        setShift('');
        setDescription('');
        onFormSent?.();
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Fel', 'Ett oväntat fel uppstod');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{getFormTitle()}</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Datum</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Skift</Text>
        <TextInput
          style={styles.input}
          value={shift}
          onChangeText={setShift}
          placeholder="F/E/N"
          placeholderTextColor="#666"
          maxLength={1}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Beskrivning</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder={getDescriptionPlaceholder()}
          placeholderTextColor="#666"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <Button
        title={isLoading ? 'Skickar...' : 'Skicka'}
        onPress={sendForm}
        disabled={isLoading}
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  button: {
    marginTop: 20,
    marginBottom: 40,
  },
});