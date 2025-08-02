import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Alert, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CalendarList } from 'react-native-calendars';
import * as Calendar from 'expo-calendar';
import { supabase } from '../lib/supabase';
import { getColorForTeam } from '../utils/shiftColors';
import { exportShiftsToICS } from '../utils/icsExport';

export default function CalendarView() {
  const [markedDates, setMarkedDates] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [viewMode, setViewMode] = useState('month'); // 'month' eller 'year'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchShifts();
  }, [selectedTeam]);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('shifts').select('*');
      
      // Filtrera på team om valt
      if (selectedTeam) {
        query = query.eq('team', selectedTeam);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching shifts:', error);
        Alert.alert('Fel', 'Kunde inte hämta skiftdata');
        return;
      }

      setShifts(data || []);
      updateMarkedDates(data || []);
    } catch (error) {
      console.error('Error in fetchShifts:', error);
      Alert.alert('Fel', 'Ett oväntat fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  const updateMarkedDates = (shiftsData) => {
    const markings = {};
    
    shiftsData.forEach((shift) => {
      const date = shift.date;
      const team = shift.team;
      const color = getColorForTeam(team);
      
      markings[date] = {
        customStyles: {
          container: { 
            backgroundColor: color,
            borderRadius: 8,
            elevation: 2,
          },
          text: { 
            color: '#fff',
            fontWeight: 'bold'
          }
        }
      };
    });
    
    setMarkedDates(markings);
  };

  const syncToCalendar = async () => {
    if (shifts.length === 0) {
      Alert.alert('Ingen data', 'Inga skift att synka');
      return;
    }

    setLoading(true);
    try {
      const calendarId = await getDefaultCalendarId();
      if (!calendarId) {
        setLoading(false);
        return;
      }

      let syncedCount = 0;
      
      for (const shift of shifts) {
        try {
          await Calendar.createEventAsync(calendarId, {
            title: `Skift: ${shift.type || 'Okänt'} (Lag ${shift.team})`,
            startDate: new Date(`${shift.date}T${shift.start_time || '06:00'}`),
            endDate: new Date(`${shift.date}T${shift.end_time || '18:00'}`),
            timeZone: 'Europe/Stockholm',
            location: shift.location || 'Arbetsplats',
            notes: `Skifttyp: ${shift.type || 'Okänt'}\nLag: ${shift.team}`,
          });
          syncedCount++;
        } catch (eventError) {
          console.error('Error creating event:', eventError);
        }
      }

      Alert.alert(
        'Synkning klar!', 
        `${syncedCount} skift har synkats till din kalender`
      );
    } catch (error) {
      console.error('Error in syncToCalendar:', error);
      Alert.alert('Fel', 'Kunde inte synka till kalender');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultCalendarId = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Kalenderåtkomst krävs', 
          'Appen behöver tillgång till din kalender för att synka skift'
        );
        return null;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find((cal) =>
        Platform.OS === 'ios' 
          ? cal.allowsModifications && cal.source.name !== 'Subscribed Calendars'
          : cal.accessLevel === Calendar.CalendarAccessLevel.OWNER
      ) || calendars.find(cal => cal.allowsModifications);

      if (!defaultCalendar) {
        Alert.alert('Fel', 'Ingen redigerbar kalender hittades');
        return null;
      }

      return defaultCalendar.id;
    } catch (error) {
      console.error('Error getting calendar permissions:', error);
      Alert.alert('Fel', 'Kunde inte få kalenderåtkomst');
      return null;
    }
  };

  const exportToICS = async () => {
    if (shifts.length === 0) {
      Alert.alert('Ingen data', 'Inga skift att exportera');
      return;
    }

    setLoading(true);
    try {
      const result = await exportShiftsToICS(shifts, selectedTeam);
      Alert.alert(
        'Export lyckades!', 
        `Skiftschema exporterat som ${result.filename}`
      );
    } catch (error) {
      console.error('Error exporting to ICS:', error);
      Alert.alert(
        'Export misslyckades', 
        error.message || 'Kunde inte exportera skiftschema'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header med titel */}
      <View style={styles.header}>
        <Text style={styles.title}>Skiftkalender</Text>
      </View>

      {/* Team selector */}
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Välj skiftlag:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedTeam}
            onValueChange={(itemValue) => setSelectedTeam(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Alla lag" value={null} />
            <Picker.Item label="Lag 31" value={31} />
            <Picker.Item label="Lag 32" value={32} />
            <Picker.Item label="Lag 33" value={33} />
            <Picker.Item label="Lag 34" value={34} />
            <Picker.Item label="Lag 35" value={35} />
          </Picker>
        </View>
      </View>

      {/* View mode toggle */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'month' && styles.activeViewMode]}
          onPress={() => setViewMode('month')}
        >
          <Text style={[styles.viewModeText, viewMode === 'month' && styles.activeViewModeText]}>
            Månad
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'year' && styles.activeViewMode]}
          onPress={() => setViewMode('year')}
        >
          <Text style={[styles.viewModeText, viewMode === 'year' && styles.activeViewModeText]}>
            År
          </Text>
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        <CalendarList
          pastScrollRange={viewMode === 'year' ? 24 : 12}
          futureScrollRange={viewMode === 'year' ? 24 : 12}
          scrollEnabled
          showScrollIndicator
          markingType={'custom'}
          markedDates={markedDates}
          calendarHeight={viewMode === 'year' ? 200 : 350}
          theme={{
            backgroundColor: '#ffffff',
            calendarBackground: '#ffffff',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: '#00adf5',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#00adf5',
            dayTextColor: '#2d4150',
            textDisabledColor: '#d9e1e8',
            dotColor: '#00adf5',
            selectedDotColor: '#ffffff',
            arrowColor: 'orange',
            monthTextColor: 'blue',
            indicatorColor: 'blue',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 13
          }}
        />
      </View>

      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.syncButton, loading && styles.disabledButton]}
          onPress={syncToCalendar}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Synkar...' : 'Synka till Kalender'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.exportButton]}
          onPress={exportToICS}
        >
          <Text style={styles.buttonText}>Exportera .ics</Text>
        </TouchableOpacity>
      </View>

      {/* Info text */}
      {selectedTeam && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Visar skift för Lag {selectedTeam} • {shifts.length} skift
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    padding: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  picker: {
    height: 50,
  },
  viewModeContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: 15,
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeViewMode: {
    backgroundColor: '#007AFF',
  },
  viewModeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeViewModeText: {
    color: '#fff',
  },
  calendarContainer: {
    flex: 1,
    marginHorizontal: 15,
    marginTop: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  buttonContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginVertical: 15,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  syncButton: {
    backgroundColor: '#4CAF50',
  },
  exportButton: {
    backgroundColor: '#FF9800',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  infoText: {
    textAlign: 'center',
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
  },
});