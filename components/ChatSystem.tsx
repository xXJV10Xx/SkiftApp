import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../lib/supabase';

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system' | 'shift_interest';
  image_url?: string;
  reply_to_id?: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  shift_interest?: {
    shift_date: string;
    shift_type: string;
    shift_time: string;
    interested_users: string[];
  };
}

interface ChatChannel {
  id: string;
  name: string;
  type: 'team' | 'department' | 'company' | 'private';
  team_id?: string;
  department_id?: string;
  company_id?: string;
  participants?: string[];
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

interface OnlineUser {
  id: string;
  name: string;
  avatar_url?: string;
  is_online: boolean;
  last_seen: string;
  current_shift?: string;
}

interface PredefinedMessage {
  id: string;
  text: string;
  category: 'shift_interest' | 'general' | 'question' | 'announcement';
  icon: string;
}

export const ChatSystem: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [currentChannel, setCurrentChannel] = useState<ChatChannel | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showChannelList, setShowChannelList] = useState(true);
  const [showPrivateChatModal, setShowPrivateChatModal] = useState(false);
  const [showShiftInterestModal, setShowShiftInterestModal] = useState(false);
  const [showPredefinedMessages, setShowPredefinedMessages] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<OnlineUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [shiftInterestData, setShiftInterestData] = useState({
    shift_date: '',
    shift_type: '',
    shift_time: ''
  });
  
  const scrollViewRef = useRef<ScrollView>(null);
  const messageSubscription = useRef<any>(null);

  // Färdiga meddelanden
  const predefinedMessages: PredefinedMessage[] = [
    {
      id: '1',
      text: 'Intresserad av att arbeta',
      category: 'shift_interest',
      icon: '💼'
    },
    {
      id: '2',
      text: 'Behöver hjälp med något',
      category: 'question',
      icon: '❓'
    },
    {
      id: '3',
      text: 'Viktigt meddelande',
      category: 'announcement',
      icon: '📢'
    },
    {
      id: '4',
      text: 'Bra jobbat idag!',
      category: 'general',
      icon: '👏'
    },
    {
      id: '5',
      text: 'Möte kl 14:00',
      category: 'announcement',
      icon: '📅'
    },
    {
      id: '6',
      text: 'Kan någon byta skift?',
      category: 'shift_interest',
      icon: '🔄'
    }
  ];

  useEffect(() => {
    loadUserData();
    loadChannels();
    loadOnlineUsers();
  }, []);

  useEffect(() => {
    if (currentChannel) {
      loadMessages();
      subscribeToMessages();
    }
    
    return () => {
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe();
      }
    };
  }, [currentChannel]);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async () => {
    try {
      // Ladda automatiska kanaler baserat på användarens avdelning/lag
      const { data: userTeams } = await supabase
        .from('team_members')
        .select(`
          teams (
            id,
            name,
            color,
            department_id,
            company_id
          )
        `)
        .eq('user_id', user?.id)
        .eq('is_active', true);

      const channels: ChatChannel[] = [];

      // Skapa team-kanaler
      if (userTeams) {
        for (const teamMember of userTeams) {
          const team = teamMember.teams;
          if (team) {
            channels.push({
              id: `team_${team.id}`,
              name: `Team ${team.name}`,
              type: 'team',
              team_id: team.id,
              company_id: team.company_id,
              unread_count: 0
            });
          }
        }
      }

      // Skapa avdelningskanaler
      const { data: userDepartments } = await supabase
        .from('departments')
        .select('*')
        .in('id', userTeams?.map(tm => tm.teams?.department_id).filter(Boolean) || []);

      if (userDepartments) {
        for (const dept of userDepartments) {
          channels.push({
            id: `dept_${dept.id}`,
            name: `Avdelning ${dept.name}`,
            type: 'department',
            department_id: dept.id,
            company_id: dept.company_id,
            unread_count: 0
          });
        }
      }

      // Skapa företagskanal
      if (userTeams && userTeams.length > 0) {
        const companyId = userTeams[0].teams?.company_id;
        if (companyId) {
          channels.push({
            id: `company_${companyId}`,
            name: 'Företag',
            type: 'company',
            company_id: companyId,
            unread_count: 0
          });
        }
      }

      setChannels(channels);
      
      // Sätt första kanalen som aktiv
      if (channels.length > 0) {
        setCurrentChannel(channels[0]);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  };

  const loadMessages = async () => {
    if (!currentChannel) return;

    try {
      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // Filtrera baserat på kanaltyp
      if (currentChannel.type === 'team') {
        query = query.eq('team_id', currentChannel.team_id);
      } else if (currentChannel.type === 'department') {
        query = query.eq('department_id', currentChannel.department_id);
      } else if (currentChannel.type === 'company') {
        query = query.eq('company_id', currentChannel.company_id);
      }

      const { data: messages, error } = await query;

      if (error) throw error;

      if (messages) {
        setMessages(messages.reverse());
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!currentChannel) return;

    messageSubscription.current = supabase
      .channel(`chat_${currentChannel.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: currentChannel.type === 'team' 
          ? `team_id=eq.${currentChannel.team_id}`
          : currentChannel.type === 'department'
          ? `department_id=eq.${currentChannel.department_id}`
          : `company_id=eq.${currentChannel.company_id}`
      }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        setMessages(prev => [...prev, newMessage]);
        
        // Scrolla till botten
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      })
      .subscribe();
  };

  const loadOnlineUsers = async () => {
    try {
      const { data: onlineStatus, error } = await supabase
        .from('online_status')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('is_online', true);

      if (error) throw error;

      if (onlineStatus) {
        setOnlineUsers(onlineStatus.map(status => ({
          id: status.user_id,
          name: status.profiles?.full_name || 'Okänd',
          avatar_url: status.profiles?.avatar_url,
          is_online: status.is_online,
          last_seen: status.last_seen,
          current_shift: status.current_shift_id
        })));
      }
    } catch (error) {
      console.error('Error loading online users:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentChannel || !user) return;

    try {
      const messageData: any = {
        user_id: user.id,
        message: newMessage.trim(),
        message_type: 'text'
      };

      // Lägg till kanal-specifik data
      if (currentChannel.type === 'team') {
        messageData.team_id = currentChannel.team_id;
      } else if (currentChannel.type === 'department') {
        messageData.department_id = currentChannel.department_id;
      } else if (currentChannel.type === 'company') {
        messageData.company_id = currentChannel.company_id;
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert(messageData);

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Fel', 'Kunde inte skicka meddelande');
    }
  };

  const sendPredefinedMessage = async (predefinedMessage: PredefinedMessage) => {
    if (!currentChannel || !user) return;

    try {
      let messageData: any = {
        user_id: user.id,
        message: predefinedMessage.text,
        message_type: predefinedMessage.category === 'shift_interest' ? 'shift_interest' : 'text'
      };

      // Lägg till kanal-specifik data
      if (currentChannel.type === 'team') {
        messageData.team_id = currentChannel.team_id;
      } else if (currentChannel.type === 'department') {
        messageData.department_id = currentChannel.department_id;
      } else if (currentChannel.type === 'company') {
        messageData.company_id = currentChannel.company_id;
      }

      // Om det är skiftintresse, lägg till extra data
      if (predefinedMessage.category === 'shift_interest') {
        messageData.shift_interest = {
          shift_date: shiftInterestData.shift_date,
          shift_type: shiftInterestData.shift_type,
          shift_time: shiftInterestData.shift_time,
          interested_users: []
        };
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert(messageData);

      if (error) throw error;

      setShowPredefinedMessages(false);
      setShiftInterestData({ shift_date: '', shift_type: '', shift_time: '' });
    } catch (error) {
      console.error('Error sending predefined message:', error);
      Alert.alert('Fel', 'Kunde inte skicka meddelande');
    }
  };

  const handleShiftInterest = async (messageId: string) => {
    if (!user) return;

    try {
      // Hämta meddelandet
      const { data: message } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (!message || message.message_type !== 'shift_interest') return;

      // Lägg till användaren i intresserade
      const shiftInterest = message.shift_interest || {};
      const interestedUsers = [...(shiftInterest.interested_users || []), user.id];

      // Uppdatera meddelandet
      await supabase
        .from('chat_messages')
        .update({
          shift_interest: {
            ...shiftInterest,
            interested_users: interestedUsers
          }
        })
        .eq('id', messageId);

      // Skapa privat chatt med meddelandets skapare
      const channelData = {
        name: `Skiftintresse - ${shiftInterest.shift_date}`,
        type: 'private',
        participants: [message.user_id, user.id],
        created_by: user.id
      };

      const { data: channel, error } = await supabase
        .from('chat_channels')
        .insert(channelData)
        .select()
        .single();

      if (error) throw error;

      // Lägg till kanalen i listan
      const newChannel: ChatChannel = {
        id: channel.id,
        name: channel.name,
        type: 'private',
        participants: channel.participants,
        unread_count: 0
      };

      setChannels(prev => [...prev, newChannel]);
      setCurrentChannel(newChannel);

      Alert.alert(
        'Intresse registrerat!',
        'Du har skickats till en privat chatt med skiftets ägare för att bekräfta detaljer.'
      );

    } catch (error) {
      console.error('Error handling shift interest:', error);
      Alert.alert('Fel', 'Kunde inte registrera intresse');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Fel', 'Kunde inte välja bild');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!currentChannel || !user) return;

    try {
      setUploadingImage(true);

      // Konvertera URI till blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Ladda upp till Supabase Storage
      const fileName = `chat_images/${Date.now()}_${Math.random()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Hämta public URL
      const { data: urlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      // Skicka meddelande med bild
      const messageData: any = {
        user_id: user.id,
        message: 'Bild',
        message_type: 'image',
        image_url: urlData.publicUrl
      };

      if (currentChannel.type === 'team') {
        messageData.team_id = currentChannel.team_id;
      } else if (currentChannel.type === 'department') {
        messageData.department_id = currentChannel.department_id;
      } else if (currentChannel.type === 'company') {
        messageData.company_id = currentChannel.company_id;
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert(messageData);

      if (error) throw error;

    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Fel', 'Kunde inte ladda upp bild');
    } finally {
      setUploadingImage(false);
    }
  };

  const createPrivateChat = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Fel', 'Välj minst en användare');
      return;
    }

    try {
      // Skapa privat kanal
      const channelData = {
        name: `Privat chatt`,
        type: 'private',
        participants: [user.id, ...selectedUsers],
        created_by: user.id
      };

      const { data: channel, error } = await supabase
        .from('chat_channels')
        .insert(channelData)
        .select()
        .single();

      if (error) throw error;

      // Lägg till kanalen i listan
      const newChannel: ChatChannel = {
        id: channel.id,
        name: channel.name,
        type: 'private',
        participants: channel.participants,
        unread_count: 0
      };

      setChannels(prev => [...prev, newChannel]);
      setCurrentChannel(newChannel);
      setShowPrivateChatModal(false);
      setSelectedUsers([]);

    } catch (error) {
      console.error('Error creating private chat:', error);
      Alert.alert('Fel', 'Kunde inte skapa privat chatt');
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .neq('id', user?.id);

      if (error) throw error;

      if (users) {
        setAvailableUsers(users.map(user => ({
          id: user.id,
          name: user.full_name || 'Okänd',
          avatar_url: user.avatar_url,
          is_online: false,
          last_seen: ''
        })));
      }
    } catch (error) {
      console.error('Error loading available users:', error);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isInterestedInShift = (message: ChatMessage) => {
    if (message.message_type !== 'shift_interest' || !message.shift_interest) return false;
    return message.shift_interest.interested_users?.includes(user?.id) || false;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Laddar chatt...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowChannelList(!showChannelList)}
        >
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {currentChannel?.name || 'Chatt'}
        </Text>
        
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={() => {
            loadAvailableUsers();
            setShowPrivateChatModal(true);
          }}
        >
          <Text style={styles.newChatButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Channel List */}
        {showChannelList && (
          <View style={styles.channelList}>
            <Text style={styles.channelListTitle}>Kanaler</Text>
            
            {channels.map(channel => (
              <TouchableOpacity
                key={channel.id}
                style={[
                  styles.channelItem,
                  currentChannel?.id === channel.id && styles.activeChannelItem
                ]}
                onPress={() => setCurrentChannel(channel)}
              >
                <View style={styles.channelInfo}>
                  <Text style={[
                    styles.channelName,
                    currentChannel?.id === channel.id && styles.activeChannelName
                  ]}>
                    {channel.name}
                  </Text>
                  {channel.last_message && (
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {channel.last_message}
                    </Text>
                  )}
                </View>
                
                {channel.unread_count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{channel.unread_count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Chat Area */}
        <View style={styles.chatArea}>
          {/* Online Users */}
          <View style={styles.onlineUsers}>
            <Text style={styles.onlineTitle}>Online ({onlineUsers.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {onlineUsers.map(user => (
                <View key={user.id} style={styles.onlineUser}>
                  <View style={styles.avatarContainer}>
                    {user.avatar_url ? (
                      <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                    ) : (
                      <View style={styles.defaultAvatar}>
                        <Text style={styles.defaultAvatarText}>
                          {user.name.charAt(0)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.onlineIndicator} />
                  </View>
                  <Text style={styles.onlineUserName}>{user.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Messages */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(message => (
              <View 
                key={message.id} 
                style={[
                  styles.messageContainer,
                  message.user_id === user?.id && styles.ownMessage
                ]}
              >
                {message.user_id !== user?.id && (
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageAuthor}>
                      {message.user_name || 'Okänd'}
                    </Text>
                    <Text style={styles.messageTime}>
                      {formatTime(message.created_at)}
                    </Text>
                  </View>
                )}
                
                <View style={styles.messageContent}>
                  {message.message_type === 'image' ? (
                    <Image 
                      source={{ uri: message.image_url }} 
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  ) : message.message_type === 'shift_interest' ? (
                    <View style={styles.shiftInterestCard}>
                      <Text style={styles.shiftInterestTitle}>
                        💼 Intresserad av att arbeta
                      </Text>
                      {message.shift_interest && (
                        <View style={styles.shiftInterestDetails}>
                          <Text style={styles.shiftInterestText}>
                            Datum: {message.shift_interest.shift_date}
                          </Text>
                          <Text style={styles.shiftInterestText}>
                            Skift: {message.shift_interest.shift_type}
                          </Text>
                          <Text style={styles.shiftInterestText}>
                            Tid: {message.shift_interest.shift_time}
                          </Text>
                        </View>
                      )}
                      {message.user_id !== user?.id && !isInterestedInShift(message) && (
                        <TouchableOpacity
                          style={styles.interestButton}
                          onPress={() => handleShiftInterest(message.id)}
                        >
                          <Text style={styles.interestButtonText}>
                            Jag är intresserad
                          </Text>
                        </TouchableOpacity>
                      )}
                      {isInterestedInShift(message) && (
                        <View style={styles.interestedBadge}>
                          <Text style={styles.interestedText}>✓ Intresserad</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={[
                      styles.messageText,
                      message.user_id === user?.id && styles.ownMessageText
                    ]}>
                      {message.message}
                    </Text>
                  )}
                </View>
                
                {message.user_id === user?.id && (
                  <Text style={styles.ownMessageTime}>
                    {formatTime(message.created_at)}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <TouchableOpacity 
              style={styles.attachButton}
              onPress={pickImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={styles.attachButtonText}>📷</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.predefinedButton}
              onPress={() => setShowPredefinedMessages(true)}
            >
              <Text style={styles.predefinedButtonText}>💬</Text>
            </TouchableOpacity>
            
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Skriv ett meddelande..."
              multiline
              maxLength={1000}
            />
            
            <TouchableOpacity 
              style={[
                styles.sendButton,
                !newMessage.trim() && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Text style={styles.sendButtonText}>Skicka</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Predefined Messages Modal */}
      <Modal
        visible={showPredefinedMessages}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Färdiga meddelanden</Text>
            <TouchableOpacity 
              onPress={() => setShowPredefinedMessages(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={predefinedMessages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.predefinedMessageItem}
                onPress={() => {
                  if (item.category === 'shift_interest') {
                    setShowShiftInterestModal(true);
                  } else {
                    sendPredefinedMessage(item);
                  }
                }}
              >
                <Text style={styles.predefinedMessageIcon}>{item.icon}</Text>
                <Text style={styles.predefinedMessageText}>{item.text}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Shift Interest Modal */}
      <Modal
        visible={showShiftInterestModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Skiftintresse</Text>
            <TouchableOpacity 
              onPress={() => setShowShiftInterestModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.shiftInterestForm}>
            <Text style={styles.formLabel}>Datum</Text>
            <TextInput
              style={styles.formInput}
              value={shiftInterestData.shift_date}
              onChangeText={(text) => setShiftInterestData(prev => ({ ...prev, shift_date: text }))}
              placeholder="YYYY-MM-DD"
            />
            
            <Text style={styles.formLabel}>Skifttyp</Text>
            <TextInput
              style={styles.formInput}
              value={shiftInterestData.shift_type}
              onChangeText={(text) => setShiftInterestData(prev => ({ ...prev, shift_type: text }))}
              placeholder="T.ex. Natt, Dag, Kväll"
            />
            
            <Text style={styles.formLabel}>Tid</Text>
            <TextInput
              style={styles.formInput}
              value={shiftInterestData.shift_time}
              onChangeText={(text) => setShiftInterestData(prev => ({ ...prev, shift_time: text }))}
              placeholder="T.ex. 22:00-06:00"
            />
            
            <TouchableOpacity
              style={[
                styles.sendShiftInterestButton,
                (!shiftInterestData.shift_date || !shiftInterestData.shift_type || !shiftInterestData.shift_time) && 
                styles.sendShiftInterestButtonDisabled
              ]}
              onPress={() => {
                sendPredefinedMessage({
                  id: 'shift_interest',
                  text: 'Intresserad av att arbeta',
                  category: 'shift_interest',
                  icon: '💼'
                });
                setShowShiftInterestModal(false);
              }}
              disabled={!shiftInterestData.shift_date || !shiftInterestData.shift_type || !shiftInterestData.shift_time}
            >
              <Text style={styles.sendShiftInterestButtonText}>
                Skicka skiftintresse
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Private Chat Modal */}
      <Modal
        visible={showPrivateChatModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Skapa privat chatt</Text>
            <TouchableOpacity 
              onPress={() => setShowPrivateChatModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={availableUsers}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.userItem,
                  selectedUsers.includes(item.id) && styles.selectedUserItem
                ]}
                onPress={() => toggleUserSelection(item.id)}
              >
                <View style={styles.userAvatar}>
                  {item.avatar_url ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.userAvatarImage} />
                  ) : (
                    <View style={styles.defaultUserAvatar}>
                      <Text style={styles.defaultUserAvatarText}>
                        {item.name.charAt(0)}
                      </Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.userName}>{item.name}</Text>
                
                {selectedUsers.includes(item.id) && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.createChatButton,
                selectedUsers.length === 0 && styles.createChatButtonDisabled
              ]}
              onPress={createPrivateChat}
              disabled={selectedUsers.length === 0}
            >
              <Text style={styles.createChatButtonText}>
                Skapa chatt ({selectedUsers.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuButton: {
    padding: 8,
  },
  menuButtonText: {
    fontSize: 20,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  newChatButton: {
    padding: 8,
  },
  newChatButtonText: {
    fontSize: 20,
    color: '#007AFF',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  channelList: {
    width: 250,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  channelListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  channelItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeChannelItem: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  activeChannelName: {
    color: '#007AFF',
  },
  lastMessage: {
    fontSize: 12,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  chatArea: {
    flex: 1,
  },
  onlineUsers: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  onlineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  onlineUser: {
    alignItems: 'center',
    marginRight: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  defaultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: '#fff',
  },
  onlineUserName: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageAuthor: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
    marginRight: 8,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
  },
  messageContent: {
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  ownMessageText: {
    backgroundColor: '#007AFF',
    color: '#fff',
    borderRadius: 16,
    borderTopRightRadius: 4,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  shiftInterestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxWidth: '100%',
  },
  shiftInterestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  shiftInterestDetails: {
    marginBottom: 12,
  },
  shiftInterestText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  interestButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  interestButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  interestedBadge: {
    backgroundColor: '#4CD964',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  interestedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  ownMessageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  attachButtonText: {
    fontSize: 20,
  },
  predefinedButton: {
    padding: 8,
    marginRight: 8,
  },
  predefinedButtonText: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  predefinedMessageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  predefinedMessageIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  predefinedMessageText: {
    fontSize: 16,
    color: '#333',
  },
  shiftInterestForm: {
    padding: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendShiftInterestButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  sendShiftInterestButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendShiftInterestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedUserItem: {
    backgroundColor: '#f0f8ff',
  },
  userAvatar: {
    marginRight: 12,
  },
  userAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  defaultUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultUserAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  createChatButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createChatButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 