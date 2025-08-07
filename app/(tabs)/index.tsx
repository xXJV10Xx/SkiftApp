<<<<<<< HEAD
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
=======
import { Building2, Calendar, Clock, TrendingUp, Users } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCompany } from '../../context/CompanyContext';
import { useShift } from '../../context/ShiftContext';
import { useTheme } from '../../context/ThemeContext';
import { COMPANIES } from '../../data/companies';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { 
    selectedCompany, 
    selectedTeam, 
    selectedDepartment, 
    employee,
    setSelectedCompany, 
    setSelectedTeam, 
    setSelectedDepartment,
    updateEmployeeProfile,
    syncCompaniesToSupabase,
    loading: companyLoading
  } = useCompany();
  
  const { 
    currentShift, 
    nextShift, 
    shiftStats, 
    selectedShiftType,
    loading: shiftLoading 
  } = useShift();

  // Sync companies to Supabase on first load
  useEffect(() => {
    const initializeData = async () => {
      try {
        await syncCompaniesToSupabase();
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };

    initializeData();
  }, []);

  const handleCompanySelect = async (companyId: string) => {
    const company = COMPANIES[companyId];
    if (!company) return;

    try {
      setSelectedCompany(company);
      
      // Update employee profile with selected company
      if (employee) {
        await updateEmployeeProfile({
          company_id: company.id
        });
      }
    } catch (error) {
      Alert.alert('Fel', 'Kunde inte uppdatera företagsinformation');
    }
  };

  const handleTeamSelect = async (teamName: string) => {
    if (!selectedCompany) return;

    try {
      setSelectedTeam(teamName);
      
      // Update employee profile with selected team
      if (employee) {
        await updateEmployeeProfile({
          team_id: teamName // This should be the actual team ID from database
        });
      }
    } catch (error) {
      Alert.alert('Fel', 'Kunde inte uppdatera laginformation');
    }
  };

  const handleDepartmentSelect = async (department: string) => {
    try {
      setSelectedDepartment(department);
      
      // Update employee profile with selected department
      if (employee) {
        await updateEmployeeProfile({
          department: department,
          profile_completed: true
        });
      }
    } catch (error) {
      Alert.alert('Fel', 'Kunde inte uppdatera avdelningsinformation');
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); // Remove seconds
  };

  const getShiftName = (shiftCode: string) => {
    const shiftNames: Record<string, string> = {
      'M': 'Morgon',
      'A': 'Kväll', 
      'N': 'Natt',
      'F': 'Förmiddag',
      'E': 'Eftermiddag',
      'D': 'Dag',
      'L': 'Ledig'
    };
    return shiftNames[shiftCode] || shiftCode;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      padding: 20,
    },
    header: {
      marginBottom: 30,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    cardContent: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      flex: 1,
      minWidth: '45%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    companyGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    companyCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      flex: 1,
      minWidth: '45%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedCard: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    companyName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    companyDesc: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    teamGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    teamCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      minWidth: 80,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    teamColor: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginBottom: 8,
    },
    teamName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    departmentGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    departmentCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    departmentName: {
      fontSize: 14,
      color: colors.text,
    },
    currentShiftCard: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
    },
    currentShiftTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'white',
      marginBottom: 8,
    },
    currentShiftTime: {
      fontSize: 16,
      color: 'white',
      opacity: 0.9,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 20,
    },
  });

  if (!selectedCompany) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Välkommen till Skiftappen</Text>
            <Text style={styles.subtitle}>
              Välj ditt företag för att komma igång
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Välj företag</Text>
            <View style={styles.companyGrid}>
              {Object.values(COMPANIES).map((company) => (
                <TouchableOpacity
                  key={company.id}
                  style={styles.companyCard}
                  onPress={() => handleCompanySelect(company.id)}
                >
                  <Text style={styles.companyName}>{company.name}</Text>
                  <Text style={styles.companyDesc}>{company.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (!selectedTeam) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{selectedCompany.name}</Text>
            <Text style={styles.subtitle}>Välj ditt skiftlag</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skiftlag</Text>
            <View style={styles.teamGrid}>
              {selectedCompany.teams.map((team) => (
                <TouchableOpacity
                  key={team}
                  style={[
                    styles.teamCard,
                    selectedTeam === team && styles.selectedCard
                  ]}
                  onPress={() => handleTeamSelect(team)}
                >
                  <View 
                    style={[
                      styles.teamColor, 
                      { backgroundColor: selectedCompany.colors[team] }
                    ]} 
                  />
                  <Text style={styles.teamName}>Lag {team}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (!selectedDepartment) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{selectedCompany.name}</Text>
            <Text style={styles.subtitle}>Lag {selectedTeam} - Välj avdelning</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avdelningar</Text>
            <View style={styles.departmentGrid}>
              {selectedCompany.departments.map((dept) => (
                <TouchableOpacity
                  key={dept}
                  style={[
                    styles.departmentCard,
                    selectedDepartment === dept && styles.selectedCard
                  ]}
                  onPress={() => handleDepartmentSelect(dept)}
                >
                  <Text style={styles.departmentName}>{dept}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Skiftappen</Text>
          <Text style={styles.subtitle}>
            {selectedCompany.name} - Lag {selectedTeam} - {selectedDepartment}
          </Text>
        </View>

        {/* Current Shift */}
        {currentShift && (
          <View style={styles.currentShiftCard}>
            <Text style={styles.currentShiftTitle}>
              Aktuellt skift: {getShiftName(currentShift.shift.code)}
            </Text>
            {currentShift.shift.time.start && currentShift.shift.time.end && (
              <Text style={styles.currentShiftTime}>
                {formatTime(currentShift.shift.time.start)} - {formatTime(currentShift.shift.time.end)}
              </Text>
            )}
          </View>
        )}

        {/* Statistics */}
        {shiftStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistik denna månad</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Clock size={20} color={colors.primary} />
                <Text style={styles.statValue}>{shiftStats.totalHours}h</Text>
                <Text style={styles.statLabel}>Totalt arbetade timmar</Text>
              </View>
              
              <View style={styles.statCard}>
                <Calendar size={20} color={colors.primary} />
                <Text style={styles.statValue}>{shiftStats.workDays}</Text>
                <Text style={styles.statLabel}>Arbetsdagar</Text>
              </View>
              
              <View style={styles.statCard}>
                <TrendingUp size={20} color={colors.primary} />
                <Text style={styles.statValue}>{shiftStats.averageHours}h</Text>
                <Text style={styles.statLabel}>Snitt per dag</Text>
              </View>
              
              <View style={styles.statCard}>
                <Users size={20} color={colors.primary} />
                <Text style={styles.statValue}>Lag {selectedTeam}</Text>
                <Text style={styles.statLabel}>Ditt skiftlag</Text>
              </View>
            </View>
          </View>
        )}

        {/* Next Shift */}
        {nextShift && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nästa skift</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {getShiftName(nextShift.shift.code)} - {nextShift.daysUntil} dagar kvar
              </Text>
              <Text style={styles.cardContent}>
                {nextShift.date.toLocaleDateString('sv-SE', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
              {nextShift.shift.time.start && nextShift.shift.time.end && (
                <Text style={styles.cardContent}>
                  {formatTime(nextShift.shift.time.start)} - {formatTime(nextShift.shift.time.end)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Shift Type Info */}
        {selectedShiftType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skifttyp</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{selectedShiftType.name}</Text>
              <Text style={styles.cardContent}>{selectedShiftType.description}</Text>
              <Text style={styles.cardContent}>
                Cykel: {selectedShiftType.cycle} dagar
              </Text>
            </View>
          </View>
        )}

        {(companyLoading || shiftLoading) && (
          <Text style={styles.loadingText}>Laddar...</Text>
        )}
      </View>
    </ScrollView>
  );
}
>>>>>>> 2a1aa03ff65d9371d2c06bc876527b6c0a92a77d
