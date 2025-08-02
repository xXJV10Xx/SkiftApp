import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Subscription {
  id: string;
  user_id: string;
  is_active: boolean;
  plan: 'monthly' | 'semiannual' | 'annual' | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  created_at: string;
}

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  subscription: Subscription | null;
  refreshSubscription: () => Promise<void>;
  hasTrialExpired: boolean;
  trialDaysLeft: number | null;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const refreshSubscription = async () => {
    if (!user) {
      setIsPremium(false);
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
        setIsPremium(false);
        setSubscription(null);
      } else if (data) {
        setSubscription(data);
        setIsPremium(data.is_active || !hasTrialExpired);
      } else {
        // Ingen prenumeration finns, skapa trial
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 dagars trial

        const { data: newSubscription, error: createError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            is_active: false,
            trial_ends_at: trialEndDate.toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating trial subscription:', createError);
          setIsPremium(false);
          setSubscription(null);
        } else {
          setSubscription(newSubscription);
          setIsPremium(true); // Trial är aktivt
        }
      }
    } catch (error) {
      console.error('Error in refreshSubscription:', error);
      setIsPremium(false);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  const hasTrialExpired = React.useMemo(() => {
    if (!subscription?.trial_ends_at) return false;
    return new Date() > new Date(subscription.trial_ends_at);
  }, [subscription?.trial_ends_at]);

  const trialDaysLeft = React.useMemo(() => {
    if (!subscription?.trial_ends_at || hasTrialExpired) return null;
    
    const now = new Date();
    const trialEnd = new Date(subscription.trial_ends_at);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }, [subscription?.trial_ends_at, hasTrialExpired]);

  useEffect(() => {
    refreshSubscription();
  }, [user]);

  // Lyssna på real-time uppdateringar av prenumerationer
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refreshSubscription();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const value: PremiumContextType = {
    isPremium,
    isLoading,
    subscription,
    refreshSubscription,
    hasTrialExpired,
    trialDaysLeft
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}