import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CompanySelector } from '../../components/CompanySelector';
import { ShiftCalendar } from '../../components/ShiftCalendar';
import { ShiftStats } from '../../components/ShiftStats';
import { TeamSelector } from '../../components/TeamSelector';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { COMPANIES } from '../../data/companies';

export default function Page() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [selectedCompany, setSelectedCompany] = useState(Object.values(COMPANIES)[0]);
  const [selectedTeam, setSelectedTeam] = useState(selectedCompany.teams[0]);
  const [selectedShiftType, setSelectedShiftType] = useState(selectedCompany.shifts[0]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Hej, {user?.email?.split('@')[0] || 'Användare'}! 👋
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {new Date().toLocaleDateString('sv-SE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
          <TouchableOpacity style={[styles.profileButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Company & Team Selection */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            🏭 Välj företag och lag
          </Text>
          
          <CompanySelector
            companies={Object.values(COMPANIES)}
            selectedCompany={selectedCompany}
            onSelectCompany={setSelectedCompany}
          />
          
          <TeamSelector
            companyId={selectedCompany.id}
            selectedTeam={selectedTeam}
            onSelectTeam={setSelectedTeam}
            selectedShiftTypeId={selectedShiftType}
            onSelectShiftType={setSelectedShiftType}
          />
        </View>

        {/* Quick Stats */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📊 Snabbstatistik
          </Text>
          <ShiftStats
            company={selectedCompany}
            team={selectedTeam}
            shiftTypeId={selectedShiftType}
          />
        </View>

        {/* Today's Shift */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📅 Dagens skift
          </Text>
          <View style={[styles.todayShift, { backgroundColor: colors.primary + '10' }]}>
            <View style={styles.todayShiftHeader}>
              <Ionicons name="time" size={24} color={colors.primary} />
              <Text style={[styles.todayShiftTitle, { color: colors.primary }]}>
                {new Date().toLocaleDateString('sv-SE', { weekday: 'long' })}
              </Text>
            </View>
            <Text style={[styles.todayShiftTime, { color: colors.text }]}>
              06:00 - 14:00
            </Text>
            <Text style={[styles.todayShiftType, { color: colors.textSecondary }]}>
              Morgonskift
            </Text>
          </View>
        </View>

        {/* Calendar Preview */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📅 Skiftschema
          </Text>
          <ShiftCalendar
            companyId={selectedCompany.id}
            team={selectedTeam}
            shiftTypeId={selectedShiftType}
          />
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            ⚡ Snabba åtgärder
          </Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]}>
              <Ionicons name="chatbubbles" size={20} color="white" />
              <Text style={styles.actionText}>Chatta</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.secondary }]}>
              <Ionicons name="calendar" size={20} color="white" />
              <Text style={styles.actionText}>Schema</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.secondary }]}>
              <Ionicons name="notifications" size={20} color="white" />
              <Text style={styles.actionText}>Notifieringar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.success }]}>
              <Ionicons name="settings" size={20} color="white" />
              <Text style={styles.actionText}>Inställningar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  todayShift: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  todayShiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  todayShiftTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  todayShiftTime: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  todayShiftType: {
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
