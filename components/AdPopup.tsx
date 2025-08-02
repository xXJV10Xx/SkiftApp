import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { PremiumUpgradeModal } from './PremiumUpgradeModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AdPopupProps {
  visible: boolean;
  onClose: () => void;
  adType?: 'premium_upgrade' | 'feature_unlock' | 'general';
  targetFeature?: string;
}

const AD_CONTENT = {
  premium_upgrade: {
    title: '🚀 Uppgradera till Premium!',
    subtitle: 'Få tillgång till alla funktioner',
    description: 'Kalenderexport, avancerad statistik och mycket mer!',
    buttonText: 'Köp Premium - 99 kr',
    backgroundColor: ['#2563eb', '#1d4ed8'],
  },
  feature_unlock: {
    title: '🔓 Lås upp denna funktion',
    subtitle: 'Premium krävs för denna funktion',
    description: 'Få tillgång till kalenderexport och alla andra premium-funktioner',
    buttonText: 'Uppgradera nu',
    backgroundColor: ['#7c3aed', '#5b21b6'],
  },
  general: {
    title: '⭐ Prova Premium gratis!',
    subtitle: 'Se alla dina skift i kalendern',
    description: 'Exportera till Google Calendar & Apple Calendar',
    buttonText: 'Starta Premium',
    backgroundColor: ['#059669', '#047857'],
  },
};

export const AdPopup: React.FC<AdPopupProps> = ({
  visible,
  onClose,
  adType = 'general',
  targetFeature,
}) => {
  const { isPremium } = usePremiumStatus();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);

  const adContent = AD_CONTENT[adType];

  // Countdown timer before user can close ad
  useEffect(() => {
    if (!visible) return;

    setCountdown(5);
    setCanClose(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanClose(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible]);

  // Don't show ads to premium users
  if (isPremium) {
    return null;
  }

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
    onClose();
  };

  const handleClose = () => {
    if (canClose) {
      onClose();
    } else {
      Alert.alert(
        'Vänta lite till',
        `Du kan stänga reklamen om ${countdown} sekunder`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            {/* Close button */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                !canClose && styles.closeButtonDisabled,
              ]}
              onPress={handleClose}
              disabled={!canClose}
            >
              {canClose ? (
                <Ionicons name="close" size={24} color="#64748b" />
              ) : (
                <Text style={styles.countdownText}>{countdown}</Text>
              )}
            </TouchableOpacity>

            {/* Ad Content */}
            <LinearGradient
              colors={adContent.backgroundColor}
              style={styles.content}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons name="star" size={40} color="white" />
                </View>
                <Text style={styles.title}>{adContent.title}</Text>
                <Text style={styles.subtitle}>{adContent.subtitle}</Text>
              </View>

              {/* Features Preview */}
              <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                  <Ionicons name="calendar" size={20} color="white" />
                  <Text style={styles.featureText}>Kalenderexport</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="stats-chart" size={20} color="white" />
                  <Text style={styles.featureText}>Avancerad statistik</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="shield-checkmark" size={20} color="white" />
                  <Text style={styles.featureText}>Reklamfritt</Text>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.description}>{adContent.description}</Text>

              {/* Price */}
              <View style={styles.priceContainer}>
                <Text style={styles.price}>99 kr</Text>
                <Text style={styles.priceSubtext}>Engångsbetalning</Text>
              </View>

              {/* CTA Button */}
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={handleUpgrade}
              >
                <View style={styles.ctaButtonContent}>
                  <Ionicons name="arrow-up" size={20} color="#2563eb" />
                  <Text style={styles.ctaButtonText}>
                    {adContent.buttonText}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Trust indicators */}
              <View style={styles.trustIndicators}>
                <View style={styles.trustItem}>
                  <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.trustText}>Säker betalning</Text>
                </View>
                <View style={styles.trustItem}>
                  <Ionicons name="time" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.trustText}>Aktiveras direkt</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      <PremiumUpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        highlightedFeature={targetFeature}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: Math.min(screenWidth - 40, 400),
    maxHeight: screenHeight - 100,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButtonDisabled: {
    backgroundColor: '#f3f4f6',
  },
  countdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  content: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
  },
  priceSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  ctaButton: {
    width: '100%',
    marginBottom: 20,
  },
  ctaButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 8,
  },
  trustIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
});