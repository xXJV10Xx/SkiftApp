import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { supabase, PrivateChat } from '../lib/supabase'

interface ChatWithDetails extends PrivateChat {
  participant_1: {
    username: string
    avatar_url: string | null
  }
  participant_2: {
    username: string
    avatar_url: string | null
  }
  trade_request: {
    shifts: {
      title: string
      start_time: string
      shift_teams: {
        name: string
        color_hex: string
      }
    }
  }
  latest_message?: {
    content: string
    created_at: string
    sender_id: string
  }
}

export default function ChatListScreen() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [chats, setChats] = useState<ChatWithDetails[]>([])

  useEffect(() => {
    if (user) {
      fetchChats()
    }
  }, [user])

  const fetchChats = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('private_chats')
        .select(`
          *,
          participant_1:profiles!participant_1_id(username, avatar_url),
          participant_2:profiles!participant_2_id(username, avatar_url),
          trade_request:shift_trade_requests(
            shifts(
              title,
              start_time,
              shift_teams(name, color_hex)
            )
          )
        `)
        .or(`participant_1_id.eq.${user?.id},participant_2_id.eq.${user?.id}`)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching chats:', error)
        return
      }

      // Get latest message for each chat
      const chatsWithMessages = await Promise.all(
        (data || []).map(async (chat) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)

          return {
            ...chat,
            latest_message: messages?.[0] || null,
          }
        })
      )

      setChats(chatsWithMessages)
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchChats()
    setRefreshing(false)
  }

  const getOtherParticipant = (chat: ChatWithDetails) => {
    return chat.participant_1_id === user?.id 
      ? chat.participant_2 
      : chat.participant_1
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } else {
      return date.toLocaleDateString('sv-SE', {
        month: 'short',
        day: 'numeric',
      })
    }
  }

  const renderChatItem = (chat: ChatWithDetails) => {
    const otherParticipant = getOtherParticipant(chat)
    const shift = chat.trade_request?.shifts
    const isMyMessage = chat.latest_message?.sender_id === user?.id

    return (
      <TouchableOpacity key={chat.id} style={styles.chatItem}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {otherParticipant.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          {shift && (
            <View
              style={[
                styles.teamIndicator,
                { backgroundColor: shift.shift_teams.color_hex }
              ]}
            />
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.participantName}>
              {otherParticipant.username}
            </Text>
            {chat.latest_message && (
              <Text style={styles.messageTime}>
                {formatMessageTime(chat.latest_message.created_at)}
              </Text>
            )}
          </View>

          {shift && (
            <Text style={styles.shiftInfo}>
              {shift.shift_teams.name} • {shift.title}
            </Text>
          )}

          {chat.latest_message ? (
            <Text style={styles.latestMessage} numberOfLines={2}>
              {isMyMessage ? 'Du: ' : ''}
              {chat.latest_message.content}
            </Text>
          ) : (
            <Text style={styles.noMessages}>Inga meddelanden än</Text>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Hämtar chattar...</Text>
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
        <Text style={styles.title}>Chattar</Text>
        <Text style={styles.subtitle}>
          Dina konversationer om skiftbyten
        </Text>
      </View>

      {chats.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Inga chattar än
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Chattar skapas automatiskt när du visar intresse för skiftbyten
          </Text>
        </View>
      ) : (
        <View style={styles.chatList}>
          {chats.map(renderChatItem)}
        </View>
      )}
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
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  chatList: {
    paddingTop: 10,
  },
  chatItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
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
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  teamIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  shiftInfo: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 4,
  },
  latestMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  noMessages: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
})