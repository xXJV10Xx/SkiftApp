import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { Calendar, DateData } from 'react-native-calendars'
import { supabase } from '../lib/supabase'
import { exportShiftsToICS, downloadICS, addToGoogleCalendar } from '../lib/calendar-export'
import { Ionicons } from '@expo/vector-icons'

interface Shift {
  id: string
  summary: string
  start_time: string
  end_time: string
  location?: string
  description?: string
}

interface CalendarViewProps {
  calendarId?: string
}

export default function CalendarView({ calendarId }: CalendarViewProps) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [markedDates, setMarkedDates] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchShifts()
  }, [calendarId])

  const fetchShifts = async () => {
    try {
      setLoading(true)
      let query = supabase.from('shifts').select('*').order('start_time', { ascending: true })
      
      if (calendarId) {
        query = query.eq('calendar_id', calendarId)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Fel vid hämtning av skift:', error)
        return
      }

      setShifts(data || [])
      
      // Mark dates with shifts
      const marked: any = {}
      data?.forEach(shift => {
        const date = new Date(shift.start_time).toISOString().split('T')[0]
        marked[date] = {
          marked: true,
          dotColor: '#3B82F6',
          activeOpacity: 0.7
        }
      })
      setMarkedDates(marked)

    } catch (error) {
      console.error('❌ Fel vid hämtning av skift:', error)
    } finally {
      setLoading(false)
    }
  }

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString)
  }

  const getShiftsForDate = (date: string) => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time).toISOString().split('T')[0]
      return shiftDate === date
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleExportICS = async () => {
    try {
      const icsContent = await exportShiftsToICS(calendarId)
      downloadICS(icsContent, `skift-${new Date().toISOString().split('T')[0]}.ics`)
      Alert.alert('✅ Export klar', 'ICS-fil har laddats ner')
    } catch (error) {
      Alert.alert('❌ Export misslyckades', 'Kunde inte exportera till ICS')
    }
  }

  const handleAddToGoogle = async (shift: Shift) => {
    try {
      await addToGoogleCalendar({
        summary: shift.summary,
        start_time: shift.start_time,
        end_time: shift.end_time,
        location: shift.location,
        description: shift.description
      })
    } catch (error) {
      Alert.alert('❌ Fel', 'Kunde inte lägga till i Google Calendar')
    }
  }

  const selectedShifts = selectedDate ? getShiftsForDate(selectedDate) : []

  return (
    <View style={styles.container}>
      {/* Header with export buttons */}
      <View style={styles.header}>
        <Text style={styles.title}>📅 Skiftkalender</Text>
        <View style={styles.exportButtons}>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportICS}>
            <Ionicons name="download-outline" size={20} color="#fff" />
            <Text style={styles.exportButtonText}>ICS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar */}
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: '#3B82F6'
          }
        }}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#3B82F6',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#3B82F6',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#3B82F6',
          selectedDotColor: '#ffffff',
          arrowColor: '#3B82F6',
          disabledArrowColor: '#d9e1e8',
          monthTextColor: '#2d4150',
          indicatorColor: '#3B82F6',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13
        }}
      />

      {/* Selected date shifts */}
      {selectedDate && (
        <View style={styles.shiftsContainer}>
          <Text style={styles.dateTitle}>
            {new Date(selectedDate).toLocaleDateString('sv-SE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          
          <ScrollView style={styles.shiftsList}>
            {selectedShifts.length === 0 ? (
              <Text style={styles.noShifts}>Inga skift denna dag</Text>
            ) : (
              selectedShifts.map(shift => (
                <View key={shift.id} style={styles.shiftCard}>
                  <View style={styles.shiftHeader}>
                    <Text style={styles.shiftTitle}>{shift.summary}</Text>
                    <TouchableOpacity 
                      style={styles.googleButton}
                      onPress={() => handleAddToGoogle(shift)}
                    >
                      <Ionicons name="logo-google" size={16} color="#4285F4" />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.shiftTime}>
                    🕐 {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                  </Text>
                  
                  {shift.location && (
                    <Text style={styles.shiftLocation}>
                      📍 {shift.location}
                    </Text>
                  )}
                  
                  {shift.description && (
                    <Text style={styles.shiftDescription}>
                      {shift.description}
                    </Text>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 10
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  shiftsContainer: {
    flex: 1,
    padding: 20
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textTransform: 'capitalize'
  },
  shiftsList: {
    flex: 1
  },
  noShifts: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 16,
    marginTop: 40
  },
  shiftCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1
  },
  googleButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8fafc'
  },
  shiftTime: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 4
  },
  shiftLocation: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4
  },
  shiftDescription: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic'
  }
})