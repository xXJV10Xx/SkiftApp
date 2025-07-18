import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import CompanyShiftScreen from './CompanyShiftScreen';
import GuestScreen from './GuestScreen';
import LoginScreen from './LoginScreen';
import ProfileSetupScreen from './ProfileSetupScreen';
import RegisterScreen from './RegisterScreen';
import WelcomeCalendarScreen from './WelcomeCalendarScreen';

const Stack = createStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Guest" component={GuestScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="CompanyShift" component={CompanyShiftScreen} />
      <Stack.Screen name="WelcomeCalendar" component={WelcomeCalendarScreen} />
    </Stack.Navigator>
  );
} 