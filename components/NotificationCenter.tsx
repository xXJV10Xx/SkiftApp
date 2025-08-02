import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Notifications from 'expo-notifications'
import { supabase } from '../lib/supabase'

interface NotificationSettings {
  id: string
  user_id: string
  shift_reminders: boolean
  reminder_time: number // minutes before shift
  email_notifications: boolean
  push_notifications: boolean
  weekend_notifications: boolean
}

interface ShiftNotification {
  id: string
  shift_id: string
  title: string
  body: string
  scheduled_time: string
  sent: boolean
  created_at: string
}

export default function NotificationCenter() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [notifications, setNotifications] = useState<ShiftNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
    fetchNotifications()
    requestNotificationPermissions()
  }, [])

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Behörighet krävs', 'För att få aviseringar behöver du ge behörighet i inställningar')
    }
  }

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Fel vid hämtning av inställningar:', error)
        return
      }

      if (data) {
        setSettings(data)
      } else {
        // Create default settings
        const defaultSettings = {
          user_id: user.id,
          shift_reminders: true,
          reminder_time: 60, // 1 hour before
          email_notifications: true,
          push_notifications: true,
          weekend_notifications: false
        }

        const { data: newSettings, error: createError } = await supabase
          .from('notification_settings')
          .insert(defaultSettings)
          .select()
          .single()

        if (createError) {
          console.error('❌ Fel vid skapande av inställningar:', createError)
        } else {
          setSettings(newSettings)
        }
      }
    } catch (error) {
      console.error('❌ Fel vid hämtning av inställningar:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('shift_notifications')
        .select(`
          *,
          shifts (
            summary,
            start_time,
            end_time
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('❌ Fel vid hämtning av aviseringar:', error)
        return
      }

      setNotifications(data || [])
    } catch (error) {
      console.error('❌ Fel vid hämtning av aviseringar:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: keyof NotificationSettings, value: any) => {
    if (!settings) return

    try {
      const updatedSettings = { ...settings, [key]: value }
      
      const { error } = await supabase
        .from('notification_settings')
        .update({ [key]: value })
        .eq('id', settings.id)

      if (error) {
        console.error('❌ Fel vid uppdatering av inställningar:', error)
        Alert.alert('❌ Fel', 'Kunde inte uppdatera inställningar')
        return
      }

      setSettings(updatedSettings)
      
      // Schedule/cancel notifications based on new settings
      if (key === 'push_notifications' || key === 'shift_reminders') {
        if (value) {
          await scheduleUpcomingShiftNotifications()
        } else {
          await Notifications.cancelAllScheduledNotificationsAsync()
        }
      }

    } catch (error) {
      console.error('❌ Fel vid uppdatering av inställningar:', error)
    }
  }

  const scheduleUpcomingShiftNotifications = async () => {
    if (!settings?.push_notifications || !settings?.shift_reminders) return

    try {
      // Get upcoming shifts
      const { data: shifts, error } = await supabase
        .from('shifts')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10)

      if (error) {
        console.error('❌ Fel vid hämtning av skift:', error)
        return
      }

      // Cancel existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync()

      // Schedule new notifications
      for (const shift of shifts || []) {
        const shiftTime = new Date(shift.start_time)
        const notificationTime = new Date(shiftTime.getTime() - (settings.reminder_time * 60 * 1000))

        if (notificationTime > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🔔 Skiftpåminnelse',
              body: `${shift.summary} börjar om ${settings.reminder_time} minuter`,
              data: { shiftId: shift.id }
            },
            trigger: {
              date: notificationTime
            }
          })
        }
      }

      Alert.alert('✅ Klart', 'Aviseringar har schemalagts för kommande skift')

    } catch (error) {
      console.error('❌ Fel vid schemaläggning av aviseringar:', error)
    }
  }

  const clearAllNotifications = async () => {
    Alert.alert(
      'Rensa aviseringar',
      'Är du säker på att du vill rensa alla aviseringar?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Rensa',
          style: 'destructive',
          onPress: async () => {
            try {
              await Notifications.cancelAllScheduledNotificationsAsync()
              const { error } = await supabase
                .from('shift_notifications')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

              if (error) {
                console.error('❌ Fel vid rensning:', error)
              } else {
                setNotifications([])
                Alert.alert('✅ Klart', 'Alla aviseringar har rensats')
              }
            } catch (error) {
              console.error('❌ Fel vid rensning:', error)
            }
          }
        }
      ]
    )
  }

  const formatNotificationTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Laddar aviseringar...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔔 Aviseringar</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearAllNotifications}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inställningar</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Skiftpåminnelser</Text>
            <Text style={styles.settingDescription}>
              Få påminnelser innan skift börjar
            </Text>
          </View>
          <Switch
            value={settings?.shift_reminders || false}
            onValueChange={(value) => updateSetting('shift_reminders', value)}
            trackColor={{ false: '#e2e8f0', true: '#3B82F6' }}
            thumbColor={settings?.shift_reminders ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push-aviseringar</Text>
            <Text style={styles.settingDescription}>
              Aviseringar i telefonen
            </Text>
          </View>
          <Switch
            value={settings?.push_notifications || false}
            onValueChange={(value) => updateSetting('push_notifications', value)}
            trackColor={{ false: '#e2e8f0', true: '#3B82F6' }}
            thumbColor={settings?.push_notifications ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>E-postaviseringar</Text>
            <Text style={styles.settingDescription}>
              Få e-post vid nya skift
            </Text>
          </View>
          <Switch
            value={settings?.email_notifications || false}
            onValueChange={(value) => updateSetting('email_notifications', value)}
            trackColor={{ false: '#e2e8f0', true: '#3B82F6' }}
            thumbColor={settings?.email_notifications ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Helgaviseringar</Text>
            <Text style={styles.settingDescription}>
              Aviseringar även på helger
            </Text>
          </View>
          <Switch
            value={settings?.weekend_notifications || false}
            onValueChange={(value) => updateSetting('weekend_notifications', value)}
            trackColor={{ false: '#e2e8f0', true: '#3B82F6' }}
            thumbColor={settings?.weekend_notifications ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity 
          style={styles.scheduleButton}
          onPress={scheduleUpcomingShiftNotifications}
        >
          <Ionicons name="time-outline" size={20} color="#3B82F6" />
          <Text style={styles.scheduleButtonText}>
            Schemalägg aviseringar för kommande skift
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Senaste aviseringar</Text>
        
        {notifications.length === 0 ? (
          <Text style={styles.noNotifications}>Inga aviseringar än</Text>
        ) : (
          notifications.map(notification => (
            <View key={notification.id} style={styles.notificationCard}>
              <View style={styles.notificationHeader}>
                <View style={styles.notificationIcon}>
                  <Ionicons 
                    name={notification.sent ? "checkmark-circle" : "time-outline"} 
                    size={20} 
                    color={notification.sent ? "#10b981" : "#f59e0b"} 
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationBody}>{notification.body}</Text>
                  <Text style={styles.notificationTime}>
                    {formatNotificationTime(notification.scheduled_time)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center'
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
  clearButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fef2f2'
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  settingInfo: {
    flex: 1,
    marginRight: 16
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b'
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8
  },
  scheduleButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500'
  },
  noNotifications: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 16,
    padding: 20
  },
  notificationCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 12
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2
  },
  notificationContent: {
    flex: 1
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4
  },
  notificationBody: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4
  },
  notificationTime: {
    fontSize: 12,
    color: '#94a3b8'
  }
})