import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import CalendarScreen from './CalendarScreen';
import ChatScreen from './ChatScreen';

function ProfileScreen() {
  return <></>; // Placeholder for profile
}
function CompanySearchScreen() {
  return <></>; // Placeholder for company search
}
function PersonalScheduleScreen() {
  return <></>; // Placeholder for personal schedule
}

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="Kalender">
      <Drawer.Screen name="Kalender" component={CalendarScreen} />
      <Drawer.Screen name="Chatt" component={ChatScreen} />
      <Drawer.Screen name="Profil" component={ProfileScreen} />
      <Drawer.Screen name="Företagssök" component={CompanySearchScreen} />
      <Drawer.Screen name="Personligt schema" component={PersonalScheduleScreen} />
    </Drawer.Navigator>
  );
} 