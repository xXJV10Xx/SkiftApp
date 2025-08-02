import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

interface PremiumStatus {
  isPremium: boolean;
  premiumActivatedAt: string | null;
  loading: boolean;
  error: string | null;
}

export const usePremiumStatus = (): PremiumStatus => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumActivatedAt, setPremiumActivatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPremiumStatus = async () => {
    if (!user?.id) {
      setIsPremium(false);
      setPremiumActivatedAt(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('users')
        .select('is_premium, premium_activated_at')
        .eq('id', user.id)
        .single();

      if (supabaseError) {
        console.error('Error fetching premium status:', supabaseError);
        setError(supabaseError.message);
        return;
      }

      setIsPremium(data?.is_premium || false);
      setPremiumActivatedAt(data?.premium_activated_at || null);

    } catch (err) {
      console.error('Error in fetchPremiumStatus:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch premium status on mount and when user changes
  useEffect(() => {
    fetchPremiumStatus();
  }, [user?.id]);

  // Set up real-time subscription for premium status changes
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('premium-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Premium status updated:', payload);
          const newData = payload.new as any;
          setIsPremium(newData.is_premium || false);
          setPremiumActivatedAt(newData.premium_activated_at || null);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  return {
    isPremium,
    premiumActivatedAt,
    loading,
    error,
  };
};

// Hook för att kontrollera om en specifik feature är tillgänglig
export const useFeatureAccess = (feature: string) => {
  const { isPremium, loading } = usePremiumStatus();

  // Lista över funktioner som kräver premium
  const premiumFeatures = [
    'calendar_export',
    'advanced_stats',
    'custom_themes',
    'auto_sync',
    'ad_free',
    'priority_support',
  ];

  const hasAccess = !premiumFeatures.includes(feature) || isPremium;

  return {
    hasAccess,
    requiresPremium: premiumFeatures.includes(feature),
    isPremium,
    loading,
  };
};