import { StripeProvider, initStripe } from '@stripe/stripe-react-native';
import { Platform } from 'react-native';

// Stripe configuration constants
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
export const STRIPE_MERCHANT_ID = process.env.EXPO_PUBLIC_STRIPE_MERCHANT_ID;

if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}

// Initialize Stripe
export const initializeStripe = async () => {
  await initStripe({
    publishableKey: STRIPE_PUBLISHABLE_KEY!,
    merchantIdentifier: STRIPE_MERCHANT_ID || 'merchant.com.skiftappen.app',
    urlScheme: 'skiftappen',
    setReturnUrlSchemeOnAndroid: true,
  });
};

// Payment method types
export type PaymentMethodType = 'card' | 'apple_pay' | 'google_pay';

// Subscription plans
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  employeeLimit: number;
  features: string[];
  stripePriceId: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    currency: 'SEK',
    billingPeriod: 'monthly',
    employeeLimit: 10,
    features: [
      'Upp till 10 anställda',
      'Grundläggande schemaläggning',
      'Chattfunktion',
      'Mobilapp',
      'Email support'
    ],
    stripePriceId: 'price_starter_monthly'
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 199,
    currency: 'SEK',
    billingPeriod: 'monthly',
    employeeLimit: 50,
    features: [
      'Upp till 50 anställda',
      'Avancerad schemaläggning',
      'Chattfunktion',
      'Rapporter och analys',
      'Mobilapp',
      'Prioriterad support'
    ],
    stripePriceId: 'price_professional_monthly'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 399,
    currency: 'SEK',
    billingPeriod: 'monthly',
    employeeLimit: -1, // Unlimited
    features: [
      'Obegränsat antal anställda',
      'Avancerad schemaläggning',
      'Chattfunktion',
      'Rapporter och analys',
      'API-åtkomst',
      'Anpassade integrationer',
      'Dedikerad support'
    ],
    stripePriceId: 'price_enterprise_monthly'
  }
];

// Payment intent creation
export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  companyId: string;
  subscriptionId?: string;
  description?: string;
  paymentMethodTypes?: PaymentMethodType[];
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

// Stripe API calls
export const createPaymentIntent = async (params: CreatePaymentIntentParams): Promise<PaymentIntentResponse> => {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payments/create-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency.toLowerCase(),
      company_id: params.companyId,
      subscription_id: params.subscriptionId,
      description: params.description,
      payment_method_types: params.paymentMethodTypes || ['card'],
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Payment intent creation failed: ${response.statusText}`);
  }

  return response.json();
};

// Create subscription
export interface CreateSubscriptionParams {
  companyId: string;
  planId: string;
  paymentMethodId: string;
}

export interface SubscriptionResponse {
  subscriptionId: string;
  clientSecret?: string;
  status: string;
}

export const createSubscription = async (params: CreateSubscriptionParams): Promise<SubscriptionResponse> => {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/subscriptions/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      company_id: params.companyId,
      plan_id: params.planId,
      payment_method_id: params.paymentMethodId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Subscription creation failed: ${response.statusText}`);
  }

  return response.json();
};

// Update subscription
export interface UpdateSubscriptionParams {
  subscriptionId: string;
  planId?: string;
  cancelAtPeriodEnd?: boolean;
}

export const updateSubscription = async (params: UpdateSubscriptionParams): Promise<SubscriptionResponse> => {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/subscriptions/${params.subscriptionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plan_id: params.planId,
      cancel_at_period_end: params.cancelAtPeriodEnd,
    }),
  });

  if (!response.ok) {
    throw new Error(`Subscription update failed: ${response.statusText}`);
  }

  return response.json();
};

// Cancel subscription
export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Subscription cancellation failed: ${response.statusText}`);
  }
};

// Get payment methods
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export const getPaymentMethods = async (companyId: string): Promise<PaymentMethod[]> => {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payment-methods?company_id=${companyId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch payment methods: ${response.statusText}`);
  }

  return response.json();
};

// Save payment method
export const savePaymentMethod = async (paymentMethodId: string, companyId: string): Promise<void> => {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payment-methods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment_method_id: paymentMethodId,
      company_id: companyId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save payment method: ${response.statusText}`);
  }
};

// Delete payment method
export const deletePaymentMethod = async (paymentMethodId: string): Promise<void> => {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payment-methods/${paymentMethodId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete payment method: ${response.statusText}`);
  }
};

// Apple Pay availability check
export const isApplePaySupported = (): boolean => {
  return Platform.OS === 'ios';
};

// Google Pay availability check  
export const isGooglePaySupported = (): boolean => {
  return Platform.OS === 'android';
};

// Format currency
export const formatCurrency = (amount: number, currency: string = 'SEK'): string => {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100); // Stripe amounts are in cents
};

// Get invoice PDF
export const getInvoicePDF = async (invoiceId: string): Promise<string> => {
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/invoices/${invoiceId}/pdf`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch invoice PDF: ${response.statusText}`);
  }

  const data = await response.json();
  return data.pdf_url;
};