import { Picker } from '@react-native-picker/picker';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import shiftData from '../skiftschema-output.json';

// Hjälpfunktioner
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

function getShifts(companyId, departmentId, teamId) {
  const company = shiftData.find(c => c.company_id === companyId);
  if (!company) return [];
  const department = company.departments.find(d => d.department_id === departmentId);
  if (!department) return [];
  const team = department.teams.find(t => t.team_id === teamId);
  if (!team) return [];
  return team.shifts;
}

export default function ShiftScheduleList() {
  const teams = getAllTeams();
  const [selectedTeam, setSelectedTeam] = useState(teams[0]);
  const [searchText, setSearchText] = useState('');
  const [selectedShiftType, setSelectedShiftType] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);

  // Hämta alla skift för valt team
  const allShifts = getShifts(selectedTeam.companyId, selectedTeam.departmentId, selectedTeam.teamId);

  // Filtrera skift baserat på söktext, typ och datum
  const filteredShifts = useMemo(() => {
    return allShifts.filter(shift => {
      const matchesSearch = searchText === '' || 
        shift.type.toLowerCase().includes(searchText.toLowerCase()) ||
        shift.date.includes(searchText);
      
      const matchesType = selectedShiftType === 'all' || shift.type === selectedShiftType;
      const matchesDate = selectedDate === '' || shift.date === selectedDate;
      
      return matchesSearch && matchesType && matchesDate;
    });
  }, [allShifts, searchText, selectedShiftType, selectedDate]);

  // Hämta unika skifttyper för filter
  const shiftTypes = useMemo(() => {
    const types = [...new Set(allShifts.map(s => s.type))];
    return ['all', ...types];
  }, [allShifts]);

  // Hämta unika datum för filter
  const dates = useMemo(() => {
    const uniqueDates = [...new Set(allShifts.map(s => s.date))].sort();
    return ['', ...uniqueDates];
  }, [allShifts]);

  // Formatera datum för visning
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Hantera klick på skift
  const handleShiftPress = (shift) => {
    setSelectedShift(shift);
    setShowChatModal(true);
  };

  // Starta chatt om skift
  const startShiftChat = () => {
    Alert.alert(
      'Starta chatt',
      `Vill du starta en chatt om ${selectedShift.type} passet ${formatDate(selectedShift.date)}?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Starta chatt', 
          onPress: () => {
            // Här kan du integrera med ditt chattsystem
            Alert.alert('Chatt startad', 'Du har skickats till en chatt för detta skift.');
            setShowChatModal(false);
          }
        }
      ]
    );
  };

  // Visa skiftintresse
  const showShiftInterest = () => {
    Alert.alert(
      'Skiftintresse',
      `Visa intresse för ${selectedShift.type} passet ${formatDate(selectedShift.date)}?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Visa intresse', 
          onPress: () => {
            // Här kan du integrera med skiftintresse-systemet
            Alert.alert('Intresse registrerat', 'Ditt intresse har registrerats.');
            setShowChatModal(false);
          }
        }
      ]
    );
  };

  const renderShiftItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.shiftItem}
      onPress={() => handleShiftPress(item)}
    >
      <View style={styles.shiftHeader}>
        <Text style={styles.shiftType}>{item.type}</Text>
        <Text style={styles.shiftDate}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.shiftDetails}>
        <Text style={styles.shiftTime}>
          {item.start_time} - {item.end_time}
        </Text>
        <Text style={styles.shiftBreak}>
          Rast: {item.break_minutes} min
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Teamväljare */}
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Välj team:</Text>
        <Picker
          selectedValue={selectedTeam.teamId}
          onValueChange={(itemValue) => {
            const team = teams.find(t => t.teamId === itemValue);
            setSelectedTeam(team);
          }}
          style={styles.picker}
        >
          {teams.map((team) => (
            <Picker.Item 
              key={team.teamId} 
              label={`${team.companyName} - ${team.departmentName} - ${team.teamName}`} 
              value={team.teamId} 
            />
          ))}
        </Picker>
      </View>

      {/* Sök och filter */}
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Sök skift..."
          value={searchText}
          onChangeText={setSearchText}
        />
        
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Skifttyp:</Text>
            <Picker
              selectedValue={selectedShiftType}
              onValueChange={setSelectedShiftType}
              style={styles.filterPicker}
            >
              {shiftTypes.map((type) => (
                <Picker.Item 
                  key={type} 
                  label={type === 'all' ? 'Alla typer' : type} 
                  value={type} 
                />
              ))}
            </Picker>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Datum:</Text>
            <Picker
              selectedValue={selectedDate}
              onValueChange={setSelectedDate}
              style={styles.filterPicker}
            >
              {dates.map((date) => (
                <Picker.Item 
                  key={date} 
                  label={date === '' ? 'Alla datum' : formatDate(date)} 
                  value={date} 
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* Statistik */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Visar {filteredShifts.length} av {allShifts.length} skift
        </Text>
      </View>

      {/* Skiftlista */}
      <FlatList
        data={filteredShifts}
        renderItem={renderShiftItem}
        keyExtractor={(item) => item.shift_id}
        style={styles.shiftList}
        showsVerticalScrollIndicator={false}
      />

      {/* Chat modal */}
      <Modal
        visible={showChatModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowChatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedShift?.type} - {selectedShift && formatDate(selectedShift.date)}
            </Text>
            
            {selectedShift && (
              <View style={styles.shiftInfo}>
                <Text style={styles.shiftInfoText}>
                  Tid: {selectedShift.start_time} - {selectedShift.end_time}
                </Text>
                <Text style={styles.shiftInfoText}>
                  Rast: {selectedShift.break_minutes} minuter
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={startShiftChat}
              >
                <Text style={styles.modalButtonText}>💬 Starta chatt</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.interestButton]} 
                onPress={showShiftInterest}
              >
                <Text style={styles.modalButtonText}>💼 Visa intresse</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowChatModal(false)}
            >
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
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  picker: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  filterContainer: {
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterItem: {
    flex: 1,
    marginRight: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#666',
  },
  filterPicker: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statsContainer: {
    marginBottom: 12,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  shiftList: {
    flex: 1,
  },
  shiftItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  shiftDate: {
    fontSize: 14,
    color: '#666',
  },
  shiftDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shiftTime: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  shiftBreak: {
    fontSize: 14,
    color: '#666',
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
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  shiftInfo: {
    marginBottom: 20,
    alignItems: 'center',
  },
  shiftInfoText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  interestButton: {
    backgroundColor: '#28a745',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 