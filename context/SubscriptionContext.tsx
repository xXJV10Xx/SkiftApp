import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Database } from '../lib/supabase';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];

interface SubscriptionContextType {
  subscription: Subscription | null;
  isLoading: boolean;
  isPremium: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number;
  refreshSubscription: () => Promise<void>;
  createCheckoutSession: (plan: 'monthly' | 'semiannual' | 'annual') => Promise<string>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Beräkna om användaren har premium-tillgång
  const isPremium = subscription?.is_active || false;

  // Beräkna om trial är aktivt
  const isTrialActive = subscription?.trial_ends_at 
    ? new Date(subscription.trial_ends_at) > new Date() 
    : false;

  // Beräkna antal dagar kvar av trial
  const trialDaysLeft = subscription?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching subscription:', error);
      } else {
        setSubscription(data || null);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubscription = async () => {
    setIsLoading(true);
    await fetchSubscription();
  };

  const createCheckoutSession = async (plan: 'monthly' | 'semiannual' | 'annual'): Promise<string> => {
    if (!user) {
      throw new Error('User must be logged in to create checkout session');
    }

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          user_id: user.id,
          email: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { session_url } = await response.json();
      return session_url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  // Lyssna på real-time uppdateringar av prenumerationer
  useEffect(() => {
    if (!user) return;

    const subscriptionChannel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Subscription updated:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setSubscription(payload.new as Subscription);
          } else if (payload.eventType === 'DELETE') {
            setSubscription(null);
          }
        }
      )
      .subscribe();

    return () => {
      subscriptionChannel.unsubscribe();
    };
  }, [user]);

  const value: SubscriptionContextType = {
    subscription,
    isLoading,
    isPremium,
    isTrialActive,
    trialDaysLeft,
    refreshSubscription,
    createCheckoutSession,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};