import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePremium } from '../context/PremiumContext';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface AdBannerProps {
  position?: 'top' | 'bottom' | 'inline';
  style?: any;
}

const mockAds = [
  {
    id: 1,
    title: 'Spara tid med Premium',
    description: 'Få e-postnotiser för dina skift automatiskt',
    cta: 'Prova gratis',
    color: ['#667eea', '#764ba2']
  },
  {
    id: 2, 
    title: 'Ingen mer reklam',
    description: 'Uppgradera till Premium för reklamfri upplevelse',
    cta: 'Uppgradera nu',
    color: ['#f093fb', '#f5576c']
  },
  {
    id: 3,
    title: 'Exportera till kalender',
    description: 'Synka dina skift med Google Calendar, Outlook m.m.',
    cta: 'Läs mer',
    color: ['#4facfe', '#00f2fe']
  },
  {
    id: 4,
    title: 'Avancerad statistik',
    description: 'Se detaljerad statistik över dina arbetstimmar',
    cta: 'Visa exempel',
    color: ['#43e97b', '#38f9d7']
  }
];

export default function AdBanner({ position = 'bottom', style }: AdBannerProps) {
  const { isPremium } = usePremium();
  const [currentAd, setCurrentAd] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isPremium) return;

    const interval = setInterval(() => {
      Animated.fadeOut(fadeAnim, { duration: 300, useNativeDriver: true }).start(() => {
        setCurrentAd((prev) => (prev + 1) % mockAds.length);
        Animated.fadeIn(fadeAnim, { duration: 300, useNativeDriver: true }).start();
      });
    }, 8000); // Byt reklam var 8:e sekund

    return () => clearInterval(interval);
  }, [isPremium, fadeAnim]);

  const handleAdClick = () => {
    router.push('/subscription');
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Visa inte reklam för premium-användare
  if (isPremium || !isVisible) {
    return null;
  }

  const ad = mockAds[currentAd];

  return (
    <Animated.View 
      style={[
        styles.container,
        position === 'top' && styles.topPosition,
        position === 'bottom' && styles.bottomPosition,
        position === 'inline' && styles.inlinePosition,
        style,
        { opacity: fadeAnim }
      ]}
    >
      <TouchableOpacity 
        style={styles.adContainer}
        onPress={handleAdClick}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={ad.color}
          style={styles.adGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.adContent}>
            <View style={styles.adText}>
              <Text style={styles.adTitle}>{ad.title}</Text>
              <Text style={styles.adDescription}>{ad.description}</Text>
            </View>
            
            <View style={styles.adAction}>
              <Text style={styles.adCta}>{ad.cta}</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </View>
          </View>

          <View style={styles.premiumBadge}>
            <Ionicons name="diamond" size={12} color="white" />
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.closeButton}
        onPress={handleClose}
      >
        <Ionicons name="close" size={16} color="#666" />
      </TouchableOpacity>

      <View style={styles.adIndicator}>
        <Text style={styles.adLabel}>Reklam</Text>
        <View style={styles.dots}>
          {mockAds.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentAd === index && styles.activeDot
              ]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

// Komponent för att visa reklam mellan innehåll
export function InlineAd({ style }: { style?: any }) {
  return <AdBanner position="inline" style={style} />;
}

// Komponent för att visa reklam i botten av skärmen
export function BottomAd() {
  return <AdBanner position="bottom" />;
}

// Komponent för att visa reklam i toppen av skärmen  
export function TopAd() {
  return <AdBanner position="top" />;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  topPosition: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomPosition: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  inlinePosition: {
    marginVertical: 16,
  },
  adContainer: {
    margin: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  adGradient: {
    padding: 16,
    minHeight: 80,
    position: 'relative',
  },
  adContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adText: {
    flex: 1,
    marginRight: 12,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  adDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  adAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  adCta: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  premiumText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 4,
    zIndex: 10,
  },
  adIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  adLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.7)',
    marginRight: 6,
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 1,
  },
  activeDot: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});