import React, { useEffect, useState } from 'react';
import { View, Alert, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import SubscriptionScreen from './SubscriptionScreen';

interface PremiumWrapperProps {
  children: React.ReactNode;
  requirePremium?: boolean;
  showAdPopup?: boolean;
}

interface UserData {
  is_premium: boolean;
  trial_started_at: string;
}

export default function PremiumWrapper({ 
  children, 
  requirePremium = false,
  showAdPopup = true 
}: PremiumWrapperProps) {
  const user = useUser();
  const supabase = useSupabaseClient();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adShownRecently, setAdShownRecently] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  useEffect(() => {
    // Show ad popup for non-premium users periodically
    if (userData && !userData.is_premium && showAdPopup && !adShownRecently) {
      const trialDays = userData.trial_started_at 
        ? Math.floor((Date.now() - new Date(userData.trial_started_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      // Show ad popup if trial has expired
      if (trialDays >= 7) {
        const timer = setTimeout(() => {
          setShowAdModal(true);
          setAdShownRecently(true);
          
          // Don't show again for 10 minutes
          setTimeout(() => setAdShownRecently(false), 10 * 60 * 1000);
        }, 5000); // Show after 5 seconds

        return () => clearTimeout(timer);
      }
    }
  }, [userData, showAdPopup, adShownRecently]);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_premium, trial_started_at')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return;
      }

      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeAdModal = () => {
    setShowAdModal(false);
  };

  const upgradeToPremium = () => {
    setShowAdModal(false);
    // Navigate to subscription screen or show it as modal
    Alert.alert(
      'Uppgradera till Premium',
      'Få reklamfri upplevelse och alla premium-funktioner!',
      [
        { text: 'Senare', style: 'cancel' },
        { text: 'Uppgradera', onPress: () => {/* Navigate to subscription */} }
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Laddar...</ThemedText>
      </ThemedView>
    );
  }

  if (!userData) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText>Kunde inte ladda användardata</ThemedText>
      </ThemedView>
    );
  }

  const trialDays = userData.trial_started_at 
    ? Math.floor((Date.now() - new Date(userData.trial_started_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const trialDaysLeft = Math.max(0, 7 - trialDays);
  const isTrialActive = trialDaysLeft > 0;
  const hasAccess = userData.is_premium || isTrialActive;

  // If premium is required and user doesn't have access, show subscription screen
  if (requirePremium && !hasAccess) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.lockScreen}>
          <ThemedText type="title" style={styles.lockTitle}>
            🔒 Premium krävs
          </ThemedText>
          <ThemedText style={styles.lockDescription}>
            Den här funktionen kräver en Premium-prenumeration eller är inte tillgänglig under gratisperioden som har gått ut.
          </ThemedText>
        </View>
        <SubscriptionScreen />
      </ThemedView>
    );
  }

  return (
    <>
      {children}
      
      {/* Ad Modal for non-premium users */}
      <Modal
        visible={showAdModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeAdModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.adModal}>
            <View style={styles.adHeader}>
              <ThemedText type="subtitle" style={styles.adTitle}>
                📢 Reklam
              </ThemedText>
              <TouchableOpacity onPress={closeAdModal} style={styles.closeButton}>
                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
              </TouchableOpacity>
            </View>
            
            <View style={styles.adContent}>
              <ThemedText style={styles.adText}>
                Du använder gratisversionen med reklam.
              </ThemedText>
              <ThemedText style={styles.adSubtext}>
                Uppgradera för export och reklamfri app!
              </ThemedText>
              
              {/* Simulated ad space */}
              <View style={styles.adSpace}>
                <ThemedText style={styles.adPlaceholder}>
                  [Reklamplats]
                </ThemedText>
                <ThemedText style={styles.adPlaceholderSub}>
                  Här visas reklam för gratisanvändare
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.adActions}>
              <TouchableOpacity 
                style={styles.upgradeButton}
                onPress={upgradeToPremium}
              >
                <ThemedText style={styles.upgradeButtonText}>
                  ✨ Uppgradera till Premium
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={closeAdModal}
              >
                <ThemedText style={styles.continueButtonText}>
                  Fortsätt med reklam
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockScreen: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 20,
    borderRadius: 15,
  },
  lockTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  lockDescription: {
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  adModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  adTitle: {
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  adContent: {
    padding: 20,
    alignItems: 'center',
  },
  adText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  adSubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 20,
    color: '#333',
  },
  adSpace: {
    width: '100%',
    height: 120,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  adPlaceholder: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
  },
  adPlaceholderSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  adActions: {
    padding: 20,
    gap: 10,
  },
  upgradeButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#666',
    fontSize: 14,
  },
});