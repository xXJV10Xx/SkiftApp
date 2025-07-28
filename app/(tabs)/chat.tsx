import { MessageSquare, Send, Users, Settings } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useChat } from '../../context/ChatContext';
import { useCompany } from '../../context/CompanyContext';
import { useTheme } from '../../context/ThemeContext';
import { testChatFunctionality, logChatStatus } from '../../utils/chatDebug';

export default function ChatScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { selectedCompany, selectedTeam, selectedDepartment } = useCompany();
  const {
    messages,
    chatRooms,
    currentChatRoom,
    chatMembers,
    sendMessage,
    joinChatRoom,
    leaveChatRoom,
    setCurrentChatRoom,
    fetchChatRooms,
    createChatRoom,
    loading
  } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const createDefaultChatRooms = useCallback(async () => {
    if (!selectedCompany || !selectedTeam || !selectedDepartment) return;

    try {
      // Create team chat room
      await createChatRoom({
        company_id: selectedCompany.id,
        team_id: selectedTeam,
        department_id: selectedDepartment,
        name: `${selectedTeam} Team Chat`,
        description: `Chat för ${selectedTeam} teamet`,
        is_default: true,
      });

      // Create department chat room
      await createChatRoom({
        company_id: selectedCompany.id,
        department_id: selectedDepartment,
        name: `${selectedDepartment} Department`,
        description: `Chat för ${selectedDepartment} avdelningen`,
        is_default: true,
      });
    } catch (error) {
      console.error('Error creating default chat rooms:', error);
    }
  }, [selectedCompany, selectedTeam, selectedDepartment, createChatRoom]);

  // Create default chat rooms when company/team is selected
  useEffect(() => {
    if (selectedCompany && selectedTeam && selectedDepartment && chatRooms.length === 0) {
      createDefaultChatRooms();
    }
  }, [selectedCompany, selectedTeam, selectedDepartment, chatRooms.length, createDefaultChatRooms]);



  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;
    if (!currentChatRoom) {
      Alert.alert('Fel', 'Inget chattrum valt');
      return;
    }
    if (!user) {
      Alert.alert('Fel', 'Du måste vara inloggad för att skicka meddelanden');
      return;
    }
    
    const messageContent = newMessage.trim();
    setNewMessage(''); // Rensa meddelandet direkt för bättre UX
    setSendingMessage(true);
    
    try {
      await sendMessage(messageContent);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Återställ meddelandet om det misslyckades
      Alert.alert('Fel', 'Kunde inte skicka meddelandet. Försök igen.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleJoinRoom = async (room: any) => {
    try {
      await joinChatRoom(room.id);
      setCurrentChatRoom(room);
      setShowRoomSelector(false);
    } catch (error) {
      console.error('Error joining chat room:', error);
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
              console.error('Error leaving chat room:', error);
              Alert.alert('Fel', 'Kunde inte lämna chatten');
            }
          },
        },
      ]
    );
  };

  const handleDebugChat = async () => {
    if (!user) {
      Alert.alert('Fel', 'Ingen användare inloggad');
      return;
    }

    Alert.alert(
      'Chat Debug',
      'Vill du köra en diagnostik av chat-funktionaliteten?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Kör diagnostik',
          onPress: async () => {
            try {
              const results = await testChatFunctionality(user.id);
              
              let message = `🔧 Chat Diagnostik Resultat:\n\n`;
              message += `🔗 Anslutning: ${results.isConnected ? '✅ OK' : '❌ Fel'}\n`;
              message += `👤 Användare: ${results.user ? '✅ Inloggad' : '❌ Inte inloggad'}\n`;
              message += `💬 Chattrum: ${results.chatRooms.length} tillgängliga\n`;
              message += `📡 Real-time: ${results.realtimeStatus}\n`;
              
              if (results.lastError) {
                message += `\n❌ Senaste fel: ${results.lastError}`;
              }

              Alert.alert('Debug Resultat', message);
              logChatStatus();
            } catch (error) {
              Alert.alert('Debug Fel', `Kunde inte köra diagnostik: ${error}`);
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const time = new Date(item.created_at).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessage]}>
        <View style={[
          styles.messageBubble, 
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
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
          <Text style={[
            styles.messageTime, 
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {time}
          </Text>
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
    messageTime: {
      fontSize: 11,
      marginTop: 4,
      alignSelf: 'flex-end',
    },
    ownMessageTime: {
      color: 'rgba(255, 255, 255, 0.7)',
    },
    otherMessageTime: {
      color: colors.textSecondary,
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
          <TouchableOpacity onPress={handleDebugChat}>
            <Settings size={24} color={colors.textSecondary} />
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
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          onSubmitEditing={handleSendMessage}
          placeholder="Skriv ett meddelande..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={500}
          returnKeyType="send"
          blurOnSubmit={false}
          enablesReturnKeyAutomatically={true}
        />
        <TouchableOpacity
          style={[
            styles.sendButton, 
            (!newMessage.trim() || sendingMessage) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sendingMessage}
        >
          <Send size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}