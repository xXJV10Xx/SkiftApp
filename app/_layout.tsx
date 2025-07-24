import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ChatProvider } from '../context/ChatContext';
import { CompanyProvider } from '../context/CompanyContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ShiftProvider } from '../context/ShiftContext';
import { ThemeProvider } from '../context/ThemeContext'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initSentry } from '@/lib/sentry';
import ErrorBoundary from '@/components/ErrorBoundary';

function MainLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/forgot-password" />
      </Stack>
    );
  }

  return (
    <CompanyProvider>
      <ShiftProvider>
        <ChatProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
        </ChatProvider>
      </ShiftProvider>
    </CompanyProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  // Initialize Sentry when the app starts
  useEffect(() => {
    initSentry();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <MainLayout />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}