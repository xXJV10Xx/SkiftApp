import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { supabase, ShiftTradeRequest } from '../lib/supabase'

interface TradeRequestWithDetails extends ShiftTradeRequest {
  profiles: {
    username: string
    avatar_url: string | null
  }
  shifts: {
    title: string
    start_time: string
    end_time: string
    shift_teams: {
      name: string
      color_hex: string
    }
  }
}

export default function ShiftTradeScreen() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [tradeRequests, setTradeRequests] = useState<TradeRequestWithDetails[]>([])
  const [myRequests, setMyRequests] = useState<TradeRequestWithDetails[]>([])

  useEffect(() => {
    if (user && profile) {
      fetchTradeRequests()
    }
  }, [user, profile])

  const fetchTradeRequests = async () => {
    setLoading(true)
    try {
      // Fetch all open trade requests (excluding user's own)
      const { data: allRequests, error: allError } = await supabase
        .from('shift_trade_requests')
        .select(`
          *,
          profiles!requester_id(username, avatar_url),
          shifts(
            title,
            start_time,
            end_time,
            shift_teams(name, color_hex)
          )
        `)
        .eq('status', 'open')
        .neq('requester_id', user?.id)

      if (allError) {
        console.error('Error fetching trade requests:', allError)
        Alert.alert('Fel', 'Kunde inte hämta bytesförfrågningar')
        return
      }

      // Fetch user's own trade requests
      const { data: userRequests, error: userError } = await supabase
        .from('shift_trade_requests')
        .select(`
          *,
          profiles!requester_id(username, avatar_url),
          shifts(
            title,
            start_time,
            end_time,
            shift_teams(name, color_hex)
          )
        `)
        .eq('requester_id', user?.id)
        .order('created_at', { ascending: false })

      if (userError) {
        console.error('Error fetching user trade requests:', userError)
      }

      setTradeRequests(allRequests || [])
      setMyRequests(userRequests || [])
    } catch (error) {
      console.error('Error fetching trade requests:', error)
      Alert.alert('Fel', 'Något gick fel vid hämtning av bytesförfrågningar')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchTradeRequests()
    setRefreshing(false)
  }

  const handleShowInterest = async (tradeRequest: TradeRequestWithDetails) => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/handle-trade-interest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trade_request_id: tradeRequest.id,
          message: `Hej! Jag är intresserad av att byta mitt pass mot ditt ${tradeRequest.shifts.title}-pass.`,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        Alert.alert(
          'Intresse registrerat',
          'En privat chatt har skapats mellan dig och den som vill byta pass. Du kan nu diskutera bytet.',
          [{ text: 'OK' }]
        )
      } else {
        Alert.alert('Fel', result.error || 'Kunde inte registrera intresse')
      }
    } catch (error) {
      console.error('Error showing interest:', error)
      Alert.alert('Fel', 'Något gick fel vid registrering av intresse')
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    Alert.alert(
      'Avbryt förfrågan',
      'Är du säker på att du vill avbryta denna bytesförfrågan?',
      [
        { text: 'Nej', style: 'cancel' },
        {
          text: 'Ja, avbryt',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('shift_trade_requests')
                .update({ status: 'cancelled' })
                .eq('id', requestId)

              if (error) {
                Alert.alert('Fel', 'Kunde inte avbryta förfrågan')
                return
              }

              Alert.alert('Avbrutet', 'Bytesförfrågan har avbrutits')
              await fetchTradeRequests()
            } catch (error) {
              Alert.alert('Fel', 'Något gick fel vid avbrytande av förfrågan')
            }
          },
        },
      ]
    )
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return {
      date: date.toLocaleDateString('sv-SE'),
      time: date.toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#28a745'
      case 'accepted':
        return '#007bff'
      case 'cancelled':
        return '#dc3545'
      case 'completed':
        return '#6c757d'
      default:
        return '#6c757d'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Öppen'
      case 'accepted':
        return 'Accepterad'
      case 'cancelled':
        return 'Avbruten'
      case 'completed':
        return 'Slutförd'
      default:
        return status
    }
  }

  const renderTradeRequest = (request: TradeRequestWithDetails, isOwn: boolean = false) => {
    const startDateTime = formatDateTime(request.shifts.start_time)
    const endDateTime = formatDateTime(request.shifts.end_time)

    return (
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.teamInfo}>
            <View
              style={[
                styles.teamColorIndicator,
                { backgroundColor: request.shifts.shift_teams.color_hex }
              ]}
            />
            <Text style={styles.teamName}>{request.shifts.shift_teams.name}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(request.status) }
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
          </View>
        </View>

        <Text style={styles.shiftTitle}>{request.shifts.title}</Text>
        <Text style={styles.shiftTime}>
          {startDateTime.date} • {startDateTime.time} - {endDateTime.time}
        </Text>

        {!isOwn && (
          <Text style={styles.requesterInfo}>
            Begärt av: {request.profiles.username}
          </Text>
        )}

        {request.reason && (
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Anledning:</Text>
            <Text style={styles.reasonText}>{request.reason}</Text>
          </View>
        )}

        <View style={styles.requestActions}>
          {isOwn ? (
            <>
              {request.status === 'open' && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancelRequest(request.id)}
                >
                  <Text style={styles.cancelButtonText}>Avbryt förfrågan</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              {request.status === 'open' && (
                <TouchableOpacity
                  style={styles.interestButton}
                  onPress={() => handleShowInterest(request)}
                >
                  <Text style={styles.interestButtonText}>Visa intresse</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Hämtar bytesförfrågningar...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Skiftbyten</Text>
        <Text style={styles.subtitle}>
          Hitta kollegor som vill byta pass eller skapa din egen förfrågan
        </Text>
      </View>

      {/* My Trade Requests Section */}
      {myRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mina förfrågningar</Text>
          {myRequests.map(request => renderTradeRequest(request, true))}
        </View>
      )}

      {/* Available Trade Requests Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Tillgängliga byten ({tradeRequests.length})
        </Text>
        
        {tradeRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Inga bytesförfrågningar tillgängliga just nu
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Kom tillbaka senare eller skapa din egen förfrågan
            </Text>
          </View>
        ) : (
          tradeRequests.map(request => renderTradeRequest(request, false))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  requestCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  shiftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  shiftTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  requesterInfo: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 10,
  },
  reasonContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  interestButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  interestButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
})