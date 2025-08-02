import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

interface PaymentButtonProps {
  user: {
    id: string;
    calendar_export_paid?: boolean;
  };
  onPaymentSuccess?: () => void;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({ 
  user, 
  onPaymentSuccess 
}) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Call the checkout API
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // For React Native, you might want to use WebBrowser or in-app browser
      // For now, this assumes web environment
      if (typeof window !== 'undefined') {
        window.location.href = url;
      } else {
        // For React Native, you could use expo-web-browser
        Alert.alert(
          'Betalning',
          'Du kommer att omdirigeras till Stripe för att slutföra betalningen.',
          [
            { text: 'Avbryt', style: 'cancel' },
            { text: 'Fortsätt', onPress: () => {
              // Handle React Native navigation to web browser
              console.log('Navigate to:', url);
            }}
          ]
        );
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(
        'Fel',
        'Kunde inte starta betalningen. Försök igen.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // If user has already paid, show success message
  if (user.calendar_export_paid) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successText}>✅ Kalenderexport är aktiverad</Text>
        <Text style={styles.successSubtext}>
          Du kan nu exportera dina skift till Google Calendar och Apple Calendar
        </Text>
      </View>
    );
  }

  // Show payment button
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.paymentButton, loading && styles.buttonDisabled]}
        onPress={handlePayment}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Startar betalning...' : 'Lås upp kalenderexport – 99 kr'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.description}>
        Exportera dina skift till Google Calendar och Apple Calendar
      </Text>
      
      <View style={styles.features}>
        <Text style={styles.feature}>📅 Google Calendar-integration</Text>
        <Text style={styles.feature}>🍎 Apple Calendar-integration</Text>
        <Text style={styles.feature}>🔄 Automatisk synkronisering</Text>
        <Text style={styles.feature}>📱 Fungerar på alla enheter</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 16,
  },
  features: {
    gap: 8,
  },
  feature: {
    fontSize: 14,
    color: '#374151',
    paddingLeft: 8,
  },
  successContainer: {
    padding: 20,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: '#166534',
    textAlign: 'center',
  },
});