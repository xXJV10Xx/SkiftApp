import React, { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Calendar, DateData } from 'react-native-calendars'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

interface Shift {
  id: string
  title: string
  start_time: string
  end_time: string
  shift_type: string
  shift_team_id: string
  team_name: string
  team_color: string
  company_name: string
  user_id: string
  user_name: string
  notes: string
  cycle_day: number
  is_generated: boolean
  is_my_shift: boolean
  is_available_for_trade: boolean
  created_at: string
}

interface Team {
  id: string
  name: string
  color_hex: string
  company_name: string
}

interface CalendarDay {
  dateString: string
  day: number
  month: number
  year: number
  timestamp: number
  textColor: string
  backgroundColor: string
  marked: boolean
  dotColor: string
  dots: Array<{ key: string; color: string; selectedDotColor: string }>
}

export const LoveableCalendar: React.FC = () => {
  const { user } = useAuth()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({})
  const [selectedDate, setSelectedDate] = useState<string>('')

  // Fetch teams for filter dropdown
  const fetchTeams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('shift_teams')
        .select(`
          id,
          name,
          color_hex,
          companies(name)
        `)
        .order('name')

      if (error) throw error

      const teamsWithCompany = data?.map(team => ({
        id: team.id,
        name: team.name,
        color_hex: team.color_hex,
        company_name: team.companies?.name || 'Okänt företag'
      })) || []

      setTeams(teamsWithCompany)
    } catch (error) {
      console.error('Error fetching teams:', error)
      Alert.alert('Fel', 'Kunde inte hämta team')
    }
  }, [])

  // Fetch shifts for calendar
  const fetchShifts = useCallback(async (teamFilter: string = 'all') => {
    if (!user) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .rpc('get_calendar_shifts', {
          p_team_filter_id: teamFilter,
          p_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          p_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          p_user_id: user.id
        })

      if (error) throw error

      setShifts(data || [])
      generateMarkedDates(data || [])
    } catch (error) {
      console.error('Error fetching shifts:', error)
      Alert.alert('Fel', 'Kunde inte hämta skift')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Generate marked dates for calendar
  const generateMarkedDates = useCallback((shiftsData: Shift[]) => {
    const marked: Record<string, any> = {}
    
    shiftsData.forEach(shift => {
      const date = new Date(shift.start_time).toISOString().split('T')[0]
      const shiftType = shift.shift_type
      
      if (!marked[date]) {
        marked[date] = {
          marked: true,
          dots: [],
          backgroundColor: '#f0f0f0'
        }
      }

      // Add dot for this shift
      marked[date].dots.push({
        key: shift.id,
        color: shift.team_color,
        selectedDotColor: shift.team_color
      })

      // Set background color based on shift type
      if (shiftType === 'L' || shiftType === 'ledig') {
        marked[date].backgroundColor = '#e8f5e8' // Light green for free days
      } else if (shift.is_my_shift) {
        marked[date].backgroundColor = '#fff3cd' // Light yellow for my shifts
      } else if (shift.is_available_for_trade) {
        marked[date].backgroundColor = '#d1ecf1' // Light blue for available trades
      }
    })

    setMarkedDates(marked)
  }, [])

  // Handle team filter change
  const handleTeamFilterChange = (teamId: string) => {
    setSelectedTeam(teamId)
    fetchShifts(teamId)
  }

  // Handle date selection
  const handleDateSelect = (day: DateData) => {
    setSelectedDate(day.dateString)
    const dayShifts = shifts.filter(shift => 
      new Date(shift.start_time).toISOString().split('T')[0] === day.dateString
    )
    
    if (dayShifts.length > 0) {
      showDayShifts(dayShifts, day.dateString)
    }
  }

  // Show shifts for selected day
  const showDayShifts = (dayShifts: Shift[], date: string) => {
    const dateObj = new Date(date)
    const formattedDate = dateObj.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    let message = `Skift för ${formattedDate}:\n\n`
    
    dayShifts.forEach(shift => {
      const startTime = new Date(shift.start_time).toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
      })
      const endTime = new Date(shift.end_time).toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
      })
      
      const shiftTypeText = getShiftTypeText(shift.shift_type)
      const ownerText = shift.user_name || 'Ingen tilldelad'
      
      message += `• ${shiftTypeText} (${startTime}-${endTime})\n`
      message += `  Team: ${shift.team_name}\n`
      message += `  Ansvarig: ${ownerText}\n\n`
    })

    Alert.alert('Skift för dagen', message)
  }

  // Get Swedish text for shift type
  const getShiftTypeText = (shiftType: string): string => {
    const shiftTypeMap: Record<string, string> = {
      'M': 'Morgonskift',
      'A': 'Eftermiddagsskift',
      'N': 'Nattskift',
      'F': 'Fredagsskift',
      'E': 'Helgskift',
      'D': 'Dagsskift',
      'L': 'Ledig',
      'D12': '12-timmars dag',
      'N12': '12-timmars natt',
      'NH': 'Natt helg',
      'FH': 'Fredag helg',
      'FE': 'Fredag eftermiddag',
      'EN': 'Enskift',
      'morgon': 'Morgonskift',
      'kväll': 'Eftermiddagsskift',
      'natt': 'Nattskift',
      'helg': 'Helgskift',
      'ledig': 'Ledig',
      'övertid': 'Övertid'
    }
    
    return shiftTypeMap[shiftType] || shiftType
  }

  // Initialize data
  useEffect(() => {
    fetchTeams()
    fetchShifts()
  }, [fetchTeams, fetchShifts])

  return (
    <View style={styles.container}>
      {/* Team Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filtrera efter team:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedTeam === 'all' && styles.filterButtonActive
            ]}
            onPress={() => handleTeamFilterChange('all')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedTeam === 'all' && styles.filterButtonTextActive
            ]}>
              Alla team
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedTeam === 'my_team' && styles.filterButtonActive
            ]}
            onPress={() => handleTeamFilterChange('my_team')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedTeam === 'my_team' && styles.filterButtonTextActive
            ]}>
              Mitt team
            </Text>
          </TouchableOpacity>

          {teams.map(team => (
            <TouchableOpacity
              key={team.id}
              style={[
                styles.filterButton,
                selectedTeam === team.id && styles.filterButtonActive
              ]}
              onPress={() => handleTeamFilterChange(team.id)}
            >
              <View style={[styles.teamColor, { backgroundColor: team.color_hex }]} />
              <Text style={[
                styles.filterButtonText,
                selectedTeam === team.id && styles.filterButtonTextActive
              ]}>
                {team.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Calendar */}
      <Calendar
        style={styles.calendar}
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
          arrowColor: '#00adf5',
          monthTextColor: '#2d4150',
          indicatorColor: '#00adf5',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13
        }}
        markedDates={markedDates}
        onDayPress={handleDateSelect}
        markingType="multi-dot"
        hideExtraDays={true}
        disableMonthChange={false}
        firstDay={1} // Monday
        hideDayNames={false}
        showWeekNumbers={false}
        disableArrowLeft={false}
        disableArrowRight={false}
        disableAllTouchEventsForDisabledDays={true}
        enableSwipeMonths={true}
      />

      {/* Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Förklaring:</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#fff3cd' }]} />
          <Text style={styles.legendText}>Mina skift</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#d1ecf1' }]} />
          <Text style={styles.legendText}>Tillgängliga för byte</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#e8f5e8' }]} />
          <Text style={styles.legendText}>Lediga dagar</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#f0f0f0' }]} />
          <Text style={styles.legendText}>Andra skift</Text>
        </View>
      </View>

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Laddar skift...</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2d4150',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  filterButtonActive: {
    backgroundColor: '#00adf5',
    borderColor: '#00adf5',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#2d4150',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  teamColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  calendar: {
    marginBottom: 16,
  },
  legendContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2d4150',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#2d4150',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    fontSize: 16,
    color: '#2d4150',
  },
}) 