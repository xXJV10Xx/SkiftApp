import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { registerForPushNotificationsAsync } from '../../lib/notifications';

export default function SettingsScreen() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, isDark, colors } = useTheme();
  const { signOut } = useAuth();

  const handleLanguageChange = (newLanguage: 'sv' | 'en') => {
    setLanguage(newLanguage);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  const handlePushNotifications = async () => {
    try {
      await registerForPushNotificationsAsync();
      Alert.alert(t('success'), 'Push-notifikationer aktiverade!');
    } catch (error) {
      Alert.alert(t('error'), 'Kunde inte aktivera push-notifikationer');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      t('signOut'),
      'Är du säker på att du vill logga ut?',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('signOut'), onPress: signOut, style: 'destructive' },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('settings')}
        </Text>

        {/* Language Settings */}
        <View style={styles.settingGroup}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>
            Språk / Language
          </Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.option,
                language === 'sv' && { backgroundColor: colors.primary }
              ]}
              onPress={() => handleLanguageChange('sv')}
            >
              <Text style={[
                styles.optionText,
                { color: language === 'sv' ? '#FFFFFF' : colors.text }
              ]}>
                Svenska
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.option,
                language === 'en' && { backgroundColor: colors.primary }
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={[
                styles.optionText,
                { color: language === 'en' ? '#FFFFFF' : colors.text }
              ]}>
                English
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Theme Settings */}
        <View style={styles.settingGroup}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>
            Tema / Theme
          </Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.option,
                theme === 'light' && { backgroundColor: colors.primary }
              ]}
              onPress={() => handleThemeChange('light')}
            >
              <Text style={[
                styles.optionText,
                { color: theme === 'light' ? '#FFFFFF' : colors.text }
              ]}>
                Ljust / Light
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.option,
                theme === 'dark' && { backgroundColor: colors.primary }
              ]}
              onPress={() => handleThemeChange('dark')}
            >
              <Text style={[
                styles.optionText,
                { color: theme === 'dark' ? '#FFFFFF' : colors.text }
              ]}>
                Mörkt / Dark
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.option,
                theme === 'system' && { backgroundColor: colors.primary }
              ]}
              onPress={() => handleThemeChange('system')}
            >
              <Text style={[
                styles.optionText,
                { color: theme === 'system' ? '#FFFFFF' : colors.text }
              ]}>
                System
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Push Notifications */}
        <View style={styles.settingGroup}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>
            Notifikationer / Notifications
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handlePushNotifications}
          >
            <Ionicons name="notifications" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Aktivera Push-notifikationer</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <View style={styles.settingGroup}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.error }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>{t('signOut')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingGroup: {
    marginBottom: 25,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C6C6C8',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    gap: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 