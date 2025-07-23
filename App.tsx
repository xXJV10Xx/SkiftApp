import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

// Context
import { AuthProvider, useAuth } from './context/AuthContext'

// Screens
import LoginScreen from './components/LoginScreen'
import RegisterScreen from './components/RegisterScreen'
import OnboardingScreen from './components/OnboardingScreen'
import AdvancedCalendar from './components/AdvancedCalendar'
import ShiftTradeScreen from './components/ShiftTradeScreen'
import ProfileScreen from './components/ProfileScreen'
import ChatListScreen from './components/ChatListScreen'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

// Auth Stack (Login/Register)
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  )
}

// Main App Tabs
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap

          if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline'
          } else if (route.name === 'ShiftTrade') {
            iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline'
          } else if (route.name === 'Chats') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          } else {
            iconName = 'help-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Calendar" 
        component={AdvancedCalendar}
        options={{ tabBarLabel: 'Schema' }}
      />
      <Tab.Screen 
        name="ShiftTrade" 
        component={ShiftTradeScreen}
        options={{ tabBarLabel: 'Byten' }}
      />
      <Tab.Screen 
        name="Chats" 
        component={ChatListScreen}
        options={{ tabBarLabel: 'Chattar' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  )
}

// App Content with Auth Logic
function AppContent() {
  const { user, loading, isProfileComplete } = useAuth()

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  // Not authenticated - show auth screens
  if (!user) {
    return <AuthStack />
  }

  // User authenticated but profile incomplete - show onboarding
  if (!isProfileComplete) {
    return <OnboardingScreen />
  }

  // User authenticated and profile complete - show main app
  return <MainTabs />
}

// Main App Component
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <AppContent />
      </NavigationContainer>
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
})