import { AlertTriangle, Check, Clock, MessageSquare, Plus, RotateCcw, Send, Users } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { useTheme } from '../../context/ThemeContext';
import { useChatStore, ChatMessage, MessageStatus } from '../../lib/chatStore';
import { supabase } from '../../lib/supabase';

export default function ChatScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { selectedCompany, selectedTeam, selectedDepartment } = useCompany();
  
  // Zustand store
  const {
    messages,
    chatRooms,
    currentChatRoom,
    chatMembers,
    loading,
    addMessage,
    retryMessage,
    setMessages,
    setChatRooms,
    setCurrentChatRoom,
    setChatMembers,
    setLoading,
    handleRealtimeMessage
  } = useChatStore();
  
  const [newMessage, setNewMessage] = useState('');
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Fetch chat rooms user is member of
  const fetchChatRooms = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('chat_room_members')
        .select(`
          chat_rooms (
            id,
            company_id,
            team_id,
            name,
            description,
            type,
            department,
            is_private,
            auto_join_department,
            auto_join_team,
            created_by,
            created_at,
            updated_at,
            companies (
              name
            ),
            teams (
              name,
              color
            )
          )
        `)
        .eq('employee_id', user.id);

      if (error) throw error;

      const rooms = data?.map(item => item.chat_rooms).filter(Boolean) as any[];
      setChatRooms(rooms || []);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for current chat room
  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:employees!sender_id (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('chat_room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Add 'sent' status to all existing messages
      const messagesWithStatus = (data || []).map(msg => ({ ...msg, status: 'sent' as MessageStatus }));
      setMessages(messagesWithStatus);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Fetch chat room members
  const fetchChatMembers = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_room_members')
        .select(`
          *,
          employees (
            first_name,
            last_name,
            email,
            avatar_url,
            department,
            position
          )
        `)
        .eq('chat_room_id', roomId);

      if (error) throw error;
      setChatMembers(data || []);
    } catch (error) {
      console.error('Error fetching chat members:', error);
    }
  };

  // Join chat room
  const joinChatRoom = async (roomId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_room_members')
        .insert({
          chat_room_id: roomId,
          employee_id: user.id,
          role: 'member'
        });

      if (error) throw error;
      await fetchChatRooms();
    } catch (error) {
      console.error('Error joining chat room:', error);
      throw error;
    }
  };

  // Leave chat room
  const leaveChatRoom = async (roomId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_room_members')
        .delete()
        .eq('chat_room_id', roomId)
        .eq('employee_id', user.id);

      if (error) throw error;
      
      if (currentChatRoom?.id === roomId) {
        setCurrentChatRoom(null);
      }
      
      await fetchChatRooms();
    } catch (error) {
      console.error('Error leaving chat room:', error);
      throw error;
    }
  };

  // Create chat room
  const createChatRoom = async (roomData: any) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          ...roomData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join creator to the room
      await joinChatRoom(data.id);
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!currentChatRoom) return;

    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`chat:${currentChatRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${currentChatRoom.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          handleRealtimeMessage(newMessage);
        }
      )
      .subscribe();

    return () => {
      messageChannel.unsubscribe();
    };
  }, [currentChatRoom]);

  // Load data when current chat room changes
  useEffect(() => {
    if (currentChatRoom) {
      fetchMessages(currentChatRoom.id);
      fetchChatMembers(currentChatRoom.id);
    } else {
      setMessages([]);
      setChatMembers([]);
    }
  }, [currentChatRoom]);

  // Load chat rooms on mount
  useEffect(() => {
    if (user) {
      fetchChatRooms();
    }
  }, [user]);

  // Create default chat rooms when company/team is selected
  useEffect(() => {
    if (selectedCompany && selectedTeam && selectedDepartment && chatRooms.length === 0) {
      createDefaultChatRooms();
    }
  }, [selectedCompany, selectedTeam, selectedDepartment]);

  const createDefaultChatRooms = async () => {
    if (!selectedCompany || !selectedTeam || !selectedDepartment) return;

    try {
      // Create team chat room
      await createChatRoom({
        company_id: selectedCompany.id,
        team_id: selectedTeam,
        name: `Lag ${selectedTeam} - ${selectedCompany.name}`,
        description: `Chat för lag ${selectedTeam}`,
        type: 'team',
        department: selectedDepartment,
        is_private: false,
        auto_join_team: true
      });

      // Create department chat room
      await createChatRoom({
        company_id: selectedCompany.id,
        name: `${selectedDepartment} - ${selectedCompany.name}`,
        description: `Chat för avdelning ${selectedDepartment}`,
        type: 'department',
        department: selectedDepartment,
        is_private: false,
        auto_join_department: selectedDepartment
      });

      // Refresh chat rooms
      await fetchChatRooms();
    } catch (error) {
      console.error('Error creating default chat rooms:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    try {
      await addMessage(newMessage.trim(), user.id);
      setNewMessage('');
    } catch (error) {
      // Error is already handled in the store with optimistic updates
      console.error('Failed to send message:', error);
    }
  };

  const handleRetryMessage = async (tempId: string) => {
    try {
      await retryMessage(tempId);
    } catch (error) {
      Alert.alert('Fel', 'Kunde inte skicka meddelandet igen');
    }
  };

  const handleJoinRoom = async (room: any) => {
    try {
      await joinChatRoom(room.id);
      setCurrentChatRoom(room);
      setShowRoomSelector(false);
    } catch (error) {
      Alert.alert('Fel', 'Kunde inte gå med i chatten');
    }
  };

  const handleLeaveRoom = async () => {
    if (!currentChatRoom) return;
    
    Alert.alert(
      'Lämna chat',
      `Är du säker på att du vill lämna ${currentChatRoom.name}?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Lämna',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveChatRoom(currentChatRoom.id);
              Alert.alert('Framgång', 'Du har lämnat chatten');
            } catch (error) {
              Alert.alert('Fel', 'Kunde inte lämna chatten');
            }
          },
        },
      ]
    );
  };

  const renderMessageStatus = (message: ChatMessage) => {
    const isOwnMessage = message.sender_id === user?.id;
    if (!isOwnMessage) return null;

    const status = message.status || 'sent';
    const iconSize = 12;

    switch (status) {
      case 'pending':
        return <Clock size={iconSize} color="rgba(255, 255, 255, 0.7)" />;
      case 'sent':
        return <Check size={iconSize} color="rgba(255, 255, 255, 0.7)" />;
      case 'error':
        return (
          <TouchableOpacity 
            onPress={() => message.tempId && handleRetryMessage(message.tempId)}
            style={styles.retryButton}
          >
            <AlertTriangle size={iconSize} color="#ff4444" />
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const time = new Date(item.created_at).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessage]}>
        <View style={[
          styles.messageBubble, 
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
          item.status === 'error' && styles.errorMessageBubble
        ]}>
          {!isOwnMessage && (
            <Text style={styles.messageAuthor}>
              {item.sender?.first_name} {item.sender?.last_name}
            </Text>
          )}
          <Text style={[
            styles.messageText, 
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime, 
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {time}
            </Text>
            {renderMessageStatus(item)}
          </View>
        </View>
      </View>
    );
  };

  const renderChatMember = (member: any) => (
    <View key={member.id} style={styles.memberItem}>
      <View style={styles.memberInfo}>
        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>
            {member.employees?.first_name} {member.employees?.last_name}
          </Text>
          <Text style={styles.memberEmail}>{member.employees?.email}</Text>
          {member.employees?.department && (
            <Text style={styles.memberDepartment}>
              {member.employees.department}
            </Text>
          )}
        </View>
      </View>
      <Text style={styles.memberRole}>{member.role}</Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    roomInfo: {
      flex: 1,
      marginLeft: 12,
    },
    roomName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    roomDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    membersPanel: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      maxHeight: 200,
    },
    membersTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    membersList: {
      padding: 16,
    },
    memberItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    memberInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    memberDetails: {
      flex: 1,
    },
    memberName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    memberEmail: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    memberDepartment: {
      fontSize: 11,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    memberRole: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    messagesList: {
      flex: 1,
    },
    messagesContainer: {
      padding: 16,
    },
    messageContainer: {
      marginBottom: 12,
    },
    ownMessage: {
      alignItems: 'flex-end',
    },
    messageBubble: {
      padding: 12,
      borderRadius: 16,
      maxWidth: '80%',
    },
    ownMessageBubble: {
      backgroundColor: colors.primary,
    },
    otherMessageBubble: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    errorMessageBubble: {
      borderColor: '#ff4444',
      borderWidth: 1,
    },
    messageAuthor: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    messageText: {
      fontSize: 14,
      lineHeight: 20,
    },
    ownMessageText: {
      color: 'white',
    },
    otherMessageText: {
      color: colors.text,
    },
    messageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    messageTime: {
      fontSize: 11,
      flex: 1,
    },
    ownMessageTime: {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    otherMessageTime: {
      color: colors.textSecondary,
    },
    retryButton: {
      padding: 2,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 16,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    textInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginRight: 8,
      maxHeight: 100,
      fontSize: 14,
      color: colors.text,
    },
    sendButton: {
      backgroundColor: colors.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    roomSelector: {
      backgroundColor: colors.card,
      margin: 16,
      borderRadius: 12,
      padding: 16,
      maxHeight: 400,
    },
    roomSelectorTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
    },
    roomList: {
      maxHeight: 300,
    },
    roomItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 8,
    },
    roomItemInfo: {
      flex: 1,
    },
    roomItemName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    roomItemDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    noRoomsText: {
      textAlign: 'center',
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    closeButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    closeButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    selectRoomButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    selectRoomButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (!currentChatRoom) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Chat</Text>
          <TouchableOpacity onPress={() => setShowRoomSelector(true)}>
            <MessageSquare size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {showRoomSelector && (
          <View style={styles.roomSelector}>
            <Text style={styles.roomSelectorTitle}>Välj chattrum</Text>
            <ScrollView style={styles.roomList}>
              {chatRooms.map((room) => (
                <TouchableOpacity
                  key={room.id}
                  style={styles.roomItem}
                  onPress={() => handleJoinRoom(room)}
                >
                  <View style={styles.roomItemInfo}>
                    <Text style={styles.roomItemName}>{room.name}</Text>
                    {room.description && (
                      <Text style={styles.roomItemDescription}>{room.description}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              {chatRooms.length === 0 && (
                <Text style={styles.noRoomsText}>
                  Inga chattrum tillgängliga. Välj företag och lag först.
                </Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowRoomSelector(false)}
            >
              <Text style={styles.closeButtonText}>Stäng</Text>
            </TouchableOpacity>
          </View>
        )}

        {!showRoomSelector && (
          <View style={styles.emptyState}>
            <MessageSquare size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Inget chattrum valt</Text>
            <Text style={styles.emptySubtitle}>
              Välj ett chattrum för att börja chatta med dina kollegor
            </Text>
            <TouchableOpacity
              style={styles.selectRoomButton}
              onPress={() => setShowRoomSelector(true)}
            >
              <Text style={styles.selectRoomButtonText}>Välj chattrum</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setCurrentChatRoom(null)}>
            <MessageSquare size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.roomInfo}>
            <Text style={styles.roomName}>{currentChatRoom.name}</Text>
            {currentChatRoom.description && (
              <Text style={styles.roomDescription}>{currentChatRoom.description}</Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowMembers(!showMembers)}>
            <Users size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Members Panel */}
      {showMembers && (
        <View style={styles.membersPanel}>
          <Text style={styles.membersTitle}>Medlemmar ({chatMembers.length})</Text>
          <ScrollView style={styles.membersList}>
            {chatMembers.map(renderChatMember)}
          </ScrollView>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.tempId || item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Skriv ett meddelande..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <Send size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}