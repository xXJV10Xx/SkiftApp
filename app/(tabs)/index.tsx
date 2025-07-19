import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import GoogleOAuthTest from '../../components/GoogleOAuthTest';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export default function Page() {
  const { user } = useAuth();
  const { teams, currentTeam } = useChat();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🚀 Välkommen till Skiftappen!</Text>
        <Text style={styles.subtitle}>Du är nu inloggad</Text>
        
        <View style={styles.userInfo}>
          <Text style={styles.userText}>Användare: {user?.email}</Text>
          <Text style={styles.userText}>ID: {user?.id}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Authentication Status</Text>
          <Text style={styles.statusText}>✅ Supabase anslutning aktiv</Text>
          <Text style={styles.statusText}>✅ Användare autentiserad</Text>
          <Text style={styles.statusText}>✅ Session hanterad</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Chatfunktion</Text>
          <Text style={styles.featureText}>✅ Real-time meddelanden</Text>
          <Text style={styles.featureText}>✅ Lagbaserad chatt</Text>
          <Text style={styles.featureText}>✅ Online-status för medlemmar</Text>
          <Text style={styles.featureText}>✅ Företags- och laghantering</Text>
          <Text style={styles.featureText}>✅ Medlemslista med roller</Text>
          
          {teams.length > 0 && (
            <View style={styles.teamsInfo}>
              <Text style={styles.teamsTitle}>Dina lag ({teams.length})</Text>
              {teams.map((team, index) => (
                <View key={team.id} style={[styles.teamItem, { borderLeftColor: team.color }]}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <Text style={styles.teamCompany}>{team.company?.name}</Text>
                </View>
              ))}
            </View>
          )}

          {currentTeam && (
            <View style={styles.currentTeamInfo}>
              <Text style={styles.currentTeamTitle}>Aktivt lag:</Text>
              <Text style={styles.currentTeamName}>{currentTeam.name}</Text>
            </View>
          )}
        </View>

        <GoogleOAuthTest />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 App Navigation</Text>
          <View style={styles.navItem}>
            <Ionicons name="home" size={20} color="#007AFF" />
            <Text style={styles.navText}>• Hem - Du är här</Text>
          </View>
          <View style={styles.navItem}>
            <Ionicons name="chatbubbles" size={20} color="#007AFF" />
            <Text style={styles.navText}>• Chat - Chatta med ditt lag</Text>
          </View>
          <View style={styles.navItem}>
            <Ionicons name="search" size={20} color="#007AFF" />
            <Text style={styles.navText}>• Utforska - Utforska funktioner</Text>
          </View>
          <View style={styles.navItem}>
            <Ionicons name="person" size={20} color="#007AFF" />
            <Text style={styles.navText}>• Profil - Hantera ditt konto</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Nästa steg</Text>
          <Text style={styles.stepText}>1. Skapa databasen med SQL-kommandon</Text>
          <Text style={styles.stepText}>2. Lägg till testdata för lag</Text>
          <Text style={styles.stepText}>3. Testa chatfunktionen</Text>
          <Text style={styles.stepText}>4. Konfigurera Google OAuth</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  userInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  userText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#28a745',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: '#28a745',
    marginBottom: 4,
  },
  teamsInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  teamsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  teamItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  teamCompany: {
    fontSize: 12,
    color: '#666',
  },
  currentTeamInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  currentTeamTitle: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  currentTeamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  navText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});
