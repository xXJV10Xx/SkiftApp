import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import PaymentCard from '../../components/PaymentCard';
import SubscriptionPlanCard from '../../components/SubscriptionPlanCard';
import { paymentService, type SubscriptionData } from '../../lib/payment-service';
import { 
  SUBSCRIPTION_PLANS, 
  STRIPE_PUBLISHABLE_KEY, 
  initializeStripe,
  formatCurrency 
} from '../../lib/stripe';

// Mock company ID - in real app, get from auth context
const MOCK_COMPANY_ID = 'company-123';

export default function SubscriptionScreen() {
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [stripeInitialized, setStripeInitialized] = useState(false);
  const [paymentStats, setPaymentStats] = useState<{
    totalRevenue: number;
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    averagePayment: number;
  } | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await initializeStripe();
      setStripeInitialized(true);
      await loadSubscriptionData();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      Alert.alert('Fel', 'Kunde inte ladda prenumerationsdata');
    }
  };

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Load current subscription
      const subscription = await paymentService.getCompanySubscription(MOCK_COMPANY_ID);
      setCurrentSubscription(subscription);

      // Load payment statistics
      const stats = await paymentService.getPaymentStatistics(MOCK_COMPANY_ID);
      setPaymentStats(stats);

    } catch (error) {
      console.error('Failed to load subscription data:', error);
      Alert.alert('Fel', 'Kunde inte ladda prenumerationsdata');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSubscriptionData();
    setRefreshing(false);
  };

  const handlePlanSelect = (planId: string) => {
    if (currentSubscription?.planName.toLowerCase() === planId) {
      return; // Can't select current plan
    }
    setSelectedPlanId(planId);
  };

  const handleSubscribe = () => {
    if (!selectedPlanId) {
      Alert.alert('Fel', 'Vänligen välj en prenumerationsplan');
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      setShowPayment(false);
      setSelectedPlanId(null);
      
      Alert.alert(
        'Betalning genomförd!', 
        'Din prenumeration har aktiverats.',
        [{ text: 'OK', onPress: () => loadSubscriptionData() }]
      );
    } catch (error) {
      console.error('Payment success handler error:', error);
    }
  };

  const handlePaymentError = (error: string) => {
    setShowPayment(false);
    Alert.alert('Betalning misslyckades', error);
  };

  const handleCancelSubscription = () => {
    if (!currentSubscription) return;

    Alert.alert(
      'Avsluta prenumeration',
      'Är du säker på att du vill avsluta din prenumeration? Den kommer att vara aktiv till slutet av nuvarande period.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Avsluta',
          style: 'destructive',
          onPress: async () => {
            try {
              await paymentService.cancelCompanySubscription(currentSubscription.id);
              Alert.alert('Prenumeration avslutad', 'Din prenumeration kommer att avslutas vid slutet av nuvarande period.');
              loadSubscriptionData();
            } catch (error) {
              Alert.alert('Fel', 'Kunde inte avsluta prenumerationen');
            }
          },
        },
      ]
    );
  };

  const navigateToPaymentHistory = () => {
    router.push('/payments/history');
  };

  const navigateToInvoices = () => {
    router.push('/payments/invoices');
  };

  const getSelectedPlan = () => {
    return SUBSCRIPTION_PLANS.find(plan => plan.id === selectedPlanId);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Laddar prenumerationsdata...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!stripeInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>Kunde inte initialisera betalningssystem</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY!}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Prenumeration</Text>
            <Text style={styles.subtitle}>
              Hantera din Skiftappen-prenumeration
            </Text>
          </View>

          {/* Current Subscription */}
          {currentSubscription && (
            <View style={styles.currentSubscriptionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Nuvarande prenumeration</Text>
                <TouchableOpacity onPress={handleCancelSubscription}>
                  <Text style={styles.cancelButton}>Avsluta</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.currentSubscriptionCard}>
                <View style={styles.subscriptionInfo}>
                  <Text style={styles.currentPlanName}>{currentSubscription.planName}</Text>
                  <Text style={styles.currentPlanPrice}>
                    {formatCurrency(currentSubscription.planPrice, 'SEK')}/månad
                  </Text>
                  <Text style={styles.subscriptionStatus}>
                    Status: {currentSubscription.status === 'active' ? 'Aktiv' : currentSubscription.status}
                  </Text>
                  <Text style={styles.subscriptionPeriod}>
                    Nästa betalning: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('sv-SE')}
                  </Text>
                  {currentSubscription.cancelAtPeriodEnd && (
                    <Text style={styles.cancelNotice}>
                      ⚠️ Prenumerationen avslutas {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('sv-SE')}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Payment Statistics */}
          {paymentStats && (
            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>Betalningsstatistik</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {formatCurrency(paymentStats.totalRevenue, 'SEK')}
                  </Text>
                  <Text style={styles.statLabel}>Total omsättning</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{paymentStats.successfulPayments}</Text>
                  <Text style={styles.statLabel}>Genomförda betalningar</Text>
                </View>
              </View>
              
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionButton} onPress={navigateToPaymentHistory}>
                  <Ionicons name="card" size={20} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Betalningshistorik</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={navigateToInvoices}>
                  <Ionicons name="document-text" size={20} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Fakturor</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Subscription Plans */}
          <View style={styles.plansContainer}>
            <Text style={styles.sectionTitle}>
              {currentSubscription ? 'Byt prenumerationsplan' : 'Välj prenumerationsplan'}
            </Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.plansScrollView}>
              {SUBSCRIPTION_PLANS.map((plan) => (
                <View key={plan.id} style={styles.planCardContainer}>
                  <SubscriptionPlanCard
                    plan={plan}
                    isSelected={selectedPlanId === plan.id}
                    isCurrentPlan={currentSubscription?.planName.toLowerCase() === plan.id}
                    onSelect={handlePlanSelect}
                  />
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Subscribe Button */}
          {selectedPlanId && !showPayment && (
            <View style={styles.subscribeContainer}>
              <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
                <Text style={styles.subscribeButtonText}>
                  {currentSubscription ? 'Byt till denna plan' : 'Välj denna plan'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Payment Component */}
          {showPayment && selectedPlanId && (
            <PaymentCard
              amount={getSelectedPlan()?.price || 0}
              currency="SEK"
              companyId={MOCK_COMPANY_ID}
              description={`${getSelectedPlan()?.name} prenumeration`}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  currentSubscriptionContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
  },
  currentSubscriptionCard: {
    backgroundColor: '#F8FFF8',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  subscriptionInfo: {
    gap: 4,
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  currentPlanPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  subscriptionStatus: {
    fontSize: 14,
    color: '#666',
  },
  subscriptionPeriod: {
    fontSize: 14,
    color: '#666',
  },
  cancelNotice: {
    fontSize: 14,
    color: '#FF9800',
    marginTop: 8,
  },
  statsContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FBFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontWeight: '500',
  },
  plansContainer: {
    marginVertical: 16,
  },
  plansScrollView: {
    paddingLeft: 16,
  },
  planCardContainer: {
    width: 280,
  },
  subscribeContainer: {
    padding: 16,
  },
  subscribeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});