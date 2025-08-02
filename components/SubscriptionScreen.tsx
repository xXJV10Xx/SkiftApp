import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import * as WebBrowser from 'expo-web-browser';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface UserData {
  is_premium: boolean;
  has_paid_export: boolean;
  trial_started_at: string;
  premium_type?: string;
  premium_started_at?: string;
}

interface SubscriptionButtonProps {
  title: string;
  price: string;
  type: 'monthly' | 'semiannual' | 'annual' | 'export';
  onPress: () => void;
  disabled?: boolean;
  description?: string;
}

const SubscriptionButton: React.FC<SubscriptionButtonProps> = ({
  title,
  price,
  type,
  onPress,
  disabled = false,
  description
}) => (
  <ThemedView style={[styles.subscriptionButton, disabled && styles.disabledButton]}>
    <Text style={styles.buttonTitle}>{title}</Text>
    <Text style={styles.buttonPrice}>{price}</Text>
    {description && <Text style={styles.buttonDescription}>{description}</Text>}
    <Text 
      style={[styles.selectButton, disabled && styles.disabledButtonText]}
      onPress={disabled ? undefined : onPress}
    >
      {disabled ? 'Redan köpt' : 'Välj'}
    </Text>
  </ThemedView>
);

export default function SubscriptionScreen() {
  const user = useUser();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user?.id]);

  const loadUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_premium, has_paid_export, trial_started_at, premium_type, premium_started_at')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error loading user data:', error);
        Alert.alert('Fel', 'Kunde inte ladda användardata');
        return;
      }

      setUserData(data);
    } catch (error) {
      console.error('Error in loadUserData:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const startCheckout = async (type: 'monthly' | 'semiannual' | 'annual' | 'export') => {
    if (!user?.email || !user?.id) {
      Alert.alert('Fel', 'Du måste vara inloggad för att köpa');
      return;
    }

    setLoading(true);
    
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

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const { url } = await response.json();
      
      if (url) {
        await WebBrowser.openBrowserAsync(url);
        // Uppdatera användardata efter att ha öppnat checkout
        setTimeout(loadUserData, 2000);
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert('Fel', 'Kunde inte starta betalning. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  const showAdPopup = () => {
    Alert.alert(
      'Reklam',
      'Använd gratisversion eller prenumerera för export och reklamfri upplevelse',
      [
        { text: 'Stäng', style: 'cancel' },
        { text: 'Prenumerera', onPress: () => {} }
      ]
    );
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Du måste vara inloggad för att se prenumerationsalternativ</ThemedText>
      </ThemedView>
    );
  }

  if (initialLoading) {
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

  const daysSinceTrial = Math.floor(
    (Date.now() - new Date(userData.trial_started_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const trialDaysLeft = Math.max(0, 7 - daysSinceTrial);
  const isTrialActive = trialDaysLeft > 0;
  const hasAccess = userData.is_premium || isTrialActive;

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Prenumeration
        </ThemedText>

        {/* Status-sektion */}
        <ThemedView style={styles.statusSection}>
          {userData.is_premium ? (
            <View>
              <Text style={styles.statusText}>✅ Premium aktiv</Text>
              <Text style={styles.statusSubtext}>
                Typ: {userData.premium_type || 'Okänd'}
              </Text>
            </View>
          ) : isTrialActive ? (
            <View>
              <Text style={styles.statusText}>🆓 Gratis trial</Text>
              <Text style={styles.statusSubtext}>
                {trialDaysLeft} dagar kvar
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.statusText}>🔒 Prenumeration krävs</Text>
              <Text style={styles.statusSubtext}>
                Din gratis trial har gått ut
              </Text>
            </View>
          )}
        </ThemedView>

        {/* Prenumerationsalternativ */}
        {!userData.is_premium && (
          <ThemedView style={styles.subscriptionsSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Välj prenumeration
            </ThemedText>
            
            <SubscriptionButton
              title="Månatlig"
              price="39 kr/månad"
              type="monthly"
              onPress={() => startCheckout('monthly')}
              description="Ingen bindningstid"
            />
            
            <SubscriptionButton
              title="Halvår"
              price="108 kr (6 månader)"
              type="semiannual"
              onPress={() => startCheckout('semiannual')}
              description="Spara 126 kr"
            />
            
            <SubscriptionButton
              title="Årlig"
              price="205 kr/år"
              type="annual"
              onPress={() => startCheckout('annual')}
              description="Spara 263 kr - Bästa erbjudandet!"
            />
          </ThemedView>
        )}

        {/* Export-sektion */}
        <ThemedView style={styles.exportSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Kalenderexport
          </ThemedText>
          
          <SubscriptionButton
            title="Exportera till kalender"
            price="99 kr"
            type="export"
            onPress={() => startCheckout('export')}
            disabled={userData.has_paid_export}
            description="Engångsköp - Exportera dina skift till Google/Apple kalender"
          />
          
          {userData.has_paid_export && (
            <Text style={styles.exportStatus}>
              ✅ Export tillgänglig
            </Text>
          )}
        </ThemedView>

        {/* Fördelar */}
        <ThemedView style={styles.benefitsSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Premium-fördelar
          </ThemedText>
          
          <Text style={styles.benefit}>✨ Reklamfri upplevelse</Text>
          <Text style={styles.benefit}>📊 Avancerad statistik</Text>
          <Text style={styles.benefit}>🔄 Automatisk synkronisering</Text>
          <Text style={styles.benefit}>🎨 Anpassningsbara teman</Text>
          <Text style={styles.benefit}>📱 Prioriterad support</Text>
        </ThemedView>

        {loading && (
          <ThemedView style={styles.loadingOverlay}>
            <ActivityIndicator size="large" />
            <ThemedText>Öppnar betalning...</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  statusSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  subscriptionsSection: {
    marginBottom: 20,
  },
  exportSection: {
    marginBottom: 20,
  },
  benefitsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  subscriptionButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: '#f0f0f0',
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buttonPrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  selectButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  disabledButtonText: {
    color: '#999',
    backgroundColor: '#f5f5f5',
  },
  exportStatus: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  benefit: {
    fontSize: 16,
    marginBottom: 8,
    paddingLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});