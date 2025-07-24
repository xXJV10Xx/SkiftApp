import { Building2, LogOut, Mail, Settings, User, Users } from 'lucide-react-native';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import ProfilePicture from './ProfilePicture';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useTheme } from '../context/ThemeContext';

interface SidePanelProps {
  onNavigate?: (screen: string) => void;
}

export default function SidePanel({ onNavigate }: SidePanelProps) {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const { selectedCompany, selectedTeam, employee } = useCompany();

  const handleSignOut = () => {
    Alert.alert(
      'Logga ut',
      'Är du säker på att du vill logga ut?',
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Logga ut',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: Building2,
      title: 'Hem',
      subtitle: 'Dashboard och översikt',
      screen: 'index',
    },
    {
      icon: User,
      title: 'Profil',
      subtitle: 'Hantera din profil',
      screen: 'profile',
    },
    {
      icon: Settings,
      title: 'Inställningar',
      subtitle: 'App-inställningar',
      screen: 'settings',
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.primary,
      paddingTop: 60,
      paddingBottom: 24,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    profileSection: {
      alignItems: 'center',
      marginBottom: 16,
    },
    userName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white',
      marginTop: 12,
      textAlign: 'center',
    },
    userEmail: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 4,
    },
    companyInfo: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    companyText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 6,
    },
    teamBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
    },
    teamColor: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    teamText: {
      color: 'white',
      fontSize: 11,
      fontWeight: '500',
    },
    menuSection: {
      flex: 1,
      paddingTop: 20,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemContent: {
      flex: 1,
      marginLeft: 16,
    },
    menuItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    menuItemSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      padding: 20,
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.error || '#EF4444',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
    },
    signOutText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 8,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <ProfilePicture
            imageUri={employee?.avatar_url}
            size={60}
            editable={false}
            showCameraIcon={false}
          />
          <Text style={styles.userName}>
            {employee?.first_name} {employee?.last_name}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {selectedCompany && (
          <View style={styles.companyInfo}>
            <Building2 size={16} color="white" />
            <Text style={styles.companyText}>{selectedCompany.name}</Text>
          </View>
        )}

        {selectedTeam && selectedCompany && (
          <View style={styles.teamBadge}>
            <View 
              style={[
                styles.teamColor, 
                { backgroundColor: selectedCompany.colors[selectedTeam] || 'white' }
              ]} 
            />
            <Text style={styles.teamText}>Lag {selectedTeam}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => onNavigate?.(item.screen)}
          >
            <item.icon size={20} color={colors.primary} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="white" />
          <Text style={styles.signOutText}>Logga ut</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}