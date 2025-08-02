import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePremium } from '../context/PremiumContext';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface PremiumLockProps {
  children: React.ReactNode;
  feature: string;
  description?: string;
  showModal?: boolean;
  onModalClose?: () => void;
}

export default function PremiumLock({ 
  children, 
  feature, 
  description,
  showModal = false,
  onModalClose
}: PremiumLockProps) {
  const { isPremium, trialDaysLeft } = usePremium();
  const [modalVisible, setModalVisible] = React.useState(false);

  React.useEffect(() => {
    if (showModal) {
      setModalVisible(true);
    }
  }, [showModal]);

  const handleModalClose = () => {
    setModalVisible(false);
    onModalClose?.();
  };

  const handleUpgrade = () => {
    handleModalClose();
    router.push('/subscription');
  };

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <>
      <View style={styles.lockedContainer}>
        <View style={styles.lockedOverlay}>
          <LinearGradient
            colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
            style={styles.lockGradient}
          >
            <Ionicons name="lock-closed" size={32} color="white" />
            <Text style={styles.lockTitle}>Premium-funktion</Text>
            <Text style={styles.lockDescription}>
              {description || `${feature} kräver Premium`}
            </Text>
            
            {trialDaysLeft !== null && trialDaysLeft > 0 && (
              <View style={styles.trialBadge}>
                <Text style={styles.trialText}>
                  {trialDaysLeft} dagar kvar av trial
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.upgradeButtonText}>Uppgradera nu</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
        
        <View style={styles.blurredContent}>
          {children}
        </View>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleModalClose}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>

            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modalHeader}
            >
              <Ionicons name="diamond" size={48} color="white" />
              <Text style={styles.modalTitle}>Uppgradera till Premium</Text>
            </LinearGradient>

            <View style={styles.modalBody}>
              <Text style={styles.featureTitle}>{feature}</Text>
              <Text style={styles.featureDescription}>
                {description || `För att använda ${feature} behöver du Premium.`}
              </Text>

              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.benefitText}>Ingen reklam</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.benefitText}>Obegränsade funktioner</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.benefitText}>E-postnotiser</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.benefitText}>Premium support</Text>
                </View>
              </View>

              {trialDaysLeft !== null && trialDaysLeft > 0 && (
                <View style={styles.trialInfo}>
                  <Ionicons name="time" size={16} color="#FF9800" />
                  <Text style={styles.trialInfoText}>
                    {trialDaysLeft} dagar kvar av din gratis trial
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.premiumButton}
                onPress={handleUpgrade}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.premiumButtonGradient}
                >
                  <Text style={styles.premiumButtonText}>
                    Få Premium från 17 kr/månad
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="white" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.laterButton}
                onPress={handleModalClose}
              >
                <Text style={styles.laterButtonText}>Kanske senare</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  lockedContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockGradient: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  lockTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    marginBottom: 4,
  },
  lockDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 12,
  },
  trialBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  trialText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  blurredContent: {
    opacity: 0.3,
    backgroundColor: '#f5f5f5',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 8,
  },
  modalHeader: {
    padding: 32,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
  },
  modalBody: {
    padding: 24,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  benefitsList: {
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  trialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  trialInfoText: {
    fontSize: 14,
    color: '#F57C00',
    marginLeft: 8,
    fontWeight: '500',
  },
  modalActions: {
    padding: 24,
    paddingTop: 0,
  },
  premiumButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  premiumButtonGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  laterButton: {
    padding: 16,
    alignItems: 'center',
  },
  laterButtonText: {
    color: '#666',
    fontSize: 16,
  },
});