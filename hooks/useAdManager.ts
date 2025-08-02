import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePremiumStatus } from './usePremiumStatus';

interface AdManagerState {
  shouldShowAd: boolean;
  adType: 'premium_upgrade' | 'feature_unlock' | 'general';
  targetFeature?: string;
  showAd: (type?: 'premium_upgrade' | 'feature_unlock' | 'general', feature?: string) => void;
  hideAd: () => void;
}

const AD_STORAGE_KEY = '@skiftapp_ad_data';
const AD_INTERVALS = {
  general: 5 * 60 * 1000, // 5 minuter
  feature_unlock: 2 * 60 * 1000, // 2 minuter
  premium_upgrade: 10 * 60 * 1000, // 10 minuter
};

interface AdData {
  lastShown: number;
  showCount: number;
  type: string;
}

export const useAdManager = (): AdManagerState => {
  const { isPremium } = usePremiumStatus();
  const [shouldShowAd, setShouldShowAd] = useState(false);
  const [adType, setAdType] = useState<'premium_upgrade' | 'feature_unlock' | 'general'>('general');
  const [targetFeature, setTargetFeature] = useState<string | undefined>();

  // Ladda ad-data från storage
  const loadAdData = async (): Promise<AdData> => {
    try {
      const data = await AsyncStorage.getItem(AD_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading ad data:', error);
    }
    
    return {
      lastShown: 0,
      showCount: 0,
      type: 'general',
    };
  };

  // Spara ad-data till storage
  const saveAdData = async (data: AdData) => {
    try {
      await AsyncStorage.setItem(AD_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving ad data:', error);
    }
  };

  // Kontrollera om en annons ska visas baserat på tid och typ
  const shouldShowAdForType = async (type: string): Promise<boolean> => {
    if (isPremium) return false;

    const adData = await loadAdData();
    const now = Date.now();
    const interval = AD_INTERVALS[type as keyof typeof AD_INTERVALS] || AD_INTERVALS.general;
    
    return now - adData.lastShown > interval;
  };

  // Visa annons
  const showAd = useCallback(async (
    type: 'premium_upgrade' | 'feature_unlock' | 'general' = 'general',
    feature?: string
  ) => {
    if (isPremium) return;

    const canShow = await shouldShowAdForType(type);
    if (!canShow) return;

    setAdType(type);
    setTargetFeature(feature);
    setShouldShowAd(true);

    // Uppdatera statistik
    const adData = await loadAdData();
    await saveAdData({
      ...adData,
      lastShown: Date.now(),
      showCount: adData.showCount + 1,
      type,
    });
  }, [isPremium]);

  // Dölj annons
  const hideAd = useCallback(() => {
    setShouldShowAd(false);
    setTargetFeature(undefined);
  }, []);

  // Automatisk visning av annonser baserat på app-användning
  useEffect(() => {
    if (isPremium) return;

    const interval = setInterval(async () => {
      const canShow = await shouldShowAdForType('general');
      if (canShow && !shouldShowAd) {
        showAd('general');
      }
    }, 60000); // Kolla varje minut

    return () => clearInterval(interval);
  }, [isPremium, shouldShowAd, showAd]);

  return {
    shouldShowAd,
    adType,
    targetFeature,
    showAd,
    hideAd,
  };
};