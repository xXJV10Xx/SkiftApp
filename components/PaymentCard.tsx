import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CardField, useStripe, useApplePay, useGooglePay } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { paymentService } from '../lib/payment-service';
import { formatCurrency, isApplePaySupported, isGooglePaySupported } from '../lib/stripe';
import type { PaymentMethodType } from '../lib/stripe';

interface PaymentCardProps {
  amount: number;
  currency: string;
  companyId: string;
  subscriptionId?: string;
  description?: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
}

export default function PaymentCard({
  amount,
  currency,
  companyId,
  subscriptionId,
  description,
  onPaymentSuccess,
  onPaymentError,
}: PaymentCardProps) {
  const { confirmPayment } = useStripe();
  const { presentApplePay, confirmApplePayPayment } = useApplePay();
  const { initGooglePay, presentGooglePay } = useGooglePay();
  
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('card');
  const [applePaySupported, setApplePaySupported] = useState(false);
  const [googlePaySupported, setGooglePaySupported] = useState(false);

  useEffect(() => {
    // Check payment method availability
    setApplePaySupported(isApplePaySupported());
    setGooglePaySupported(isGooglePaySupported());

    // Initialize Google Pay if supported
    if (isGooglePaySupported()) {
      initGooglePay({
        testEnv: __DEV__,
        merchantName: 'Skiftappen',
        countryCode: 'SE',
        billingAddressConfig: {
          format: 'FULL',
          isPhoneNumberRequired: true,
          isRequired: false,
        },
        existingPaymentMethodRequired: false,
        isEmailRequired: true,
      }).then((initialized) => {
        setGooglePaySupported(initialized);
      });
    }
  }, []);

  const handleCardPayment = async () => {
    if (!cardComplete) {
      Alert.alert('Fel', 'Vänligen fyll i alla kortuppgifter');
      return;
    }

    setLoading(true);
    try {
      // Create payment with payment service
      const payment = await paymentService.processPayment(
        companyId,
        amount,
        currency,
        'card',
        description,
        subscriptionId
      );

      // Create payment intent
      const { createPaymentIntent } = await import('../lib/stripe');
      const paymentIntent = await createPaymentIntent({
        amount,
        currency,
        companyId,
        subscriptionId,
        description,
        paymentMethodTypes: ['card'],
      });

      // Confirm payment with Stripe
      const { error, paymentIntent: confirmedPayment } = await confirmPayment(
        paymentIntent.clientSecret,
        {
          paymentMethodType: 'Card',
        }
      );

      if (error) {
        await paymentService.updatePaymentStatus(payment.id, 'failed');
        onPaymentError(error.message);
      } else if (confirmedPayment?.status === 'Succeeded') {
        await paymentService.updatePaymentStatus(payment.id, 'succeeded');
        onPaymentSuccess(payment.id);
      }
    } catch (error) {
      onPaymentError(error instanceof Error ? error.message : 'Betalning misslyckades');
    } finally {
      setLoading(false);
    }
  };

  const handleApplePayPayment = async () => {
    if (!applePaySupported) {
      Alert.alert('Fel', 'Apple Pay stöds inte på denna enhet');
      return;
    }

    setLoading(true);
    try {
      // Create payment with payment service
      const payment = await paymentService.processPayment(
        companyId,
        amount,
        currency,
        'apple_pay',
        description,
        subscriptionId
      );

      // Create payment intent
      const { createPaymentIntent } = await import('../lib/stripe');
      const paymentIntent = await createPaymentIntent({
        amount,
        currency,
        companyId,
        subscriptionId,
        description,
        paymentMethodTypes: ['apple_pay'],
      });

      // Present Apple Pay
      const { error: presentError } = await presentApplePay({
        cartItems: [
          {
            label: description || 'Skiftappen Prenumeration',
            amount: formatCurrency(amount, currency),
            paymentType: 'Immediate',
          },
        ],
        country: 'SE',
        currency: currency.toUpperCase(),
        requiredShippingAddressFields: [],
        requiredBillingContactFields: ['emailAddress'],
      });

      if (presentError) {
        await paymentService.updatePaymentStatus(payment.id, 'failed');
        onPaymentError(presentError.message);
        return;
      }

      // Confirm Apple Pay payment
      const { error: confirmError } = await confirmApplePayPayment(
        paymentIntent.clientSecret
      );

      if (confirmError) {
        await paymentService.updatePaymentStatus(payment.id, 'failed');
        onPaymentError(confirmError.message);
      } else {
        await paymentService.updatePaymentStatus(payment.id, 'succeeded');
        onPaymentSuccess(payment.id);
      }
    } catch (error) {
      onPaymentError(error instanceof Error ? error.message : 'Apple Pay betalning misslyckades');
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePayPayment = async () => {
    if (!googlePaySupported) {
      Alert.alert('Fel', 'Google Pay stöds inte på denna enhet');
      return;
    }

    setLoading(true);
    try {
      // Create payment with payment service
      const payment = await paymentService.processPayment(
        companyId,
        amount,
        currency,
        'google_pay',
        description,
        subscriptionId
      );

      // Create payment intent
      const { createPaymentIntent } = await import('../lib/stripe');
      const paymentIntent = await createPaymentIntent({
        amount,
        currency,
        companyId,
        subscriptionId,
        description,
        paymentMethodTypes: ['google_pay'],
      });

      // Present Google Pay
      const { error } = await presentGooglePay({
        clientSecret: paymentIntent.clientSecret,
        forSetupIntent: false,
        currencyCode: currency.toUpperCase(),
      });

      if (error) {
        await paymentService.updatePaymentStatus(payment.id, 'failed');
        onPaymentError(error.message);
      } else {
        await paymentService.updatePaymentStatus(payment.id, 'succeeded');
        onPaymentSuccess(payment.id);
      }
    } catch (error) {
      onPaymentError(error instanceof Error ? error.message : 'Google Pay betalning misslyckades');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    switch (selectedPaymentMethod) {
      case 'card':
        handleCardPayment();
        break;
      case 'apple_pay':
        handleApplePayPayment();
        break;
      case 'google_pay':
        handleGooglePayPayment();
        break;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Betalning</Text>
        <Text style={styles.amount}>{formatCurrency(amount, currency)}</Text>
      </View>

      {description && (
        <Text style={styles.description}>{description}</Text>
      )}

      {/* Payment Method Selection */}
      <View style={styles.paymentMethods}>
        <Text style={styles.sectionTitle}>Välj betalningsmetod</Text>
        
        {/* Card Payment */}
        <TouchableOpacity
          style={[
            styles.paymentMethodButton,
            selectedPaymentMethod === 'card' && styles.paymentMethodSelected,
          ]}
          onPress={() => setSelectedPaymentMethod('card')}
        >
          <Ionicons name="card" size={24} color="#007AFF" />
          <Text style={styles.paymentMethodText}>Kort</Text>
          {selectedPaymentMethod === 'card' && (
            <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
          )}
        </TouchableOpacity>

        {/* Apple Pay */}
        {applePaySupported && (
          <TouchableOpacity
            style={[
              styles.paymentMethodButton,
              selectedPaymentMethod === 'apple_pay' && styles.paymentMethodSelected,
            ]}
            onPress={() => setSelectedPaymentMethod('apple_pay')}
          >
            <Ionicons name="logo-apple" size={24} color="#007AFF" />
            <Text style={styles.paymentMethodText}>Apple Pay</Text>
            {selectedPaymentMethod === 'apple_pay' && (
              <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
            )}
          </TouchableOpacity>
        )}

        {/* Google Pay */}
        {googlePaySupported && (
          <TouchableOpacity
            style={[
              styles.paymentMethodButton,
              selectedPaymentMethod === 'google_pay' && styles.paymentMethodSelected,
            ]}
            onPress={() => setSelectedPaymentMethod('google_pay')}
          >
            <Ionicons name="logo-google" size={24} color="#007AFF" />
            <Text style={styles.paymentMethodText}>Google Pay</Text>
            {selectedPaymentMethod === 'google_pay' && (
              <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Card Input Field */}
      {selectedPaymentMethod === 'card' && (
        <View style={styles.cardContainer}>
          <Text style={styles.sectionTitle}>Kortuppgifter</Text>
          <CardField
            postalCodeEnabled={true}
            placeholders={{
              number: '4242 4242 4242 4242',
              expiration: 'MM/ÅÅ',
              cvc: 'CVC',
              postalCode: 'Postnummer',
            }}
            cardStyle={styles.cardField}
            style={styles.cardFieldContainer}
            onCardChange={(cardDetails) => {
              setCardComplete(cardDetails.complete);
            }}
          />
        </View>
      )}

      {/* Payment Button */}
      <TouchableOpacity
        style={[
          styles.payButton,
          (!cardComplete && selectedPaymentMethod === 'card') && styles.payButtonDisabled,
        ]}
        onPress={handlePayment}
        disabled={loading || (!cardComplete && selectedPaymentMethod === 'card')}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Text style={styles.payButtonText}>
              {selectedPaymentMethod === 'apple_pay' && 'Betala med Apple Pay'}
              {selectedPaymentMethod === 'google_pay' && 'Betala med Google Pay'}
              {selectedPaymentMethod === 'card' && `Betala ${formatCurrency(amount, currency)}`}
            </Text>
            {selectedPaymentMethod === 'apple_pay' && (
              <Ionicons name="logo-apple" size={20} color="white" style={styles.buttonIcon} />
            )}
            {selectedPaymentMethod === 'google_pay' && (
              <Ionicons name="logo-google" size={20} color="white" style={styles.buttonIcon} />
            )}
          </>
        )}
      </TouchableOpacity>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Ionicons name="shield-checkmark" size={16} color="#666" />
        <Text style={styles.securityText}>
          Säker betalning med SSL-kryptering via Stripe
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
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
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: '600',
    color: '#007AFF',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  paymentMethods: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    marginBottom: 8,
  },
  paymentMethodSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  cardContainer: {
    marginBottom: 20,
  },
  cardFieldContainer: {
    height: 50,
  },
  cardField: {
    backgroundColor: '#F8F9FA',
    textColor: '#333',
    borderColor: '#E5E5E5',
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    placeholderColor: '#999',
  },
  payButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  payButtonDisabled: {
    backgroundColor: '#CCC',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});