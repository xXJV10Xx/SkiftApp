import React from 'react';
import { View, Button, Alert } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';

export default function StripeCheckoutButton() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const fetchPaymentSheetParams = async () => {
    const response = await fetch('http://localhost:4242/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { paymentIntent, ephemeralKey, customer } = await response.json();
    return { paymentIntent, ephemeralKey, customer };
  };

  const initializePaymentSheet = async () => {
    const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams();

    const { error } = await initPaymentSheet({
      merchantDisplayName: 'SkiftApp',
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: paymentIntent,
      allowsDelayedPaymentMethods: false,
    });

    return !error;
  };

  const openPaymentSheet = async () => {
    const ready = await initializePaymentSheet();
    if (!ready) return;

    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Betalningsfel`, error.message);
    } else {
      Alert.alert('Tack!', 'Betalning genomförd!');
      // 🔁 Lägg till logik för att låsa upp premium här
    }
  };

  return <Button title="Exportera till kalender – 99 kr" onPress={openPaymentSheet} />;
}