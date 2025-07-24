import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    PanGestureHandler,
    State,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { router } from 'expo-router';
import AppHeader from './AppHeader';
import SidePanel from './SidePanel';
import { useTheme } from '../context/ThemeContext';

interface DrawerLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
}

const DRAWER_WIDTH = 280;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DrawerLayout({ 
  children, 
  title, 
  showHeader = true 
}: DrawerLayoutProps) {
  const { colors } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  const openDrawer = () => {
    setIsDrawerOpen(true);
    Animated.timing(translateX, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(translateX, {
      toValue: -DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsDrawerOpen(false);
    });
  };

  const handleNavigate = (screen: string) => {
    closeDrawer();
    router.push(`/(tabs)/${screen}`);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1,
    },
    drawer: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: DRAWER_WIDTH,
      backgroundColor: colors.background,
      zIndex: 2,
      elevation: 16,
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
  });

  return (
    <View style={styles.container}>
      {showHeader && (
        <AppHeader
          title={title}
          onMenuPress={openDrawer}
          showProfilePicture={true}
        />
      )}
      
      <View style={styles.content}>
        {children}
      </View>

      {/* Drawer Modal */}
      <Modal
        visible={isDrawerOpen}
        transparent={true}
        animationType="none"
        onRequestClose={closeDrawer}
      >
        <View style={styles.container}>
          {/* Overlay */}
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>

          {/* Drawer */}
          <Animated.View 
            style={[
              styles.drawer,
              {
                transform: [{ translateX }],
              },
            ]}
          >
            <SidePanel onNavigate={handleNavigate} />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}