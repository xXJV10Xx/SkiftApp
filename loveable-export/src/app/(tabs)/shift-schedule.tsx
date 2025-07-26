import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';

interface ShiftSchedule {
  id: string;
  company_name: string;
  date: string;
  shift_type: string;
  department: string;
  location: string;
  start_time: string;
  end_time: string;
  is_holiday: boolean;
  is_weekend: boolean;
}

interface SwedishHoliday {
  date: string;
  name: string;
  type: string;
}

interface Company {
  id: string;
  name: string;
  locations: string[];
  departments: string[];
  shift_types: string[];
}

export default function ShiftScheduleScreen() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ShiftSchedule[]>([]);
  const [holidays, setHolidays] = useState<SwedishHoliday[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [showHolidays, setShowHolidays] = useState(true);
  const [showWeekends, setShowWeekends] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchShiftSchedules(),
        fetchHolidays(),
        fetchCompanies()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Fel', 'Kunde inte hämta skiftscheman');
    } finally {
      setLoading(false);
    }
  };

  const fetchShiftSchedules = async () => {
    const startDate = startOfMonth(parseISO(currentMonth + '-01'));
    const endDate = endOfMonth(startDate);

    let query = supabase
      .from('shift_schedules')
      .select('*')
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))
      .order('date', { ascending: true });

    if (selectedCompany) {
      query = query.eq('company_name', selectedCompany);
    }
    if (selectedLocation) {
      query = query.eq('location', selectedLocation);
    }
    if (selectedDepartment) {
      query = query.eq('department', selectedDepartment);
    }
    if (!showWeekends) {
      query = query.eq('is_weekend', false);
    }

    const { data, error } = await query;

    if (error) throw error;
    setSchedules(data || []);
  };

  const fetchHolidays = async () => {
    const year = new Date(currentMonth).getFullYear();
    
    const { data, error } = await supabase
      .from('swedish_holidays')
      .select('*')
      .eq('year', year)
      .order('date', { ascending: true });

    if (error) throw error;
    setHolidays(data || []);
  };

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('swedish_companies')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    setCompanies(data || []);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getMarkedDates = () => {
    const marked: any = {};

    // Markera skiftscheman
    schedules.forEach(schedule => {
      const dateKey = schedule.date;
      if (!marked[dateKey]) {
        marked[dateKey] = { dots: [], selected: false };
      }
      
      // Olika färger för olika skifttyper
      const color = getShiftTypeColor(schedule.shift_type);
      marked[dateKey].dots.push({ color });
      
      if (schedule.is_holiday) {
        marked[dateKey].customStyles = {
          container: { backgroundColor: '#ffebee' },
          text: { color: '#d32f2f', fontWeight: 'bold' }
        };
      }
    });

    // Markera helgdagar
    if (showHolidays) {
      holidays.forEach(holiday => {
        const dateKey = holiday.date;
        if (!marked[dateKey]) {
          marked[dateKey] = { dots: [] };
        }
        marked[dateKey].customStyles = {
          container: { backgroundColor: '#ffebee' },
          text: { color: '#d32f2f', fontWeight: 'bold' }
        };
      });
    }

    // Markera vald dag
    if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = '#2196F3';
    } else {
      marked[selectedDate] = {
        selected: true,
        selectedColor: '#2196F3',
        dots: []
      };
    }

    return marked;
  };

  const getShiftTypeColor = (shiftType: string) => {
    const colors: { [key: string]: string } = {
      '2-2': '#4CAF50',
      '3-3': '#2196F3',
      '4-4': '#FF9800',
      '5-5': '#9C27B0',
      '6-2': '#F44336',
      '7-7': '#607D8B',
      '2-2-2-4': '#795548'
    };
    return colors[shiftType] || '#757575';
  };

  const getSchedulesForDate = (date: string) => {
    return schedules.filter(schedule => schedule.date === date);
  };

  const getHolidayForDate = (date: string) => {
    return holidays.find(holiday => holiday.date === date);
  };

  const renderDaySchedules = () => {
    const daySchedules = getSchedulesForDate(selectedDate);
    const holiday = getHolidayForDate(selectedDate);

    return (
      <View style={styles.dayScheduleContainer}>
        <Text style={styles.selectedDateTitle}>
          {format(parseISO(selectedDate), 'EEEE d MMMM yyyy', { locale: sv })}
        </Text>

        {holiday && (
          <View style={styles.holidayCard}>
            <Ionicons name="star" size={16} color="#d32f2f" />
            <Text style={styles.holidayText}>{holiday.name}</Text>
          </View>
        )}

        {daySchedules.length === 0 ? (
          <View style={styles.noScheduleCard}>
            <Ionicons name="calendar-outline" size={24} color="#757575" />
            <Text style={styles.noScheduleText}>Inga scheman för denna dag</Text>
          </View>
        ) : (
          daySchedules.map((schedule, index) => (
            <View key={index} style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <View style={[
                  styles.shiftTypeBadge,
                  { backgroundColor: getShiftTypeColor(schedule.shift_type) }
                ]}>
                  <Text style={styles.shiftTypeText}>{schedule.shift_type}</Text>
                </View>
                <Text style={styles.companyName}>{schedule.company_name}</Text>
              </View>
              
              <View style={styles.scheduleDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {schedule.start_time} - {schedule.end_time}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>{schedule.location}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="business-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>{schedule.department}</Text>
                </View>
              </View>

              {schedule.is_weekend && (
                <View style={styles.weekendBadge}>
                  <Text style={styles.weekendText}>Helg</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    );
  };

  const renderFilterModal = () => {
    const selectedCompanyData = companies.find(c => c.name === selectedCompany);

    return (
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtrera scheman</Text>
            <TouchableOpacity
              onPress={() => setFilterModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Företag</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    !selectedCompany && styles.filterChipSelected
                  ]}
                  onPress={() => setSelectedCompany('')}
                >
                  <Text style={[
                    styles.filterChipText,
                    !selectedCompany && styles.filterChipTextSelected
                  ]}>
                    Alla
                  </Text>
                </TouchableOpacity>
                {companies.map(company => (
                  <TouchableOpacity
                    key={company.id}
                    style={[
                      styles.filterChip,
                      selectedCompany === company.name && styles.filterChipSelected
                    ]}
                    onPress={() => setSelectedCompany(company.name)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      selectedCompany === company.name && styles.filterChipTextSelected
                    ]}>
                      {company.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {selectedCompanyData && (
              <>
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Ort</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                      style={[
                        styles.filterChip,
                        !selectedLocation && styles.filterChipSelected
                      ]}
                      onPress={() => setSelectedLocation('')}
                    >
                      <Text style={[
                        styles.filterChipText,
                        !selectedLocation && styles.filterChipTextSelected
                      ]}>
                        Alla
                      </Text>
                    </TouchableOpacity>
                    {selectedCompanyData.locations.map(location => (
                      <TouchableOpacity
                        key={location}
                        style={[
                          styles.filterChip,
                          selectedLocation === location && styles.filterChipSelected
                        ]}
                        onPress={() => setSelectedLocation(location)}
                      >
                        <Text style={[
                          styles.filterChipText,
                          selectedLocation === location && styles.filterChipTextSelected
                        ]}>
                          {location}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Avdelning</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                      style={[
                        styles.filterChip,
                        !selectedDepartment && styles.filterChipSelected
                      ]}
                      onPress={() => setSelectedDepartment('')}
                    >
                      <Text style={[
                        styles.filterChipText,
                        !selectedDepartment && styles.filterChipTextSelected
                      ]}>
                        Alla
                      </Text>
                    </TouchableOpacity>
                    {selectedCompanyData.departments.map(department => (
                      <TouchableOpacity
                        key={department}
                        style={[
                          styles.filterChip,
                          selectedDepartment === department && styles.filterChipSelected
                        ]}
                        onPress={() => setSelectedDepartment(department)}
                      >
                        <Text style={[
                          styles.filterChipText,
                          selectedDepartment === department && styles.filterChipTextSelected
                        ]}>
                          {department}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </>
            )}

            <View style={styles.filterSection}>
              <View style={styles.switchRow}>
                <Text style={styles.filterLabel}>Visa helgdagar</Text>
                <Switch
                  value={showHolidays}
                  onValueChange={setShowHolidays}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={showHolidays ? '#f5dd4b' : '#f4f3f4'}
                />
              </View>
            </View>

            <View style={styles.filterSection}>
              <View style={styles.switchRow}>
                <Text style={styles.filterLabel}>Visa helger</Text>
                <Switch
                  value={showWeekends}
                  onValueChange={setShowWeekends}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={showWeekends ? '#f5dd4b' : '#f4f3f4'}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                setFilterModalVisible(false);
                fetchShiftSchedules();
              }}
            >
              <Text style={styles.applyButtonText}>Tillämpa filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Svenska Skiftscheman</Text>
        <TouchableOpacity
          onPress={() => setFilterModalVisible(true)}
          style={styles.filterButton}
        >
          <Ionicons name="filter" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Calendar
          current={selectedDate}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          onMonthChange={(month) => setCurrentMonth(month.dateString.substring(0, 7))}
          markingType="multi-dot"
          markedDates={getMarkedDates()}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: '#2196F3',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#2196F3',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#00adf5',
            selectedDotColor: '#ffffff',
            arrowColor: '#2196F3',
            disabledArrowColor: '#d9e1e8',
            monthTextColor: '#2196F3',
            indicatorColor: '#2196F3',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13
          }}
          firstDay={1} // Måndag som första dag
          showWeekNumbers={true}
          locale="sv"
        />

        {renderDaySchedules()}
      </ScrollView>

      {renderFilterModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  dayScheduleContainer: {
    padding: 20,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  holidayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  holidayText: {
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: '500',
    marginLeft: 8,
  },
  noScheduleCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  noScheduleText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 8,
  },
  scheduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shiftTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  shiftTypeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  scheduleDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  weekendBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ff5722',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  weekendText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextSelected: {
    color: '#ffffff',
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  applyButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});