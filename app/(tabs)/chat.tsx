import { MessageSquare, Plus, Send, Users } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import DrawerLayout from '../../components/DrawerLayout';
import ShiftChangeForm, { ShiftChangeRequest } from '../../components/ShiftChangeForm';
import ShiftChangeMessage from '../../components/ShiftChangeMessage';
import WorkExtraForm, { WorkExtraRequest } from '../../components/WorkExtraForm';
import WorkExtraMessage from '../../components/WorkExtraMessage';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useCompany } from '../../context/CompanyContext';
import { useTheme } from '../../context/ThemeContext';

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
    sendShiftChangeRequest,
    approveShiftChange,
    rejectShiftChange,
    sendWorkExtraRequest,
    createPrivateWorkChat,
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
  const [showShiftChangeForm, setShowShiftChangeForm] = useState(false);
  const [showWorkExtraForm, setShowWorkExtraForm] = useState(false);
  const [showFormSelector, setShowFormSelector] = useState(false);
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
    if (!newMessage.trim()) return;
    
    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Fel', 'Kunde inte skicka meddelandet');
    }
  };

  const handleSendShiftChange = async (formData: ShiftChangeRequest) => {
    try {
      await sendShiftChangeRequest({ ...formData, requester_id: user?.id || '' });
      setShowShiftChangeForm(false);
      Alert.alert('Framgång', 'Skiftbyte-förfrågan har skickats');
    } catch (error) {
      console.error('Error sending shift change request:', error);
      Alert.alert('Fel', 'Kunde inte skicka skiftbyte-förfrågan');
    }
  };

  const handleApproveShiftChange = async (requestId: string) => {
    try {
      await approveShiftChange(requestId);
      Alert.alert('Framgång', 'Skiftbyte-förfrågan har godkänts');
    } catch (error) {
      console.error('Error approving shift change:', error);
      Alert.alert('Fel', 'Kunde inte godkänna skiftbyte-förfrågan');
    }
  };

  const handleRejectShiftChange = async (requestId: string) => {
    try {
      await rejectShiftChange(requestId);
      Alert.alert('Framgång', 'Skiftbyte-förfrågan har avvisats');
    } catch (error) {
      console.error('Error rejecting shift change:', error);
      Alert.alert('Fel', 'Kunde inte avvisa skiftbyte-förfrågan');
    }
  };

  const handleSendWorkExtra = async (formData: WorkExtraRequest) => {
    try {
      await sendWorkExtraRequest({ ...formData, requester_id: user?.id || '' });
      setShowWorkExtraForm(false);
      Alert.alert('Framgång', 'Extrajobb-förfrågan har skickats');
    } catch (error) {
      console.error('Error sending work extra request:', error);
      Alert.alert('Fel', 'Kunde inte skicka extrajobb-förfrågan');
    }
  };

  const handleInterestedInExchange = async (requestId: string, requesterId: string) => {
    try {
      const privateChat = await createPrivateWorkChat(requesterId, requestId, 'shift_exchange');
      setCurrentChatRoom(privateChat);
      Alert.alert(
        'Privat chat skapad', 
        'En privat chat har skapats för att diskutera skiftbytet. Kom ihåg att den som ansökt ansvarar för att meddela sin chef.'
      );
    } catch (error) {
      console.error('Error creating private shift chat:', error);
      Alert.alert('Fel', 'Kunde inte skapa privat chat för skiftbyte');
    }
  };

  const handleInterestedInWork = async (requestId: string, requesterId: string) => {
    try {
      const privateChat = await createPrivateWorkChat(requesterId, requestId, 'work_extra');
      setCurrentChatRoom(privateChat);
      Alert.alert(
        'Privat chat skapad', 
        'En privat chat har skapats för att diskutera extrajobbet. Kom ihåg att den som publicerat jobbet ansvarar för att meddela sin chef.'
      );
    } catch (error) {
      console.error('Error creating private work chat:', error);
      Alert.alert('Fel', 'Kunde inte skapa privat chat för extrajobb');
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

  const renderMessage = ({ item }: { item: any }) => {
    const isOwnMessage = item.sender_id === user?.id;
    const time = new Date(item.created_at).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Handle shift change request messages
    if (item.message_type === 'shift_change_request') {
      try {
        const shiftChangeData = JSON.parse(item.content) as ShiftChangeRequest;
        return (
          <View style={[styles.messageContainer, isOwnMessage && styles.ownMessage]}>
            <ShiftChangeMessage
              data={shiftChangeData}
              onApprove={handleApproveShiftChange}
              onReject={handleRejectShiftChange}
              onInterestedInExchange={handleInterestedInExchange}
              isOwnMessage={isOwnMessage}
            />
            <Text style={[
              styles.messageTime, 
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
              styles.embeddedMessageTime
            ]}>
              {time}
            </Text>
          </View>
        );
      } catch (error) {
        console.error('Error parsing shift change data:', error);
        // Fall back to regular message display
      }
    }

    // Handle work extra request messages
    if (item.message_type === 'work_extra_request') {
      try {
        const workExtraData = JSON.parse(item.content) as WorkExtraRequest;
        return (
          <View style={[styles.messageContainer, isOwnMessage && styles.ownMessage]}>
            <WorkExtraMessage
              data={workExtraData}
              onInterestedInWork={handleInterestedInWork}
              isOwnMessage={isOwnMessage}
            />
            <Text style={[
              styles.messageTime, 
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
              styles.embeddedMessageTime
            ]}>
              {time}
            </Text>
          </View>
        );
      } catch (error) {
        console.error('Error parsing work extra data:', error);
        // Fall back to regular message display
      }
    }

    // Regular text messages
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
    attachButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
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
    embeddedMessageTime: {
      textAlign: 'center',
      marginTop: 8,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    modalCloseButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    modalCloseText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    modalContent: {
      flex: 1,
    },
    formSelectorOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    formSelectorContainer: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 400,
    },
    formSelectorTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    formSelectorOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formSelectorTextContainer: {
      flex: 1,
      marginLeft: 16,
    },
    formSelectorOptionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    formSelectorOptionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    formSelectorCancel: {
      backgroundColor: colors.textSecondary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    formSelectorCancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
  });

  if (!currentChatRoom) {
    return (
      <DrawerLayout title="Chat">
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
      </DrawerLayout>
    );
  }

  return (
    <DrawerLayout title={currentChatRoom.name}>
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
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => setShowFormSelector(true)}
        >
          <Plus size={20} color={colors.primary} />
        </TouchableOpacity>
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

      {/* Form Selector Modal */}
      <Modal
        visible={showFormSelector}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowFormSelector(false)}
      >
        <View style={styles.formSelectorOverlay}>
          <View style={styles.formSelectorContainer}>
            <Text style={styles.formSelectorTitle}>Välj formulärtyp</Text>
            
            <TouchableOpacity
              style={styles.formSelectorOption}
              onPress={() => {
                setShowFormSelector(false);
                setShowShiftChangeForm(true);
              }}
            >
              <Users size={24} color={colors.primary} />
              <View style={styles.formSelectorTextContainer}>
                <Text style={styles.formSelectorOptionTitle}>Skiftbyte</Text>
                <Text style={styles.formSelectorOptionDescription}>
                  Ansök om att byta skift med en kollega
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.formSelectorOption}
              onPress={() => {
                setShowFormSelector(false);
                setShowWorkExtraForm(true);
              }}
            >
              <Clock size={24} color={colors.primary} />
              <View style={styles.formSelectorTextContainer}>
                <Text style={styles.formSelectorOptionTitle}>Extrajobb</Text>
                <Text style={styles.formSelectorOptionDescription}>
                  Publicera ett tillgängligt extrajobb
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.formSelectorCancel}
              onPress={() => setShowFormSelector(false)}
            >
              <Text style={styles.formSelectorCancelText}>Avbryt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Shift Change Form Modal */}
      <Modal
        visible={showShiftChangeForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowShiftChangeForm(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Skicka skiftbyte-förfrågan</Text>
            <TouchableOpacity
              onPress={() => setShowShiftChangeForm(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Stäng</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <ShiftChangeForm
              onSubmit={handleSendShiftChange}
              onCancel={() => setShowShiftChangeForm(false)}
              isEmbedded={false}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Work Extra Form Modal */}
      <Modal
        visible={showWorkExtraForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWorkExtraForm(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Publicera extrajobb</Text>
            <TouchableOpacity
              onPress={() => setShowWorkExtraForm(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Stäng</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <WorkExtraForm
              onSubmit={handleSendWorkExtra}
              onCancel={() => setShowWorkExtraForm(false)}
              isEmbedded={false}
            />
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
    </DrawerLayout>
  );
}