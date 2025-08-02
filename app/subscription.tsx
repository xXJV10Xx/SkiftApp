import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { usePremium } from '../context/PremiumContext';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const plans = [
  {
    id: 'monthly',
    name: 'Månad',
    price: '39 kr',
    period: '/månad',
    description: 'Perfekt för att testa',
    color: ['#667eea', '#764ba2'],
    popular: false
  },
  {
    id: 'semiannual',
    name: 'Halvår',
    price: '108 kr',
    period: '/6 månader',
    description: 'Spara 5% • 18 kr/månad',
    color: ['#f093fb', '#f5576c'],
    popular: true
  },
  {
    id: 'annual',
    name: 'År',
    price: '205 kr',
    period: '/år',
    description: 'Spara 10% • 17 kr/månad',
    color: ['#4facfe', '#00f2fe'],
    popular: false
  }
];

const features = [
  { icon: 'notifications-off', text: 'Ingen reklam' },
  { icon: 'calendar', text: 'Obegränsade scheman' },
  { icon: 'mail', text: 'E-postnotiser för skift' },
  { icon: 'download', text: 'Exportera till kalender' },
  { icon: 'analytics', text: 'Avancerad statistik' },
  { icon: 'color-palette', text: 'Anpassade teman' }
];

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const { isPremium, subscription, trialDaysLeft, isLoading } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState('semiannual');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      Alert.alert('Fel', 'Du måste vara inloggad för att prenumerera');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://your-server.com/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planId,
          user_id: user.id
        }),
      });

      const data = await response.json();
      
      if (data.session_url) {
        await WebBrowser.openBrowserAsync(data.session_url);
      } else {
        throw new Error('Kunde inte skapa betalningssession');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Fel', 'Kunde inte starta betalningen. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const renderPlanCard = (plan: typeof plans[0]) => (
    <TouchableOpacity
      key={plan.id}
      style={[
        styles.planCard,
        selectedPlan === plan.id && styles.selectedPlan
      ]}
      onPress={() => setSelectedPlan(plan.id)}
    >
      <LinearGradient
        colors={plan.color}
        style={styles.planGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {plan.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>POPULÄRAST</Text>
          </View>
        )}
        
        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planPrice}>{plan.price}</Text>
        <Text style={styles.planPeriod}>{plan.period}</Text>
        <Text style={styles.planDescription}>{plan.description}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Laddar prenumerationsstatus...</Text>
      </View>
    );
  }

  if (isPremium) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.premiumContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.premiumHeader}
          >
            <Ionicons name="checkmark-circle" size={64} color="white" />
            <Text style={styles.premiumTitle}>Du har Premium!</Text>
            <Text style={styles.premiumSubtitle}>
              {subscription?.is_active 
                ? `Aktiv ${subscription.plan}-prenumeration`
                : `Trial aktiv i ${trialDaysLeft} dagar`
              }
            </Text>
          </LinearGradient>

          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Dina Premium-funktioner:</Text>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons name={feature.icon as any} size={24} color="#667eea" />
                <Text style={styles.featureText}>{feature.text}</Text>
                <Ionicons name="checkmark" size={20} color="#4CAF50" />
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.manageButtonText}>Hantera prenumeration</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.title}>Uppgradera till Premium</Text>
        <Text style={styles.subtitle}>
          {trialDaysLeft !== null 
            ? `${trialDaysLeft} dagar kvar av din trial`
            : 'Få tillgång till alla funktioner'
          }
        </Text>
      </LinearGradient>

      <View style={styles.plansContainer}>
        <Text style={styles.plansTitle}>Välj ditt abonnemang:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.plansScroll}
        >
          {plans.map(renderPlanCard)}
        </ScrollView>
      </View>

      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Vad ingår i Premium:</Text>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Ionicons name={feature.icon as any} size={24} color="#667eea" />
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.subscribeButton, loading && styles.disabledButton]}
        onPress={() => handleSubscribe(selectedPlan)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Text style={styles.subscribeButtonText}>
              Starta prenumeration
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Avbryt när som helst. Ingen bindningstid. Säker betalning via Stripe.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  plansContainer: {
    padding: 20,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  plansScroll: {
    paddingHorizontal: 4,
  },
  planCard: {
    width: width * 0.7,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  selectedPlan: {
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  planGradient: {
    padding: 20,
    minHeight: 160,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  planPeriod: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  featuresContainer: {
    padding: 20,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: '#555',
    marginLeft: 12,
  },
  subscribeButton: {
    backgroundColor: '#667eea',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  disclaimer: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    lineHeight: 18,
  },
  premiumContainer: {
    flex: 1,
  },
  premiumHeader: {
    padding: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  manageButton: {
    backgroundColor: '#667eea',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  manageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});