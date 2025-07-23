import { Picker } from '@react-native-picker/picker';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
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

export default function ShiftScheduleTable() {
  const teams = getAllTeams();
  const [selectedTeam, setSelectedTeam] = useState(teams[0]);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedShift, setSelectedShift] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);

  // Hämta alla skift för valt team
  const allShifts = getShifts(selectedTeam.companyId, selectedTeam.departmentId, selectedTeam.teamId);

  // Sortera skift
  const sortedShifts = useMemo(() => {
    return [...allShifts].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'start_time':
          aValue = a.start_time;
          bValue = b.start_time;
          break;
        default:
          aValue = a.date;
          bValue = b.date;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [allShifts, sortBy, sortOrder]);

  // Formatera datum
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Hantera sortering
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Hantera skift-åtgärd
  const handleShiftAction = (shift, action) => {
    setSelectedShift(shift);
    setShowActionModal(true);
  };

  // Starta chatt
  const startChat = () => {
    Alert.alert(
      'Starta chatt',
      `Starta chatt för ${selectedShift.type} passet ${formatDate(selectedShift.date)}?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Starta', 
          onPress: () => {
            // Här kan du integrera med ditt chattsystem
            Alert.alert('Chatt startad', 'Du har skickats till en chatt för detta skift.');
            setShowActionModal(false);
          }
        }
      ]
    );
  };

  // Visa intresse
  const showInterest = () => {
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
            setShowActionModal(false);
          }
        }
      ]
    );
  };

  // Tabellhuvud
  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <TouchableOpacity 
        style={[styles.headerCell, styles.dateCell]} 
        onPress={() => handleSort('date')}
      >
        <Text style={styles.headerText}>
          Datum {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.headerCell, styles.typeCell]} 
        onPress={() => handleSort('type')}
      >
        <Text style={styles.headerText}>
          Typ {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.headerCell, styles.timeCell]} 
        onPress={() => handleSort('start_time')}
      >
        <Text style={styles.headerText}>
          Tid {sortBy === 'start_time' && (sortOrder === 'asc' ? '↑' : '↓')}
        </Text>
      </TouchableOpacity>
      
      <View style={[styles.headerCell, styles.breakCell]}>
        <Text style={styles.headerText}>Rast</Text>
      </View>
      
      <View style={[styles.headerCell, styles.actionCell]}>
        <Text style={styles.headerText}>Åtgärd</Text>
      </View>
    </View>
  );

  // Tabellrad
  const TableRow = ({ shift }) => (
    <View style={styles.tableRow}>
      <View style={[styles.cell, styles.dateCell]}>
        <Text style={styles.cellText}>{formatDate(shift.date)}</Text>
      </View>
      
      <View style={[styles.cell, styles.typeCell]}>
        <Text style={[styles.cellText, styles.shiftType]}>{shift.type}</Text>
      </View>
      
      <View style={[styles.cell, styles.timeCell]}>
        <Text style={styles.cellText}>
          {shift.start_time} - {shift.end_time}
        </Text>
      </View>
      
      <View style={[styles.cell, styles.breakCell]}>
        <Text style={styles.cellText}>{shift.break_minutes} min</Text>
      </View>
      
      <View style={[styles.cell, styles.actionCell]}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleShiftAction(shift, 'chat')}
        >
          <Text style={styles.actionButtonText}>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.interestButton]}
          onPress={() => handleShiftAction(shift, 'interest')}
        >
          <Text style={styles.actionButtonText}>💼</Text>
        </TouchableOpacity>
      </View>
    </View>
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

      {/* Statistik */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Visar {sortedShifts.length} skift för {selectedTeam.teamName}
        </Text>
      </View>

      {/* Tabell */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableContainer}>
          <TableHeader />
          <ScrollView style={styles.tableBody}>
            {sortedShifts.map((shift) => (
              <TableRow key={shift.shift_id} shift={shift} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Åtgärd modal */}
      <Modal
        visible={showActionModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowActionModal(false)}
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
                onPress={startChat}
              >
                <Text style={styles.modalButtonText}>💬 Starta chatt</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.interestButton]} 
                onPress={showInterest}
              >
                <Text style={styles.modalButtonText}>💼 Visa intresse</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowActionModal(false)}
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
  statsContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  tableContainer: {
    flex: 1,
    minWidth: 600,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomColor: '#dee2e6',
  },
  headerCell: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
  },
  tableBody: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    backgroundColor: '#fff',
  },
  cell: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  shiftType: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  // Kolumnbredder
  dateCell: {
    width: 120,
  },
  typeCell: {
    width: 100,
  },
  timeCell: {
    width: 120,
  },
  breakCell: {
    width: 80,
  },
  actionCell: {
    width: 120,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  interestButton: {
    backgroundColor: '#28a745',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
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