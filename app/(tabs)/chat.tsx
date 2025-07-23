import { MessageCircle, Send, ArrowLeft, Calendar, MapPin, CalendarPlus } from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  supabase, 
  ShiftTradeRequest, 
  PrivateChat, 
  Message, 
  Shift,
  subscribeToMessages,
  callEdgeFunction 
} from '../../lib/supabase';
import { addShiftToCalendar } from '../../lib/calendar';

interface ChatListItem {
  id: string;
  trade_request_id: string;
  participants: string[];
  last_message?: Message;
  shift?: Shift;
  other_participant?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'list' | 'chat'>('list');
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatListItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Load user's chats
  const loadChats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get private chats where user is a participant
      const { data: chatData, error: chatError } = await supabase
        .from('private_chats')
        .select(`
          *,
          shift_trade_requests!inner(
            *,
            shifts!inner(*)
          )
        `)
        .contains('participants', [user.id]);

      if (chatError) {
        console.error('Error loading chats:', chatError);
        return;
      }

      // Get last message for each chat and other participant info
      const chatsWithDetails = await Promise.all(
        (chatData || []).map(async (chat) => {
          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get other participant's profile
          const otherParticipantId = chat.participants.find(id => id !== user.id);
          const { data: otherParticipant } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', otherParticipantId)
            .single();

          return {
            ...chat,
            last_message: lastMessage,
            shift: chat.shift_trade_requests.shifts,
            other_participant: otherParticipant,
          };
        })
      );

      setChats(chatsWithDetails);
    } catch (error) {
      console.error('Error loading chats:', error);
      Alert.alert('Fel', 'Kunde inte ladda chattar');
    } finally {
      setLoading(false);
    }
  };

  // Load messages for selected chat
  const loadMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!inner(username, avatar_url)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!selectedChat || !user || !newMessage.trim()) return;

    try {
      setSendingMessage(true);

      // Insert message into database
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat.id,
          sender_id: user.id,
          content: newMessage.trim(),
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error sending message:', messageError);
        Alert.alert('Fel', 'Kunde inte skicka meddelande');
        return;
      }

      // Clear input
      setNewMessage('');

      // Send push notification via Edge Function
      try {
        await callEdgeFunction('send-chat-notification', {
          chat_id: selectedChat.id,
          message_content: newMessage.trim(),
        });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't show error to user, message was sent successfully
      }

      // Message will be added via realtime subscription
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Fel', 'Ett oväntat fel uppstod');
    } finally {
      setSendingMessage(false);
    }
  };

  // Open chat
  const openChat = (chat: ChatListItem) => {
    setSelectedChat(chat);
    setActiveView('chat');
    loadMessages(chat.id);
  };

  // Close chat
  const closeChat = () => {
    setActiveView('list');
    setSelectedChat(null);
    setMessages([]);
  };

  // Add shift to calendar
  const handleAddToCalendar = async () => {
    if (!selectedChat?.shift) return;

    try {
      await addShiftToCalendar(selectedChat.shift);
    } catch (error) {
      console.error('Error adding shift to calendar:', error);
    }
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  // Load chats on mount
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  // Setup realtime subscription for messages
  useEffect(() => {
    if (!selectedChat) return;

    const subscription = subscribeToMessages(selectedChat.id, (payload) => {
      console.log('New message received:', payload);
      
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as Message;
        setMessages(prev => [...prev, newMessage]);
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedChat]);

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Idag';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Igår';
    } else {
      return date.toLocaleDateString('sv-SE', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Render chat list item
  const renderChatItem = ({ item }: { item: ChatListItem }) => (
    <TouchableOpacity
      style={[styles.chatItem, { backgroundColor: colors.card }]}
      onPress={() => openChat(item)}
    >
      <View style={styles.chatItemContent}>
        <View style={styles.chatInfo}>
          <Text style={[styles.chatTitle, { color: colors.text }]}>
            {item.other_participant?.username || 'Okänd användare'}
          </Text>
          <Text style={[styles.shiftInfo, { color: colors.textSecondary }]}>
            {item.shift?.title} - {formatDate(item.shift?.start_time || '')}
          </Text>
          {item.last_message && (
            <Text 
              style={[styles.lastMessage, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.last_message.content}
            </Text>
          )}
        </View>
        {item.last_message && (
          <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
            {formatTime(item.last_message.created_at)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render message
  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isOwnMessage ? colors.primary : colors.card,
          }
        ]}>
          <Text style={[
            styles.messageText,
            { color: isOwnMessage ? colors.background : colors.text }
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            { color: isOwnMessage ? colors.background : colors.textSecondary }
          ]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (activeView === 'chat' && selectedChat) {
    return (
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Chat header */}
        <View style={[styles.chatHeader, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={closeChat} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.chatHeaderInfo}>
            <Text style={[styles.chatHeaderTitle, { color: colors.text }]}>
              {selectedChat.other_participant?.username || 'Okänd användare'}
            </Text>
            <View style={styles.shiftDetails}>
              <Calendar size={14} color={colors.textSecondary} />
              <Text style={[styles.shiftDetailsText, { color: colors.textSecondary }]}>
                {selectedChat.shift?.title}
              </Text>
              {selectedChat.shift?.location && (
                <>
                  <MapPin size={14} color={colors.textSecondary} />
                  <Text style={[styles.shiftDetailsText, { color: colors.textSecondary }]}>
                    {selectedChat.shift.location}
                  </Text>
                </>
              )}
            </View>
          </View>
          
          {/* Add to Calendar Button */}
          <TouchableOpacity 
            onPress={handleAddToCalendar}
            style={[styles.calendarButton, { backgroundColor: colors.primary }]}
          >
            <CalendarPlus size={20} color={colors.background} />
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
        />

        {/* Message input */}
        <View style={[styles.messageInput, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border 
            }]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Skriv ett meddelande..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { 
                backgroundColor: newMessage.trim() ? colors.primary : colors.border,
                opacity: sendingMessage ? 0.5 : 1 
              }
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sendingMessage}
          >
            <Send size={20} color={colors.background} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Chat list view
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Skiftbytes-chattar
        </Text>
      </View>

      {/* Chat list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Laddar chattar...
          </Text>
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageCircle size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Inga chattar än
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Chattar skapas automatiskt när någon visar intresse för dina skiftbyten
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.chatList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  chatList: {
    padding: 16,
  },
  chatItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  chatItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  shiftInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
  },
  messageTime: {
    fontSize: 12,
    marginLeft: 8,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 16,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  shiftDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shiftDetailsText: {
    fontSize: 14,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 8,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});