// 📱 RORK AI REACT NATIVE COMPONENTS
// SkiftApp 2025 - Complete shift management system for all 17 companies
// 100% accurate schedules from skiftschema.se

import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions
} from 'react-native';

import { 
  CompleteSkiftSystemGenerator, 
  COMPLETE_COMPANIES, 
  RORK_AI_CONFIG,
  ShiftSchedule,
  CompanyShift,
  SHIFT_TIMES
} from './RORK_AI_COMPLETE_SYSTEM';

const { width, height } = Dimensions.get('window');

// ✅ MAIN APP COMPONENT
export const SkiftApp2025: React.FC = () => {
  const [selectedCompany, setSelectedCompany] = useState<string>(COMPLETE_COMPANIES[0].companyId);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [schedules, setSchedules] = useState<ShiftSchedule[]>([]);
  const [viewMode, setViewMode] = useState<'companies' | 'calendar' | 'team'>('companies');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Initialize with first company's first team
  useEffect(() => {
    const company = COMPLETE_COMPANIES.find(c => c.companyId === selectedCompany);
    if (company && company.teams.length > 0 && !selectedTeam) {
      setSelectedTeam(company.teams[0].teamId);
    }
  }, [selectedCompany, selectedTeam]);

  // Generate schedules when company/team changes
  useEffect(() => {
    if (selectedCompany && selectedTeam) {
      try {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3); // 3 months ahead
        
        const newSchedules = CompleteSkiftSystemGenerator.generateSchedule(
          selectedCompany,
          selectedTeam,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
        setSchedules(newSchedules);
      } catch (error) {
        Alert.alert('Fel', `Kunde inte generera schema: ${error}`);
      }
    }
  }, [selectedCompany, selectedTeam]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2C5530" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SkiftApp 2025</Text>
        <Text style={styles.headerSubtitle}>
          {RORK_AI_CONFIG.totalCompanies} företag • {RORK_AI_CONFIG.totalTeams} lag
        </Text>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        {(['companies', 'calendar', 'team'] as const).map(mode => (
          <TouchableOpacity
            key={mode}
            style={[styles.navButton, viewMode === mode && styles.navButtonActive]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.navText, viewMode === mode && styles.navTextActive]}>
              {mode === 'companies' && 'Företag'}
              {mode === 'calendar' && 'Kalender'}  
              {mode === 'team' && 'Lag'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {viewMode === 'companies' && (
          <CompaniesView 
            selectedCompany={selectedCompany}
            onCompanySelect={setSelectedCompany}
          />
        )}
        {viewMode === 'calendar' && (
          <CalendarView 
            schedules={schedules}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
          />
        )}
        {viewMode === 'team' && (
          <TeamView 
            selectedCompany={selectedCompany}
            selectedTeam={selectedTeam}
            onTeamSelect={setSelectedTeam}
            schedules={schedules}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// ✅ COMPANIES LIST VIEW
const CompaniesView: React.FC<{
  selectedCompany: string;
  onCompanySelect: (companyId: string) => void;
}> = ({ selectedCompany, onCompanySelect }) => {
  
  const companiesByIndustry = useMemo(() => {
    const grouped: { [industry: string]: CompanyShift[] } = {};
    COMPLETE_COMPANIES.forEach(company => {
      if (!grouped[company.industry]) grouped[company.industry] = [];
      grouped[company.industry].push(company);
    });
    return grouped;
  }, []);

  return (
    <ScrollView style={styles.scrollView}>
      {Object.entries(companiesByIndustry).map(([industry, companies]) => (
        <View key={industry} style={styles.industrySection}>
          <Text style={styles.industryTitle}>{industry}</Text>
          {companies.map(company => (
            <TouchableOpacity
              key={company.companyId}
              style={[
                styles.companyCard,
                selectedCompany === company.companyId && styles.companyCardSelected
              ]}
              onPress={() => onCompanySelect(company.companyId)}
            >
              <View style={styles.companyHeader}>
                <Text style={styles.companyName}>{company.displayName}</Text>
                <View style={styles.shiftTypeBadge}>
                  <Text style={styles.shiftTypeText}>{company.shiftType}</Text>
                </View>
              </View>
              <Text style={styles.companyLocation}>📍 {company.location}</Text>
              <Text style={styles.companyTeams}>👥 {company.teams.length} lag</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

// ✅ CALENDAR VIEW
const CalendarView: React.FC<{
  schedules: ShiftSchedule[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}> = ({ schedules, currentDate }) => {

  const monthSchedules = useMemo(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate.getMonth() === month && scheduleDate.getFullYear() === year;
    });
  }, [schedules, currentDate]);

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days: Array<{ day: number; schedule?: ShiftSchedule }> = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push({ day: 0 });
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const schedule = monthSchedules.find(s => s.date === dateStr);
      days.push({ day, schedule });
    }
    
    return days;
  };

  const getShiftColor = (shiftType: string) => {
    switch (shiftType) {
      case 'F': return '#4CAF50'; // Green for morning
      case 'E': return '#FF9800'; // Orange for afternoon
      case 'N': return '#3F51B5'; // Blue for night
      case 'D': return '#2196F3'; // Light blue for day
      case 'L': return '#E0E0E0'; // Gray for rest
      default: return '#E0E0E0';
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ];

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={() => {
          const newDate = new Date(currentDate);
          newDate.setMonth(newDate.getMonth() - 1);
          onDateChange(newDate);
        }}>
          <Text style={styles.calendarNavButton}>‹</Text>
        </TouchableOpacity>
        
        <Text style={styles.calendarTitle}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        
        <TouchableOpacity onPress={() => {
          const newDate = new Date(currentDate);
          newDate.setMonth(newDate.getMonth() + 1);
          onDateChange(newDate);
        }}>
          <Text style={styles.calendarNavButton}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Weekdays */}
      <View style={styles.weekdaysRow}>
        {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map(day => (
          <Text key={day} style={styles.weekdayText}>{day}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {getDaysInMonth().map((dayObj, index) => (
          <View key={index} style={styles.calendarDay}>
            {dayObj.day > 0 && (
              <>
                <Text style={styles.dayNumber}>{dayObj.day}</Text>
                {dayObj.schedule && (
                  <View style={[
                    styles.shiftIndicator,
                    { backgroundColor: getShiftColor(dayObj.schedule.shiftType) }
                  ]}>
                    <Text style={styles.shiftText}>{dayObj.schedule.shiftType}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Skifttyper:</Text>
        <View style={styles.legendRow}>
          {Object.entries(SHIFT_TIMES).map(([type, info]) => (
            <View key={type} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: getShiftColor(type) }]} />
              <Text style={styles.legendText}>{type}: {info.name}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// ✅ TEAM VIEW
const TeamView: React.FC<{
  selectedCompany: string;
  selectedTeam: string;
  onTeamSelect: (teamId: string) => void;
  schedules: ShiftSchedule[];
}> = ({ selectedCompany, selectedTeam, onTeamSelect, schedules }) => {
  
  const company = COMPLETE_COMPANIES.find(c => c.companyId === selectedCompany);
  
  if (!company) return <Text>Inget företag valt</Text>;

  const upcomingSchedules = schedules.slice(0, 14); // Next 2 weeks

  return (
    <ScrollView style={styles.scrollView}>
      {/* Team Selection */}
      <View style={styles.teamSection}>
        <Text style={styles.sectionTitle}>Välj Lag</Text>
        <View style={styles.teamsGrid}>
          {company.teams.map(team => (
            <TouchableOpacity
              key={team.teamId}
              style={[
                styles.teamCard,
                { borderColor: team.color },
                selectedTeam === team.teamId && styles.teamCardSelected
              ]}
              onPress={() => onTeamSelect(team.teamId)}
            >
              <View style={[styles.teamColorDot, { backgroundColor: team.color }]} />
              <Text style={styles.teamName}>{team.displayName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Schedule List */}
      {selectedTeam && (
        <View style={styles.scheduleSection}>
          <Text style={styles.sectionTitle}>Kommande Schema</Text>
          {upcomingSchedules.map((schedule, index) => (
            <View key={index} style={styles.scheduleItem}>
              <View style={styles.scheduleDate}>
                <Text style={styles.scheduleDateText}>
                  {new Date(schedule.date).toLocaleDateString('sv-SE', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
              <View style={[
                styles.scheduleShift,
                { backgroundColor: getShiftColor(schedule.shiftType) }
              ]}>
                <Text style={styles.scheduleShiftText}>
                  {schedule.shiftType === 'L' ? 'Ledig' : schedule.shiftType}
                </Text>
                {schedule.shiftType !== 'L' && (
                  <Text style={styles.scheduleTimeText}>
                    {schedule.startTime} - {schedule.endTime}
                  </Text>
                )}
              </View>
              {schedule.hoursWorked > 0 && (
                <Text style={styles.scheduleHours}>{schedule.hoursWorked}h</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

// Helper function (moved outside component to avoid re-creation)
const getShiftColor = (shiftType: string) => {
  switch (shiftType) {
    case 'F': return '#4CAF50';
    case 'E': return '#FF9800'; 
    case 'N': return '#3F51B5';
    case 'D': return '#2196F3';
    case 'L': return '#E0E0E0';
    default: return '#E0E0E0';
  }
};

// ✅ STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2C5530',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#B8E6C0',
    textAlign: 'center',
    marginTop: 4,
  },
  navigation: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  navButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  navButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2C5530',
  },
  navText: {
    fontSize: 16,
    color: '#666',
  },
  navTextActive: {
    color: '#2C5530',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  
  // Companies View
  industrySection: {
    marginBottom: 20,
  },
  industryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C5530',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F0F8F0',
  },
  companyCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 5,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  companyCardSelected: {
    borderColor: '#2C5530',
    backgroundColor: '#F9FDF9',
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  shiftTypeBadge: {
    backgroundColor: '#2C5530',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  shiftTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  companyLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  companyTeams: {
    fontSize: 14,
    color: '#666',
  },

  // Calendar View
  calendarContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  calendarNavButton: {
    fontSize: 24,
    color: '#2C5530',
    fontWeight: 'bold',
    padding: 10,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  weekdaysRow: {
    flexDirection: 'row',
    backgroundColor: '#F0F8F0',
    paddingVertical: 10,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C5530',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'white',
  },
  calendarDay: {
    width: width / 7,
    height: 60,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
    padding: 4,
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  shiftIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  legend: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },

  // Team View  
  teamSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C5530',
    marginBottom: 15,
  },
  teamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  teamCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  teamCardSelected: {
    backgroundColor: '#F9FDF9',
  },
  teamColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  teamName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  scheduleSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  scheduleDate: {
    width: 80,
  },
  scheduleDateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  scheduleShift: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  scheduleShiftText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  scheduleTimeText: {
    fontSize: 12,
    color: 'white',
    marginTop: 2,
  },
  scheduleHours: {
    fontSize: 14,
    color: '#666',
    width: 30,
    textAlign: 'center',
  },
});

export default SkiftApp2025;