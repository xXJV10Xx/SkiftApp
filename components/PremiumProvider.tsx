import React, { createContext, useContext, useEffect } from 'react';
import { View } from 'react-native';
import { useAdManager } from '../hooks/useAdManager';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { AdPopup } from './AdPopup';

interface PremiumContextType {
  isPremium: boolean;
  loading: boolean;
  showAd: (type?: 'premium_upgrade' | 'feature_unlock' | 'general', feature?: string) => void;
  checkFeatureAccess: (feature: string) => boolean;
}

const PremiumContext = createContext<PremiumContextType | null>(null);

interface PremiumProviderProps {
  children: React.ReactNode;
}

export const PremiumProvider: React.FC<PremiumProviderProps> = ({ children }) => {
  const { isPremium, loading } = usePremiumStatus();
  const { shouldShowAd, adType, targetFeature, showAd, hideAd } = useAdManager();

  // Lista över premium-funktioner
  const premiumFeatures = [
    'calendar_export',
    'advanced_stats',
    'custom_themes',
    'auto_sync',
    'ad_free',
    'priority_support',
  ];

  const checkFeatureAccess = (feature: string): boolean => {
    return !premiumFeatures.includes(feature) || isPremium;
  };

  const contextValue: PremiumContextType = {
    isPremium,
    loading,
    showAd,
    checkFeatureAccess,
  };

  return (
    <PremiumContext.Provider value={contextValue}>
      <View style={{ flex: 1 }}>
        {children}
        
        {/* Global Ad Popup */}
        <AdPopup
          visible={shouldShowAd}
          onClose={hideAd}
          adType={adType}
          targetFeature={targetFeature}
        />
      </View>
    </PremiumContext.Provider>
  );
};

export const usePremium = (): PremiumContextType => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};