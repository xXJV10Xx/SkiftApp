import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSubscription } from '../context/SubscriptionContext';
import { Ionicons } from '@expo/vector-icons';

interface AdBannerProps {
  position?: 'top' | 'bottom';
  size?: 'banner' | 'large';
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  position = 'bottom',
  size = 'banner' 
}) => {
  const { isPremium, isTrialActive } = useSubscription();
  const [adLoaded, setAdLoaded] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  // Om användaren har premium eller aktiv trial, visa inte reklam
  if (isPremium || isTrialActive) {
    return null;
  }

  // Simulera att reklam laddas (i verkligheten skulle detta använda Google Mobile Ads)
  useEffect(() => {
    const timer = setTimeout(() => {
      setAdLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAdClick = () => {
    // I verkligheten skulle detta hanteras av reklamleverantören
    Alert.alert('Reklam', 'Detta är en placeholder för reklam. I produktionen skulle detta vara en riktig annons.');
  };

  const handleUpgradeClick = () => {
    Alert.alert(
      'Uppgradera till Premium',
      'Ta bort all reklam och få tillgång till alla premium-funktioner!',
      [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Uppgradera', onPress: () => {
          // Navigera till prenumerationsskärm
          console.log('Navigate to subscription screen');
        }}
      ]
    );
  };

  if (showPlaceholder) {
    return (
      <View style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        size === 'large' ? styles.largeSize : styles.bannerSize
      ]}>
        <View style={styles.placeholderContainer}>
          <View style={styles.adContent}>
            <Ionicons name="megaphone" size={20} color="#666" />
            <Text style={styles.adText}>Reklam</Text>
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={handleUpgradeClick}
            >
              <Ionicons name="close" size={16} color="#007AFF" />
              <Text style={styles.upgradeText}>Ta bort</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.mockAd}
            onPress={handleAdClick}
          >
            <Text style={styles.mockAdTitle}>🎯 Exempel Reklam</Text>
            <Text style={styles.mockAdDescription}>
              Upptäck fantastiska erbjudanden och tjänster som kan intressera dig
            </Text>
            <Text style={styles.mockAdCta}>Klicka här för mer info</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // I produktionen skulle detta vara den riktiga reklamkomponenten
  return (
    <View style={[
      styles.container,
      position === 'top' ? styles.topPosition : styles.bottomPosition,
      size === 'large' ? styles.largeSize : styles.bannerSize
    ]}>
      {/* Här skulle Google Mobile Ads-komponenten renderas */}
      <Text style={styles.loadingText}>Laddar reklam...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topPosition: {
    marginBottom: 8,
  },
  bottomPosition: {
    marginTop: 8,
  },
  bannerSize: {
    height: 80,
    width: '100%',
  },
  largeSize: {
    height: 120,
    width: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    padding: 8,
  },
  adContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  adText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    marginLeft: 8,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upgradeText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '600',
  },
  mockAd: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    justifyContent: 'center',
  },
  mockAdTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mockAdDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    lineHeight: 16,
  },
  mockAdCta: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 12,
    color: '#999',
  },
});