import { Tabs } from 'expo-router';
<<<<<<< HEAD
import { Platform } from 'react-native';
=======
import { Building2, Calendar, MessageSquare, Settings, User } from 'lucide-react-native';
>>>>>>> 2a1aa03ff65d9371d2c06bc876527b6c0a92a77d
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hem',
<<<<<<< HEAD
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={size} 
              color={color} 
            />
=======
          tabBarIcon: ({ color, size }) => (
            <Building2 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schema',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
>>>>>>> 2a1aa03ff65d9371d2c06bc876527b6c0a92a77d
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
<<<<<<< HEAD
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "chatbubbles" : "chatbubbles-outline"} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Utforska',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "search" : "search-outline"} 
              size={size} 
              color={color} 
            />
=======
          tabBarIcon: ({ color, size }) => (
            <MessageSquare size={size} color={color} />
>>>>>>> 2a1aa03ff65d9371d2c06bc876527b6c0a92a77d
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
<<<<<<< HEAD
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={size} 
              color={color} 
            />
=======
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
>>>>>>> 2a1aa03ff65d9371d2c06bc876527b6c0a92a77d
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Inställningar',
<<<<<<< HEAD
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "settings" : "settings-outline"} 
              size={size} 
              color={color} 
            />
=======
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
>>>>>>> 2a1aa03ff65d9371d2c06bc876527b6c0a92a77d
          ),
        }}
      />
    </Tabs>
  );
}