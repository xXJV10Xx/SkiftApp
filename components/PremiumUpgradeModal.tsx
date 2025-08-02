import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  highlightedFeature?: string;
}

const PREMIUM_FEATURES = [
  {
    key: 'calendar_export',
    icon: 'calendar-outline',
    title: 'Kalenderexport',
    description: 'Exportera dina skift till Google Calendar & Apple Calendar',
    highlight: true,
  },
  {
    key: 'auto_sync',
    icon: 'sync-outline',
    title: 'Automatisk synkronisering',
    description: 'Dina skift uppdateras automatiskt',
  },
  {
    key: 'advanced_stats',
    icon: 'stats-chart-outline',
    title: 'Avancerad statistik',
    description: 'Detaljerad statistik över dina arbetstider',
  },
  {
    key: 'custom_themes',
    icon: 'color-palette-outline',
    title: 'Anpassade teman',
    description: 'Personalisera appens utseende',
  },
  {
    key: 'ad_free',
    icon: 'shield-checkmark-outline',
    title: 'Reklamfritt',
    description: 'Ingen reklam i appen',
  },
  {
    key: 'priority_support',
    icon: 'headset-outline',
    title: 'Prioriterad support',
    description: 'Snabbare hjälp och support',
  },
];

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  visible,
  onClose,
  highlightedFeature,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      Alert.alert('Fel', 'Du måste vara inloggad för att köpa Premium');
      return;
    }

    setIsLoading(true);

    try {
      // Anropa din Stripe server för att skapa checkout session
      const response = await fetch('http://localhost:4242/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Öppna Stripe Checkout i webbläsaren
        const supported = await Linking.canOpenURL(data.url);
        if (supported) {
          await Linking.openURL(data.url);
          onClose(); // Stäng modalen när användaren går till checkout
        } else {
          Alert.alert('Fel', 'Kunde inte öppna betalningssidan');
        }
      } else {
        throw new Error('Ingen checkout URL returnerades');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      Alert.alert(
        'Fel',
        'Kunde inte starta betalningsprocessen. Försök igen senare.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={styles.crownIcon}
              >
                <Ionicons name="star" size={32} color="white" />
              </LinearGradient>
              
              <Text style={styles.title}>SkiftApp Premium</Text>
              <Text style={styles.subtitle}>
                Få tillgång till alla premium-funktioner
              </Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>99 kr</Text>
            <Text style={styles.priceDescription}>Engångsbetalning</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Vad ingår:</Text>
            
            {PREMIUM_FEATURES.map((feature) => (
              <View
                key={feature.key}
                style={[
                  styles.featureItem,
                  highlightedFeature === feature.key && styles.highlightedFeature,
                ]}
              >
                <View style={styles.featureIcon}>
                  <Ionicons
                    name={feature.icon as any}
                    size={24}
                    color={highlightedFeature === feature.key ? '#2563eb' : '#64748b'}
                  />
                </View>
                <View style={styles.featureContent}>
                  <Text
                    style={[
                      styles.featureTitle,
                      highlightedFeature === feature.key && styles.highlightedFeatureTitle,
                    ]}
                  >
                    {feature.title}
                  </Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
                {highlightedFeature === feature.key && (
                  <View style={styles.highlightBadge}>
                    <Ionicons name="star" size={16} color="#f59e0b" />
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Benefits */}
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Ionicons name="shield-checkmark" size={20} color="#10b981" />
              <Text style={styles.benefitText}>Säker betalning med Stripe</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="time" size={20} color="#10b981" />
              <Text style={styles.benefitText}>Aktiveras direkt efter köp</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="mail" size={20} color="#10b981" />
              <Text style={styles.benefitText}>E-postbekräftelse</Text>
            </View>
          </View>
        </ScrollView>

        {/* Purchase Button */}
        <View style={styles.purchaseContainer}>
          <TouchableOpacity
            style={[styles.purchaseButton, isLoading && styles.purchaseButtonDisabled]}
            onPress={handleUpgrade}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading ? ['#94a3b8', '#64748b'] : ['#2563eb', '#1d4ed8']}
              style={styles.purchaseButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="card" size={20} color="white" />
              )}
              <Text style={styles.purchaseButtonText}>
                {isLoading ? 'Laddar...' : 'Köp Premium för 99 kr'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.secureText}>
            🔒 Säker betalning • Apple Pay • Google Pay • Kort
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  crownIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  price: {
    fontSize: 48,
    fontWeight: '800',
    color: '#2563eb',
  },
  priceDescription: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  highlightedFeature: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  featureIcon: {
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  highlightedFeatureTitle: {
    color: '#2563eb',
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  highlightBadge: {
    marginLeft: 8,
  },
  benefitsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  purchaseContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  purchaseButton: {
    marginBottom: 12,
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  secureText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});