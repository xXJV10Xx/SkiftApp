import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthScreen } from './components/AuthScreen';
import { ChatSystem } from './components/ChatSystem';
import { CompanyManagement } from './components/CompanyManagement';
import { PatternDashboard } from './components/PatternDashboard';
import { ShiftManagement } from './components/ShiftManagement';
import { UserDashboard } from './components/UserDashboard';
import { supabase } from './lib/supabase';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'companies' | 'shifts' | 'chat' | 'patterns'>('dashboard');

  useEffect(() => {
    // Kontrollera om användaren är inloggad
    checkUser();
    
    // Lyssna på autentiseringsändringar
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setUser(supabase.auth.getUser());
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Loading screen */}
      </View>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      {/* Navigation Header */}
      <View style={styles.header}>
        <View style={styles.navContainer}>
          <NavButton 
            title="Dashboard" 
            isActive={currentScreen === 'dashboard'}
            onPress={() => setCurrentScreen('dashboard')}
          />
          <NavButton 
            title="Företag" 
            isActive={currentScreen === 'companies'}
            onPress={() => setCurrentScreen('companies')}
          />
          <NavButton 
            title="Skift" 
            isActive={currentScreen === 'shifts'}
            onPress={() => setCurrentScreen('shifts')}
          />
          <NavButton 
            title="Chatt" 
            isActive={currentScreen === 'chat'}
            onPress={() => setCurrentScreen('chat')}
          />
          <NavButton 
            title="Analys" 
            isActive={currentScreen === 'patterns'}
            onPress={() => setCurrentScreen('patterns')}
          />
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userEmail}>{user.email}</Text>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Logga ut</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {currentScreen === 'dashboard' && <UserDashboard />}
        {currentScreen === 'companies' && <CompanyManagement />}
        {currentScreen === 'shifts' && <ShiftManagement />}
        {currentScreen === 'chat' && <ChatSystem />}
        {currentScreen === 'patterns' && <PatternDashboard />}
      </View>
    </View>
  );
}

// Navigation Button Component
const NavButton: React.FC<{
  title: string;
  isActive: boolean;
  onPress: () => void;
}> = ({ title, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.navButton, isActive && styles.activeNavButton]}
    onPress={onPress}
  >
    <Text style={[styles.navButtonText, isActive && styles.activeNavButtonText]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeNavButton: {
    backgroundColor: '#007AFF',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeNavButtonText: {
    color: '#fff',
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  signOutText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
}); 