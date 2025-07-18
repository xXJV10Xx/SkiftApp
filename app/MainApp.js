import React from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import DrawerNavigator from './DrawerNavigator';
import OnboardingNavigator from './onboarding/OnboardingNavigator';

function MainAppContent() {
  const { user } = useAuth();
  if (!user) {
    return <OnboardingNavigator />;
  }
  return <DrawerNavigator />;
}

export default function MainApp() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
} 