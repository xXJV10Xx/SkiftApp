import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import * as WebBrowser from 'expo-web-browser';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface UserData {
  is_premium: boolean;
  has_paid_export: boolean;
  trial_started_at: string;
  subscription_type?: string;
  subscription_status?: string;
}

export default function SubscriptionScreen() {
  const user = useUser();
  const supabase = useSupabaseClient();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_premium, has_paid_export, trial_started_at, subscription_type, subscription_status')
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

  const startCheckout = async (type: 'monthly' | 'semiannual' | 'annual' | 'export') => {
    if (!user?.email || !user?.id) {
      Alert.alert('Fel', 'Du måste vara inloggad för att göra ett köp');
      return;
    }

    setProcessingPayment(type);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          type
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Open Stripe Checkout in browser
      await WebBrowser.openBrowserAsync(data.url);
      
      // Refresh user data after potential payment
      setTimeout(() => {
        fetchUserData();
      }, 3000);

    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert('Fel', 'Kunde inte starta betalningen. Försök igen.');
    } finally {
      setProcessingPayment(null);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
        <ThemedText>Laddar...</ThemedText>
      </ThemedView>
    );
  }

  if (!userData) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Kunde inte ladda användardata</ThemedText>
      </ThemedView>
    );
  }

  const trialDays = userData.trial_started_at 
    ? Math.floor((Date.now() - new Date(userData.trial_started_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const trialDaysLeft = Math.max(0, 7 - trialDays);
  const isTrialActive = trialDaysLeft > 0;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">SkiftApp Premium</ThemedText>
        
        {userData.is_premium ? (
          <View style={styles.premiumBadge}>
            <ThemedText style={styles.premiumText}>✨ Premium Aktiv</ThemedText>
            {userData.subscription_type && (
              <ThemedText style={styles.subscriptionDetails}>
                {userData.subscription_type === 'annual' ? 'Årsplan' : 
                 userData.subscription_type === 'semiannual' ? 'Halvårsplan' : 'Månadsplan'}
              </ThemedText>
            )}
          </View>
        ) : isTrialActive ? (
          <View style={styles.trialBadge}>
            <ThemedText style={styles.trialText}>
              🆓 Gratis provperiod: {trialDaysLeft} dag{trialDaysLeft !== 1 ? 'ar' : ''} kvar
            </ThemedText>
          </View>
        ) : (
          <View style={styles.expiredBadge}>
            <ThemedText style={styles.expiredText}>
              🔒 Provperioden har gått ut
            </ThemedText>
          </View>
        )}
      </View>

      {!userData.is_premium && (
        <View style={styles.subscriptionSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Välj din prenumeration
          </ThemedText>
          <ThemedText style={styles.description}>
            Få tillgång till alla funktioner, reklamfri upplevelse och obegränsad export
          </ThemedText>

          <View style={styles.planContainer}>
            <TouchableOpacity
              style={[styles.planButton, styles.monthlyPlan]}
              onPress={() => startCheckout('monthly')}
              disabled={processingPayment === 'monthly'}
            >
              {processingPayment === 'monthly' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <ThemedText style={styles.planTitle}>Månadsvis</ThemedText>
                  <ThemedText style={styles.planPrice}>39 kr/mån</ThemedText>
                  <ThemedText style={styles.planDetails}>Betala månadsvis</ThemedText>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.planButton, styles.semiannualPlan]}
              onPress={() => startCheckout('semiannual')}
              disabled={processingPayment === 'semiannual'}
            >
              {processingPayment === 'semiannual' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <ThemedText style={styles.planTitle}>Halvår</ThemedText>
                  <ThemedText style={styles.planPrice}>108 kr</ThemedText>
                  <ThemedText style={styles.planDetails}>18 kr/mån • Spara 54%</ThemedText>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.planButton, styles.annualPlan, styles.popularPlan]}
              onPress={() => startCheckout('annual')}
              disabled={processingPayment === 'annual'}
            >
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULÄR</Text>
              </View>
              {processingPayment === 'annual' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <ThemedText style={styles.planTitle}>Årlig</ThemedText>
                  <ThemedText style={styles.planPrice}>205 kr/år</ThemedText>
                  <ThemedText style={styles.planDetails}>17 kr/mån • Spara 56%</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.exportSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Kalenderexport
        </ThemedText>
        
        {userData.has_paid_export ? (
          <View style={styles.exportCompleted}>
            <ThemedText style={styles.exportCompletedText}>
              ✅ Export avslutad - Du kan exportera ditt schema
            </ThemedText>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.exportButton, userData.is_premium && styles.exportButtonPremium]}
            onPress={() => startCheckout('export')}
            disabled={processingPayment === 'export'}
          >
            {processingPayment === 'export' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <ThemedText style={styles.exportButtonText}>
                  Exportera till kalender
                </ThemedText>
                <ThemedText style={styles.exportButtonPrice}>
                  {userData.is_premium ? 'Inkluderat i Premium' : '99 kr engångsavgift'}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.features}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Premium-funktioner
        </ThemedText>
        <View style={styles.featureList}>
          <ThemedText style={styles.feature}>✨ Reklamfri upplevelse</ThemedText>
          <ThemedText style={styles.feature}>📅 Obegränsad kalenderexport</ThemedText>
          <ThemedText style={styles.feature}>🔄 Automatisk synkronisering</ThemedText>
          <ThemedText style={styles.feature}>📱 Prioriterad support</ThemedText>
          <ThemedText style={styles.feature}>🎨 Anpassade teman</ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  premiumBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 10,
  },
  premiumText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subscriptionDetails: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  trialBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 10,
  },
  trialText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  expiredBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 10,
  },
  expiredText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subscriptionSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  planContainer: {
    gap: 15,
  },
  planButton: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    position: 'relative',
  },
  monthlyPlan: {
    backgroundColor: '#2196F3',
  },
  semiannualPlan: {
    backgroundColor: '#FF9800',
  },
  annualPlan: {
    backgroundColor: '#4CAF50',
  },
  popularPlan: {
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  planTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  planPrice: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  planDetails: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
  exportSection: {
    marginBottom: 30,
  },
  exportCompleted: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  exportCompletedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  exportButton: {
    backgroundColor: '#FF5722',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  exportButtonPremium: {
    backgroundColor: '#4CAF50',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exportButtonPrice: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
    opacity: 0.9,
  },
  features: {
    marginTop: 20,
  },
  featureList: {
    gap: 8,
  },
  feature: {
    fontSize: 16,
    lineHeight: 24,
  },
});