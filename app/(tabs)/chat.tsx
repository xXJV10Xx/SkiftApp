import { Ionicons } from '@expo/vector-icons';
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
import { useChat } from '../../context/ChatContext';

interface Message {
  id: string;
  message: string;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
  user_id: string;
}

export default function ChatScreen() {
  const { user } = useAuth();
  const {
    messages,
    teamMembers,
    currentTeam,
    teams,
    sendMessage,
    setCurrentTeam,
    joinTeam,
    leaveTeam,
  } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [showTeamSelector, setShowTeamSelector] = useState(false);
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

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    await sendMessage(newMessage.trim());
    setNewMessage('');
  };

  const handleJoinTeam = async (team: any) => {
    try {
      await joinTeam(team.id);
      setCurrentTeam(team);
      setShowTeamSelector(false);
      Alert.alert('Framgång', `Du har gått med i laget ${team.name}`);
    } catch (error) {
      Alert.alert('Fel', 'Kunde inte gå med i laget');
    }
  };

  const handleLeaveTeam = async () => {
    if (!currentTeam) return;
    
    Alert.alert(
      'Lämna lag',
      `Är du säker på att du vill lämna ${currentTeam.name}?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Lämna',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveTeam(currentTeam.id);
              setCurrentTeam(null);
              Alert.alert('Framgång', 'Du har lämnat laget');
            } catch (error) {
              Alert.alert('Fel', 'Kunde inte lämna laget');
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.user_id === user?.id;
    const time = new Date(item.created_at).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessage]}>
        <View style={[styles.messageBubble, isOwnMessage && styles.ownMessageBubble]}>
          {!isOwnMessage && (
            <Text style={styles.messageAuthor}>{item.user?.full_name || 'Anonym'}</Text>
          )}
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {item.message}
          </Text>
          <Text style={[styles.messageTime, isOwnMessage && styles.ownMessageTime]}>
            {time}
          </Text>
        </View>
      </View>
    );
  };

  const renderTeamMember = (member: any) => {
    const isOnline = member.online_status?.is_online;
    const lastSeen = member.online_status?.last_seen;
    
    return (
      <View style={styles.memberItem}>
        <View style={styles.memberInfo}>
          <View style={[styles.onlineIndicator, isOnline && styles.online]} />
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>
              {member.user?.full_name || 'Anonym'}
            </Text>
            <Text style={styles.memberEmail}>{member.user?.email}</Text>
            {!isOnline && lastSeen && (
              <Text style={styles.lastSeen}>
                Senast sedd: {new Date(lastSeen).toLocaleString('sv-SE')}
              </Text>
            )}
          </View>
        </View>
        <Text style={styles.memberRole}>{member.role}</Text>
      </View>
    );
  };

  if (!currentTeam) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Chat</Text>
          <TouchableOpacity
            style={styles.teamSelectorButton}
            onPress={() => setShowTeamSelector(true)}
          >
            <Ionicons name="people" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {showTeamSelector && (
          <View style={styles.teamSelector}>
            <Text style={styles.teamSelectorTitle}>Välj lag att chatta med</Text>
            <ScrollView style={styles.teamList}>
              {teams.map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={[styles.teamItem, { borderLeftColor: team.color }]}
                  onPress={() => handleJoinTeam(team)}
                >
                  <View style={styles.teamItemInfo}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.teamCompany}>{team.company?.name}</Text>
                    {team.description && (
                      <Text style={styles.teamDescription}>{team.description}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))}
              {teams.length === 0 && (
                <Text style={styles.noTeamsText}>
                  Du är inte medlem i några lag än. Kontakta din administratör.
                </Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTeamSelector(false)}
            >
              <Text style={styles.closeButtonText}>Stäng</Text>
            </TouchableOpacity>
          </View>
        )}

        {!showTeamSelector && (
          <View style={styles.noTeamContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.noTeamTitle}>Inget lag valt</Text>
            <Text style={styles.noTeamSubtitle}>
              Välj ett lag för att börja chatta med dina kollegor
            </Text>
            <TouchableOpacity
              style={styles.selectTeamButton}
              onPress={() => setShowTeamSelector(true)}
            >
              <Text style={styles.selectTeamButtonText}>Välj lag</Text>
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentTeam(null)}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{currentTeam.name}</Text>
            <Text style={styles.teamCompany}>{currentTeam.company?.name}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.membersButton}
            onPress={() => setShowMembers(!showMembers)}
          >
            <Ionicons name="people" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveTeam}>
            <Ionicons name="exit-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Members Panel */}
      {showMembers && (
        <View style={styles.membersPanel}>
          <Text style={styles.membersTitle}>Lagmedlemmar ({teamMembers.length})</Text>
          <ScrollView style={styles.membersList}>
            {teamMembers.map((member) => renderTeamMember(member))}
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
          placeholder="Skriv ett meddelande..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  teamCompany: {
    fontSize: 14,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersButton: {
    marginRight: 12,
  },
  leaveButton: {
    marginLeft: 8,
  },
  membersPanel: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    maxHeight: 200,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
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
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginRight: 8,
  },
  online: {
    backgroundColor: '#28a745',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  memberEmail: {
    fontSize: 12,
    color: '#666',
  },
  lastSeen: {
    fontSize: 11,
    color: '#999',
  },
  memberRole: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  messageAuthor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  teamSelectorButton: {
    padding: 8,
  },
  teamSelector: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    maxHeight: 400,
  },
  teamSelectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  teamList: {
    maxHeight: 300,
  },
  teamItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  teamItemInfo: {
    flex: 1,
  },
  teamDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  noTeamsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noTeamContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noTeamTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  noTeamSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  selectTeamButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectTeamButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 