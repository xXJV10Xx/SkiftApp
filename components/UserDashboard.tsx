import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../lib/supabase';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  description?: string;
  location?: string;
  calendar_type: 'google' | 'apple' | 'skiftapp';
  is_synced: boolean;
}

interface CalendarSync {
  id: string;
  user_id: string;
  calendar_type: 'google' | 'apple';
  is_enabled: boolean;
  last_sync: string;
  sync_frequency: 'hourly' | 'daily' | 'weekly';
  access_token?: string;
  refresh_token?: string;
}

export const UserDashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarSyncs, setCalendarSyncs] = useState<CalendarSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadUserData();
    loadCalendarSyncs();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarSyncs = async () => {
    try {
      const { data: syncs } = await supabase
        .from('calendar_syncs')
        .select('*')
        .eq('user_id', user?.id);
      
      if (syncs) {
        setCalendarSyncs(syncs);
      }
    } catch (error) {
      console.error('Error loading calendar syncs:', error);
    }
  };

  const handleGoogleCalendarSync = async () => {
    try {
      setSyncing(true);
      
      // Simulera Google Calendar OAuth
      Alert.alert(
        'Google Kalender',
        'Du kommer att omdirigeras till Google för att ge tillstånd till kalendersynkronisering.',
        [
          { text: 'Avbryt', style: 'cancel' },
          { 
            text: 'Fortsätt', 
            onPress: () => {
              // Här skulle du implementera Google Calendar OAuth
              simulateGoogleCalendarSync();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Google Calendar sync error:', error);
      Alert.alert('Fel', 'Kunde inte synka med Google Kalender');
    } finally {
      setSyncing(false);
    }
  };

  const handleAppleCalendarSync = async () => {
    try {
      setSyncing(true);
      
      // Simulera Apple Calendar OAuth
      Alert.alert(
        'Apple Kalender',
        'Du kommer att omdirigeras till Apple för att ge tillstånd till kalendersynkronisering.',
        [
          { text: 'Avbryt', style: 'cancel' },
          { 
            text: 'Fortsätt', 
            onPress: () => {
              // Här skulle du implementera Apple Calendar OAuth
              simulateAppleCalendarSync();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Apple Calendar sync error:', error);
      Alert.alert('Fel', 'Kunde inte synka med Apple Kalender');
    } finally {
      setSyncing(false);
    }
  };

  const simulateGoogleCalendarSync = async () => {
    // Simulera synkronisering
    setTimeout(async () => {
      try {
        // Skapa eller uppdatera sync-posten
        const syncData = {
          user_id: user?.id,
          calendar_type: 'google',
          is_enabled: true,
          last_sync: new Date().toISOString(),
          sync_frequency: 'hourly'
        };

        const { data, error } = await supabase
          .from('calendar_syncs')
          .upsert(syncData)
          .select();

        if (error) throw error;

        Alert.alert('Framgång', 'Google Kalender synkroniserad!');
        loadCalendarSyncs();
      } catch (error) {
        console.error('Sync error:', error);
        Alert.alert('Fel', 'Kunde inte synka kalender');
      }
    }, 2000);
  };

  const simulateAppleCalendarSync = async () => {
    // Simulera synkronisering
    setTimeout(async () => {
      try {
        // Skapa eller uppdatera sync-posten
        const syncData = {
          user_id: user?.id,
          calendar_type: 'apple',
          is_enabled: true,
          last_sync: new Date().toISOString(),
          sync_frequency: 'hourly'
        };

        const { data, error } = await supabase
          .from('calendar_syncs')
          .upsert(syncData)
          .select();

        if (error) throw error;

        Alert.alert('Framgång', 'Apple Kalender synkroniserad!');
        loadCalendarSyncs();
      } catch (error) {
        console.error('Sync error:', error);
        Alert.alert('Fel', 'Kunde inte synka kalender');
      }
    }, 2000);
  };

  const toggleSync = async (syncId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('calendar_syncs')
        .update({ is_enabled: enabled })
        .eq('id', syncId);

      if (error) throw error;

      loadCalendarSyncs();
    } catch (error) {
      console.error('Error toggling sync:', error);
      Alert.alert('Fel', 'Kunde inte uppdatera synkronisering');
    }
  };

  const getSyncStatus = (sync: CalendarSync) => {
    if (!sync.is_enabled) return 'Inaktiverad';
    
    const lastSync = new Date(sync.last_sync);
    const now = new Date();
    const diffHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'Senast synkad: Nu';
    if (diffHours < 24) return `Senast synkad: ${Math.round(diffHours)}h sedan`;
    return `Senast synkad: ${Math.round(diffHours / 24)}d sedan`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Laddar användardata...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Min Dashboard</Text>
        <Text style={styles.subtitle}>Välkommen, {user?.email}</Text>
      </View>

      {/* Kalendersynkronisering */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kalendersynkronisering</Text>
        
        {/* Google Calendar */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarName}>Google Kalender</Text>
            <TouchableOpacity
              style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
              onPress={handleGoogleCalendarSync}
              disabled={syncing}
            >
              <Text style={styles.syncButtonText}>
                {syncing ? 'Synkar...' : 'Synka'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {calendarSyncs.find(s => s.calendar_type === 'google') && (
            <View style={styles.syncStatus}>
              <Text style={styles.syncStatusText}>
                {getSyncStatus(calendarSyncs.find(s => s.calendar_type === 'google')!)}
              </Text>
              <Switch
                value={calendarSyncs.find(s => s.calendar_type === 'google')?.is_enabled || false}
                onValueChange={(enabled) => {
                  const sync = calendarSyncs.find(s => s.calendar_type === 'google');
                  if (sync) toggleSync(sync.id, enabled);
                }}
              />
            </View>
          )}
        </View>

        {/* Apple Calendar */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarName}>Apple Kalender</Text>
            <TouchableOpacity
              style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
              onPress={handleAppleCalendarSync}
              disabled={syncing}
            >
              <Text style={styles.syncButtonText}>
                {syncing ? 'Synkar...' : 'Synka'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {calendarSyncs.find(s => s.calendar_type === 'apple') && (
            <View style={styles.syncStatus}>
              <Text style={styles.syncStatusText}>
                {getSyncStatus(calendarSyncs.find(s => s.calendar_type === 'apple')!)}
              </Text>
              <Switch
                value={calendarSyncs.find(s => s.calendar_type === 'apple')?.is_enabled || false}
                onValueChange={(enabled) => {
                  const sync = calendarSyncs.find(s => s.calendar_type === 'apple');
                  if (sync) toggleSync(sync.id, enabled);
                }}
              />
            </View>
          )}
        </View>

        <View style={styles.syncInfo}>
          <Text style={styles.syncInfoTitle}>Vad synkroniseras?</Text>
          <Text style={styles.syncInfoText}>
            • Dina skift från Skiftapp synkas till din kalender{'\n'}
            • Kalenderhändelser synkas till Skiftapp{'\n'}
            • Automatisk synkronisering varje timme{'\n'}
            • Du kan stänga av synkronisering när som helst
          </Text>
        </View>
      </View>

      {/* Snabbstatistik */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Snabbstatistik</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Skift denna månad</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Väntande skiftbyten</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>Närvaro</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Chattmeddelanden</Text>
          </View>
        </View>
      </View>

      {/* Kommande händelser */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kommande händelser</Text>
        
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle}>Morgonskift</Text>
          <Text style={styles.eventTime}>Idag 08:00 - 16:00</Text>
          <Text style={styles.eventLocation}>Avdelning: Produktion</Text>
        </View>
        
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle}>Team-möte</Text>
          <Text style={styles.eventTime}>Imorgon 10:00 - 11:00</Text>
          <Text style={styles.eventLocation}>Konferensrum A</Text>
        </View>
        
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle}>Kvällsskift</Text>
          <Text style={styles.eventTime}>Imorgon 16:00 - 00:00</Text>
          <Text style={styles.eventLocation}>Avdelning: Logistik</Text>
        </View>
      </View>

      {/* Inställningar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inställningar</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingTitle}>Notifikationer</Text>
          <Text style={styles.settingSubtitle}>Hantera push-notifikationer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingTitle}>Privatinställningar</Text>
          <Text style={styles.settingSubtitle}>Hantera synlighet och data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingTitle}>Säkerhet</Text>
          <Text style={styles.settingSubtitle}>Lösenord och tvåfaktor</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  syncButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncButtonDisabled: {
    backgroundColor: '#ccc',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  syncStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncStatusText: {
    fontSize: 14,
    color: '#666',
  },
  syncInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  syncInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  syncInfoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#666',
  },
  settingItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 