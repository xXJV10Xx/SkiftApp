import { Menu } from 'lucide-react-native';
import React from 'react';
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import ProfilePicture from './ProfilePicture';
import { useCompany } from '../context/CompanyContext';
import { useTheme } from '../context/ThemeContext';

interface AppHeaderProps {
  title?: string;
  onMenuPress?: () => void;
  showProfilePicture?: boolean;
}

export default function AppHeader({ 
  title, 
  onMenuPress, 
  showProfilePicture = true 
}: AppHeaderProps) {
  const { colors } = useTheme();
  const { employee } = useCompany();

  const styles = StyleSheet.create({
    safeArea: {
      backgroundColor: colors.primary,
    },
    container: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 56,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuButton: {
      padding: 8,
      marginRight: 12,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white',
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      </SafeAreaView>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={onMenuPress}
            activeOpacity={0.7}
          >
            <Menu size={24} color="white" />
          </TouchableOpacity>
          
          {title && (
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
            </View>
          )}
        </View>

        {showProfilePicture && (
          <View style={styles.rightSection}>
            <TouchableOpacity onPress={onMenuPress} activeOpacity={0.7}>
              <ProfilePicture
                imageUri={employee?.avatar_url}
                size={36}
                editable={false}
                showCameraIcon={false}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}