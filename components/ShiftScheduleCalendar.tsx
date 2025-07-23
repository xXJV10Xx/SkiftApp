import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import shiftData from '../skiftschema-output.json';

// Konfigurera svenska veckodagar/månader
LocaleConfig.locales['sv'] = {
  monthNames: [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ],
  monthNamesShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
  ],
  dayNames: [
    'Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'
  ],
  dayNamesShort: ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'],
  today: 'Idag'
};
LocaleConfig.defaultLocale = 'sv';

// Hjälpfunktion för att hämta alla teams
function getAllTeams() {
  const teams = [];
  for (const company of shiftData) {
    for (const dept of company.departments) {
      for (const team of dept.teams) {
        teams.push({
          companyId: company.company_id,
          companyName: company.company_name,
          departmentId: dept.department_id,
          departmentName: dept.department_name,
          teamId: team.team_id,
          teamName: team.team_name
        });
      }
    }
  }
  return teams;
}

// Hjälpfunktion för att hämta skift för ett team
function getShifts(companyId, departmentId, teamId) {
  const company = shiftData.find(c => c.company_id === companyId);
  if (!company) return [];
  const department = company.departments.find(d => d.department_id === departmentId);
  if (!department) return [];
  const team = department.teams.find(t => t.team_id === teamId);
  if (!team) return [];
  return team.shifts;
}

export default function ShiftScheduleCalendar() {
  const teams = getAllTeams();
  const [selectedTeam, setSelectedTeam] = useState(teams[0]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [shiftsForDay, setShiftsForDay] = useState([]);

  // Markera alla dagar med skift
  const shifts = getShifts(selectedTeam.companyId, selectedTeam.departmentId, selectedTeam.teamId);
  const markedDates = {};
  shifts.forEach(shift => {
    markedDates[shift.date] = {
      marked: true,
      dotColor: '#007AFF',
      customStyles: {
        container: { backgroundColor: '#e6f0ff' },
        text: { color: '#007AFF', fontWeight: 'bold' }
      }
    };
  });

  // Hantera klick på dag
  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    const dayShifts = shifts.filter(s => s.date === day.dateString);
    setShiftsForDay(dayShifts);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Teamväljare */}
      <FlatList
        data={teams}
        horizontal
        keyExtractor={item => item.teamId}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.teamButton, selectedTeam.teamId === item.teamId && styles.teamButtonActive]}
            onPress={() => setSelectedTeam(item)}
          >
            <Text style={styles.teamButtonText}>{item.companyName} - {item.departmentName} - {item.teamName}</Text>
          </TouchableOpacity>
        )}
        style={{ marginBottom: 12, maxHeight: 48 }}
        showsHorizontalScrollIndicator={false}
      />

      {/* Kalender */}
      <Calendar
        markedDates={markedDates}
        markingType={'dot'}
        onDayPress={onDayPress}
        theme={{
          todayTextColor: '#007AFF',
          selectedDayBackgroundColor: '#007AFF',
          selectedDayTextColor: '#fff',
          dotColor: '#007AFF',
          arrowColor: '#007AFF',
        }}
        style={styles.calendar}
      />

      {/* Modal för skiftdetaljer */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Skift {selectedDate}</Text>
            {shiftsForDay.length === 0 ? (
              <Text>Inga skift denna dag.</Text>
            ) : (
              shiftsForDay.map((shift, idx) => (
                <View key={idx} style={styles.shiftCard}>
                  <Text style={styles.shiftType}>{shift.type}</Text>
                  <Text>Tid: {shift.start_time} - {shift.end_time}</Text>
                  <Text>Rast: {shift.break_minutes} min</Text>
                </View>
              ))
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Stäng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  calendar: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  teamButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  teamButtonActive: {
    backgroundColor: '#007AFF',
  },
  teamButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  shiftCard: {
    backgroundColor: '#e6f0ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: '100%',
  },
  shiftType: {
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 