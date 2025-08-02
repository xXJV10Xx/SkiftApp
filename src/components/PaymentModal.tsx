import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  PaymentRequestButtonElement,
  usePaymentRequest
} from '@stripe/react-stripe-js';
import { X, Calendar, CreditCard, Smartphone, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calendarAPI, userAPI } from '../lib/api';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

interface PaymentFormProps {
  userId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ userId, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'digital'>('card');

  // Payment Request for Apple Pay / Google Pay
  const paymentRequest = usePaymentRequest({
    country: 'SE',
    currency: 'sek',
    total: {
      label: 'Kalender Export',
      amount: 9900, // 99 SEK in öre
    },
    requestPayerName: true,
    requestPayerEmail: true,
  });

  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (paymentRequest) {
      paymentRequest.canMakePayment().then((result) => {
        if (result) {
          setCanMakePayment(true);
        }
      });

      paymentRequest.on('paymentmethod', async (event) => {
        setIsProcessing(true);
        
        try {
          // Create payment intent on server
          const { data: paymentIntent } = await createPaymentIntent(userId);
          
          if (!paymentIntent) {
            throw new Error('Failed to create payment intent');
          }

          // Confirm payment
          const { error: confirmError } = await stripe!.confirmCardPayment(
            paymentIntent.client_secret,
            {
              payment_method: event.paymentMethod.id
            }
          );

          if (confirmError) {
            event.complete('fail');
            onError(confirmError.message || 'Payment failed');
          } else {
            event.complete('success');
            await handleSuccessfulPayment(paymentIntent.id, userId);
            onSuccess();
          }
        } catch (error) {
          event.complete('fail');
          onError(error instanceof Error ? error.message : 'Payment failed');
        } finally {
          setIsProcessing(false);
        }
      });
    }
  }, [paymentRequest, stripe, userId, onSuccess, onError]);

  const createPaymentIntent = async (userId: string) => {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 9900, // 99 SEK in öre
        currency: 'sek',
        userId: userId,
        featureType: 'calendar_export'
      }),
    });

    return response.json();
  };

  const handleSuccessfulPayment = async (paymentIntentId: string, userId: string) => {
    // Update user's calendar access
    await calendarAPI.grantCalendarAccess(userId);
    
    // Record transaction in database
    await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntentId,
        amount: 9900,
        currency: 'SEK',
        status: 'succeeded',
        feature_type: 'calendar_export'
      });
  };

  const handleCardPayment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment intent
      const { data: paymentIntent } = await createPaymentIntent(userId);
      
      if (!paymentIntent) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm payment
      const { error, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: {
            card: cardElement,
          }
        }
      );

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (confirmedPayment?.status === 'succeeded') {
        await handleSuccessfulPayment(confirmedPayment.id, userId);
        onSuccess();
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Välj betalningsmetod</h3>
        
        {/* Digital Wallets */}
        {canMakePayment && (
          <div className="space-y-3">
            <button
              onClick={() => setPaymentMethod('digital')}
              className={`w-full p-4 border-2 rounded-lg flex items-center space-x-3 transition-colors ${
                paymentMethod === 'digital'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Smartphone className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Apple Pay / Google Pay</div>
                <div className="text-sm text-gray-500">Snabb och säker betalning</div>
              </div>
            </button>

            {paymentMethod === 'digital' && (
              <div className="pl-8">
                <PaymentRequestButtonElement
                  options={{ paymentRequest }}
                  className="PaymentRequestButton"
                />
              </div>
            )}
          </div>
        )}

        {/* Card Payment */}
        <button
          onClick={() => setPaymentMethod('card')}
          className={`w-full p-4 border-2 rounded-lg flex items-center space-x-3 transition-colors ${
            paymentMethod === 'card'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <CreditCard className="w-5 h-5 text-gray-600" />
          <div className="text-left">
            <div className="font-medium text-gray-900">Kort</div>
            <div className="text-sm text-gray-500">Visa, Mastercard, American Express</div>
          </div>
        </button>
      </div>

      {/* Card Payment Form */}
      {paymentMethod === 'card' && (
        <form onSubmit={handleCardPayment} className="space-y-4">
          <div className="p-4 border border-gray-300 rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Bearbetar...</span>
              </>
            ) : (
              <>
                <span>Betala 99 kr</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Security Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
          <div className="text-sm text-gray-600">
            <div className="font-medium text-gray-900 mb-1">Säker betalning</div>
            <ul className="space-y-1">
              <li>• Alla betalningar krypteras med SSL</li>
              <li>• Vi sparar aldrig dina kortuppgifter</li>
              <li>• Engångsbetalning - ingen prenumeration</li>
              <li>• 30 dagars återbetalningsgaranti</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, userId, onSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onSuccess();
      onClose();
      setIsSuccess(false);
    }, 2000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {isSuccess ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Betalning genomförd!</h3>
            <p className="text-gray-600">Du kan nu exportera dina skift till kalender.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Kalender Export</h2>
                  <p className="text-sm text-gray-500">Exportera dina skift till Google/Apple Kalender</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Feature Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Vad ingår:</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Exportera alla dina skiftformulär</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Synkronisering med Google Kalender</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Kompatibel med Apple Kalender</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Automatiska uppdateringar</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Livstidsåtkomst</span>
                  </li>
                </ul>
              </div>

              {/* Price */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">99 kr</div>
                  <div className="text-sm text-blue-600">Engångsbetalning</div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="text-red-700 text-sm">{error}</div>
                </div>
              )}

              {/* Payment Form */}
              <Elements stripe={stripePromise}>
                <PaymentForm
                  userId={userId}
                  onSuccess={handleSuccess}
                  onError={handleError}
                />
              </Elements>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;