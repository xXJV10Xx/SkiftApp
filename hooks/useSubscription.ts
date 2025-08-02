import { useState, useEffect } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Alert } from 'react-native';

interface UserSubscriptionData {
  is_premium: boolean;
  has_paid_export: boolean;
  trial_started_at: string;
  premium_type?: string;
  premium_started_at?: string;
}

interface SubscriptionStatus {
  hasPremiumAccess: boolean;
  hasExportAccess: boolean;
  trialDaysLeft: number;
  isTrialActive: boolean;
  premiumType?: string;
  loading: boolean;
}

export const useSubscription = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
  const [subscriptionData, setSubscriptionData] = useState<UserSubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadSubscriptionData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('is_premium, has_paid_export, trial_started_at, premium_type, premium_started_at')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error loading subscription data:', error);
        return;
      }

      setSubscriptionData(data);
    } catch (error) {
      console.error('Error in loadSubscriptionData:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionStatus = (): SubscriptionStatus => {
    if (!subscriptionData) {
      return {
        hasPremiumAccess: false,
        hasExportAccess: false,
        trialDaysLeft: 0,
        isTrialActive: false,
        loading
      };
    }

    const daysSinceTrial = Math.floor(
      (Date.now() - new Date(subscriptionData.trial_started_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const trialDaysLeft = Math.max(0, 7 - daysSinceTrial);
    const isTrialActive = trialDaysLeft > 0;
    const hasPremiumAccess = subscriptionData.is_premium || isTrialActive;

    return {
      hasPremiumAccess,
      hasExportAccess: subscriptionData.has_paid_export,
      trialDaysLeft,
      isTrialActive,
      premiumType: subscriptionData.premium_type,
      loading
    };
  };

  const checkPremiumAccess = (showAlert: boolean = true): boolean => {
    const status = getSubscriptionStatus();
    
    if (!status.hasPremiumAccess && showAlert) {
      const message = status.trialDaysLeft > 0 
        ? `Du har ${status.trialDaysLeft} dagar kvar av din gratis trial.`
        : 'Prenumeration krävs för denna funktion.';
      
      Alert.alert(
        'Premium krävs',
        message,
        [
          { text: 'Stäng', style: 'cancel' },
          { text: 'Prenumerera', onPress: () => {/* Navigate to subscription screen */} }
        ]
      );
    }
    
    return status.hasPremiumAccess;
  };

  const checkExportAccess = (showAlert: boolean = true): boolean => {
    const status = getSubscriptionStatus();
    
    if (!status.hasExportAccess && showAlert) {
      Alert.alert(
        'Export krävs',
        'Du måste köpa export-funktionen för att exportera till kalender.',
        [
          { text: 'Stäng', style: 'cancel' },
          { text: 'Köp export', onPress: () => {/* Navigate to subscription screen */} }
        ]
      );
    }
    
    return status.hasExportAccess;
  };

  const showAdIfNeeded = (): boolean => {
    const status = getSubscriptionStatus();
    
    if (!status.hasPremiumAccess) {
      Alert.alert(
        'Reklam',
        'Använd gratisversion eller prenumerera för export och reklamfri upplevelse',
        [
          { text: 'Stäng', style: 'cancel' },
          { text: 'Prenumerera', onPress: () => {/* Navigate to subscription screen */} }
        ]
      );
      return true;
    }
    
    return false;
  };

  return {
    subscriptionData,
    subscriptionStatus: getSubscriptionStatus(),
    loading,
    checkPremiumAccess,
    checkExportAccess,
    showAdIfNeeded,
    refreshSubscriptionData: loadSubscriptionData
  };
};