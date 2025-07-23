import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Calendar, DateData } from 'react-native-calendars'
import { Picker } from '@react-native-picker/picker'
import { supabase, CalendarShift, ShiftTeam } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface MarkedDates {
  [date: string]: {
    selected?: boolean
    selectedColor?: string
    marked?: boolean
    dotColor?: string
    customStyles?: {
      container?: {
        backgroundColor?: string
        borderRadius?: number
      }
      text?: {
        color?: string
        fontWeight?: string
      }
    }
  }
}

interface ShiftLegendItem {
  type: string
  color: string
  label: string
}

export default function AdvancedCalendar() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [shifts, setShifts] = useState<CalendarShift[]>([])
  const [shiftTeams, setShiftTeams] = useState<ShiftTeam[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string>('my_team')
  const [markedDates, setMarkedDates] = useState<MarkedDates>({})
  const [legend, setLegend] = useState<ShiftLegendItem[]>([])

  useEffect(() => {
    fetchShiftTeams()
  }, [])

  useEffect(() => {
    if (profile) {
      fetchShifts()
    }
  }, [selectedFilter, profile])

  const fetchShiftTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('shift_teams')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching shift teams:', error)
        return
      }

      setShiftTeams(data || [])
    } catch (error) {
      console.error('Error fetching shift teams:', error)
    }
  }

  const fetchShifts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_calendar_shifts', {
        filter_type: selectedFilter,
        user_team_id: selectedFilter === 'my_team' ? profile?.shift_team_id : null
      })

      if (error) {
        console.error('Error fetching calendar shifts:', error)
        Alert.alert('Fel', 'Kunde inte hämta scheman')
        return
      }

      setShifts(data || [])
      processShiftsForCalendar(data || [])
    } catch (error) {
      console.error('Error fetching calendar shifts:', error)
      Alert.alert('Fel', 'Något gick fel vid hämtning av scheman')
    } finally {
      setLoading(false)
    }
  }

  const processShiftsForCalendar = (shiftsData: CalendarShift[]) => {
    const marked: MarkedDates = {}
    const legendItems: ShiftLegendItem[] = []
    const usedColors = new Set<string>()

    // Group shifts by date
    const shiftsByDate: { [date: string]: CalendarShift[] } = {}
    
    shiftsData.forEach(shift => {
      const date = shift.start_time.split('T')[0] // Get YYYY-MM-DD format
      if (!shiftsByDate[date]) {
        shiftsByDate[date] = []
      }
      shiftsByDate[date].push(shift)
    })

    // Process each date
    Object.entries(shiftsByDate).forEach(([date, dayShifts]) => {
      if (dayShifts.length === 1) {
        // Single shift - use team color
        const shift = dayShifts[0]
        marked[date] = {
          customStyles: {
            container: {
              backgroundColor: shift.team_color,
              borderRadius: 8,
            },
            text: {
              color: '#fff',
              fontWeight: 'bold',
            },
          },
        }
      } else if (dayShifts.length > 1) {
        // Multiple shifts - use a gradient or striped pattern (simplified to first team color)
        const primaryShift = dayShifts[0]
        marked[date] = {
          customStyles: {
            container: {
              backgroundColor: primaryShift.team_color,
              borderRadius: 8,
            },
            text: {
              color: '#fff',
              fontWeight: 'bold',
            },
          },
          marked: true,
          dotColor: '#fff',
        }
      }
    })

    // Create legend for teams
    const teamColors = new Map<string, { name: string; color: string }>()
    shiftsData.forEach(shift => {
      if (!teamColors.has(shift.shift_team_id)) {
        teamColors.set(shift.shift_team_id, {
          name: shift.team_name,
          color: shift.team_color,
        })
      }
    })

    const teamLegend: ShiftLegendItem[] = Array.from(teamColors.values()).map(team => ({
      type: 'team',
      color: team.color,
      label: team.name,
    }))

    // Add shift type legend
    const shiftTypeLegend: ShiftLegendItem[] = [
      { type: 'morning', color: '#FFD700', label: 'Morgon' },
      { type: 'afternoon', color: '#FF8C00', label: 'Eftermiddag' },
      { type: 'night', color: '#4B0082', label: 'Natt' },
      { type: 'regular', color: '#808080', label: 'Vanligt' },
    ]

    // Add "Ledig" (Free day) legend
    const freeDayLegend: ShiftLegendItem[] = [
      { type: 'free', color: '#F0F0F0', label: 'L (Ledig)' },
    ]

    setMarkedDates(marked)
    setLegend([...teamLegend, ...shiftTypeLegend, ...freeDayLegend])
  }

  const onDayPress = (day: DateData) => {
    const dayShifts = shifts.filter(shift => 
      shift.start_time.startsWith(day.dateString)
    )

    if (dayShifts.length === 0) {
      Alert.alert('Ingen information', 'Inga scheman hittades för denna dag')
      return
    }

    const shiftInfo = dayShifts.map(shift => {
      const startTime = new Date(shift.start_time).toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit',
      })
      const endTime = new Date(shift.end_time).toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit',
      })
      return `${shift.team_name}: ${shift.title}\n${startTime} - ${endTime}`
    }).join('\n\n')

    Alert.alert(
      `Schema för ${day.dateString}`,
      shiftInfo,
      [{ text: 'OK' }]
    )
  }

  const getFilterOptions = () => {
    const options = [
      { label: 'Mitt lag', value: 'my_team' },
      { label: 'Alla lag', value: 'all' },
    ]

    // Add individual team options
    shiftTeams.forEach(team => {
      options.push({
        label: team.name,
        value: team.id,
      })
    })

    return options
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schema</Text>
        
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Visa:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedFilter}
              onValueChange={(itemValue) => setSelectedFilter(itemValue)}
              style={styles.picker}
            >
              {getFilterOptions().map(option => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Hämtar scheman...</Text>
        </View>
      ) : (
        <>
          <Calendar
            onDayPress={onDayPress}
            markedDates={markedDates}
            markingType="custom"
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
              disabledArrowColor: '#d9e1e8',
              monthTextColor: 'blue',
              indicatorColor: 'blue',
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '300',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '300',
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 13,
            }}
          />

          {legend.length > 0 && (
            <View style={styles.legendContainer}>
              <Text style={styles.legendTitle}>Förklaring</Text>
              <View style={styles.legendGrid}>
                {legend.map((item, index) => (
                  <View key={`${item.type}-${index}`} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColor,
                        { backgroundColor: item.color }
                      ]}
                    />
                    <Text style={styles.legendLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  legendContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '48%',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  legendLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
})