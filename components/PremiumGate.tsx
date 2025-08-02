import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePremiumStatus } from '../hooks/usePremiumStatus';
import { PremiumUpgradeModal } from './PremiumUpgradeModal';

interface PremiumGateProps {
  children: React.ReactNode;
  feature: 'calendar_export' | 'advanced_stats' | 'custom_themes' | 'auto_sync';
  featureName: string;
  description?: string;
  showUpgradeButton?: boolean;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  children,
  feature,
  featureName,
  description,
  showUpgradeButton = true,
}) => {
  const { isPremium, loading } = usePremiumStatus();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Om användaren är premium, visa innehållet direkt
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Laddar...</Text>
      </View>
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  // Om inte premium, visa låst innehåll
  return (
    <>
      <View style={styles.lockedContainer}>
        <LinearGradient
          colors={['rgba(37, 99, 235, 0.1)', 'rgba(37, 99, 235, 0.05)']}
          style={styles.gradient}
        >
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={24} color="#2563eb" />
          </View>
          
          <Text style={styles.featureTitle}>{featureName}</Text>
          
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
          
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
          
          {showUpgradeButton && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => setShowUpgradeModal(true)}
            >
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                style={styles.upgradeButtonGradient}
              >
                <Ionicons name="arrow-up" size={18} color="white" />
                <Text style={styles.upgradeButtonText}>Uppgradera till Premium</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {/* Blurred preview of locked content */}
          <View style={styles.previewContainer}>
            <View style={styles.blurOverlay}>
              {children}
            </View>
          </View>
        </LinearGradient>
      </View>

      <PremiumUpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        highlightedFeature={feature}
      />
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  lockedContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gradient: {
    padding: 20,
    alignItems: 'center',
  },
  lockIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
    marginLeft: 4,
  },
  upgradeButton: {
    width: '100%',
    marginBottom: 20,
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  previewContainer: {
    width: '100%',
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  blurOverlay: {
    opacity: 0.3,
    transform: [{ scale: 0.95 }],
  },
});