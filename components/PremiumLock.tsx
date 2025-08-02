import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../context/SubscriptionContext';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

interface PremiumLockProps {
  children: React.ReactNode;
  feature: string;
  description?: string;
  showUpgradeButton?: boolean;
}

export const PremiumLock: React.FC<PremiumLockProps> = ({ 
  children, 
  feature, 
  description,
  showUpgradeButton = true 
}) => {
  const { isPremium, isTrialActive, trialDaysLeft, createCheckoutSession } = useSubscription();
  const router = useRouter();

  // Om användaren har premium eller aktiv trial, visa innehållet
  if (isPremium || isTrialActive) {
    return <>{children}</>;
  }

  const handleUpgrade = () => {
    router.push('/subscription' as any);
  };

  const handleQuickUpgrade = async (plan: 'monthly' | 'semiannual' | 'annual') => {
    try {
      const sessionUrl = await createCheckoutSession(plan);
      await WebBrowser.openBrowserAsync(sessionUrl);
    } catch (error) {
      Alert.alert('Fel', 'Kunde inte öppna betalningssidan. Försök igen.');
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.lockContainer}>
          <Ionicons name="lock-closed" size={48} color="white" />
          <Text style={styles.title}>Premium-funktion</Text>
          <Text style={styles.feature}>{feature}</Text>
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
          
          {isTrialActive && trialDaysLeft > 0 && (
            <View style={styles.trialInfo}>
              <Text style={styles.trialText}>
                🎉 {trialDaysLeft} dagar kvar av din gratis provperiod
              </Text>
            </View>
          )}

          {showUpgradeButton && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.upgradeButton} 
                onPress={handleUpgrade}
              >
                <Text style={styles.upgradeButtonText}>Se alla planer</Text>
              </TouchableOpacity>
              
              <View style={styles.quickUpgradeContainer}>
                <Text style={styles.quickUpgradeTitle}>Eller uppgradera direkt:</Text>
                
                <TouchableOpacity 
                  style={styles.quickButton}
                  onPress={() => handleQuickUpgrade('monthly')}
                >
                  <Text style={styles.quickButtonText}>Månad - 39 kr</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.quickButton, styles.popularButton]}
                  onPress={() => handleQuickUpgrade('semiannual')}
                >
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>POPULÄR</Text>
                  </View>
                  <Text style={styles.quickButtonText}>Halvår - 108 kr</Text>
                  <Text style={styles.saveText}>Spara 5%</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.quickButton, styles.bestValueButton]}
                  onPress={() => handleQuickUpgrade('annual')}
                >
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueBadgeText}>BÄST VÄRDE</Text>
                  </View>
                  <Text style={styles.quickButtonText}>År - 205 kr</Text>
                  <Text style={styles.saveText}>Spara 10%</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    margin: 16,
  },
  gradient: {
    padding: 24,
  },
  lockContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  feature: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
  },
  trialInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  trialText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  upgradeButton: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 16,
  },
  upgradeButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickUpgradeContainer: {
    width: '100%',
    alignItems: 'center',
  },
  quickUpgradeTitle: {
    color: 'white',
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.9,
  },
  quickButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
    minWidth: 200,
    alignItems: 'center',
    position: 'relative',
  },
  popularButton: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderColor: '#ffc107',
  },
  bestValueButton: {
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
    borderColor: '#28a745',
  },
  quickButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  saveText: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -6,
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  popularBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -6,
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  bestValueBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});