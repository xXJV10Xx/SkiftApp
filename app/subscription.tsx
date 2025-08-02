import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../context/SubscriptionContext';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

const PLANS = [
  {
    id: 'monthly',
    name: 'Månad',
    price: '39 kr',
    period: '/månad',
    savings: null,
    popular: false,
    features: [
      'Alla premium-funktioner',
      'Obegränsade skiftscheman',
      'Avancerad rapportering',
      'Prioriterat stöd',
      'Ingen reklam'
    ]
  },
  {
    id: 'semiannual',
    name: 'Halvår',
    price: '108 kr',
    period: '/6 månader',
    savings: 'Spara 5%',
    popular: true,
    features: [
      'Alla premium-funktioner',
      'Obegränsade skiftscheman',
      'Avancerad rapportering',
      'Prioriterat stöd',
      'Ingen reklam',
      '💰 Spara 5% jämfört med månad'
    ]
  },
  {
    id: 'annual',
    name: 'År',
    price: '205 kr',
    period: '/år',
    savings: 'Spara 10%',
    popular: false,
    bestValue: true,
    features: [
      'Alla premium-funktioner',
      'Obegränsade skiftscheman',
      'Avancerad rapportering',
      'Prioriterat stöd',
      'Ingen reklam',
      '🎉 Spara 10% jämfört med månad',
      '🏆 Bästa värdet'
    ]
  }
];

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState('semiannual');
  const [isLoading, setIsLoading] = useState(false);
  const { subscription, isPremium, isTrialActive, trialDaysLeft, createCheckoutSession } = useSubscription();
  const router = useRouter();

  const handleSubscribe = async (planId: string) => {
    setIsLoading(true);
    try {
      const sessionUrl = await createCheckoutSession(planId as 'monthly' | 'semiannual' | 'annual');
      await WebBrowser.openBrowserAsync(sessionUrl);
    } catch (error) {
      Alert.alert('Fel', 'Kunde inte öppna betalningssidan. Försök igen.');
      console.error('Error creating checkout session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Uppgradera till Premium</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.heroSection}>
          <Ionicons name="star" size={48} color="#FFD700" />
          <Text style={styles.heroTitle}>Skiftappen Premium</Text>
          <Text style={styles.heroSubtitle}>
            Få tillgång till alla funktioner och ta bort reklam
          </Text>
          
          {isTrialActive && (
            <View style={styles.trialBanner}>
              <Text style={styles.trialText}>
                🎉 {trialDaysLeft} dagar kvar av din gratis provperiod
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Vad ingår i Premium?</Text>
          
          <View style={styles.benefitsList}>
            {[
              { icon: 'calendar', title: 'Obegränsade skiftscheman', description: 'Skapa och hantera så många scheman du vill' },
              { icon: 'bar-chart', title: 'Avancerad rapportering', description: 'Detaljerade rapporter och statistik' },
              { icon: 'people', title: 'Team-funktioner', description: 'Hantera team och medarbetare enkelt' },
              { icon: 'notifications', title: 'Prioriterat stöd', description: 'Få hjälp snabbare när du behöver det' },
              { icon: 'close-circle', title: 'Ingen reklam', description: 'Använd appen utan störande annonser' },
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Ionicons name={benefit.icon as any} size={24} color="#667eea" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDescription}>{benefit.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Välj ditt abonnemang</Text>
          
          {PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.selectedPlan,
                plan.popular && styles.popularPlan,
                plan.bestValue && styles.bestValuePlan
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>POPULÄR</Text>
                </View>
              )}
              {plan.bestValue && (
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueBadgeText}>BÄST VÄRDE</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View style={styles.planTitleSection}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {plan.savings && (
                    <Text style={styles.planSavings}>{plan.savings}</Text>
                  )}
                </View>
                <View style={styles.planPriceSection}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
              </View>

              <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {selectedPlan === plan.id && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="radio-button-on" size={20} color="#667eea" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.subscribeButton, isLoading && styles.subscribeButtonDisabled]}
            onPress={() => handleSubscribe(selectedPlan)}
            disabled={isLoading || isPremium}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.subscribeButtonText}>
                  {isPremium ? 'Redan Premium' : 'Starta 7 dagar gratis'}
                </Text>
                {!isPremium && (
                  <Text style={styles.subscribeButtonSubtext}>
                    Sedan {PLANS.find(p => p.id === selectedPlan)?.price} {PLANS.find(p => p.id === selectedPlan)?.period}
                  </Text>
                )}
              </>
            )}
          </TouchableOpacity>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              • Avbryt när som helst{'\n'}
              • Säker betalning via Stripe{'\n'}
              • Apple Pay & Google Pay stöds{'\n'}
              • Ingen bindningstid
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  trialBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  trialText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
  },
  benefitsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  plansSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    position: 'relative',
  },
  selectedPlan: {
    borderColor: '#667eea',
    backgroundColor: '#f8f9ff',
  },
  popularPlan: {
    borderColor: '#ffc107',
  },
  bestValuePlan: {
    borderColor: '#28a745',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#ffc107',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planTitleSection: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  planSavings: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
  },
  planPriceSection: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  planPeriod: {
    fontSize: 14,
    color: '#666',
  },
  planFeatures: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  actionSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  subscribeButton: {
    backgroundColor: '#667eea',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  subscribeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subscribeButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  disclaimer: {
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});