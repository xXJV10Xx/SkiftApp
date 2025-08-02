import { View, Text, FlatList, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import ChatMessage from '../components/ChatMessage';
import ExtraWorkForm from '../forms/ExtraWorkForm';
import ShiftHandoverForm from '../forms/ShiftHandoverForm';
import BreakdownForm from '../forms/BreakdownForm';

interface Message {
  id: string;
  content: string;
  type: string;
  form_type?: string;
  metadata?: any;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

interface GroupMember {
  id: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  is_online: boolean;
}

export default function ChatGroup() {
  const { groupId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (!groupId) return;
    
    fetchGroupData();
    fetchMessages();
    fetchMembers();
    updateOnlineStatus(true);

    // Realtime subscription för meddelanden
    const messagesSubscription = supabase
      .channel(`chat_messages_${groupId}`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          fetchMessages(); // Refetch för att få user data
        }
      )
      .subscribe();

    // Realtime subscription för online status
    const membersSubscription = supabase
      .channel(`chat_members_${groupId}`)
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'chat_group_members',
          filter: `group_id=eq.${groupId}`
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      updateOnlineStatus(false);
      messagesSubscription.unsubscribe();
      membersSubscription.unsubscribe();
    };
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_groups')
        .select('name')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      setGroupName(data.name);
    } catch (error) {
      console.error('Error fetching group:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          user:users(id, name, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Scrolla till botten
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_group_members')
        .select(`
          *,
          user:users(id, name, avatar_url)
        `)
        .eq('group_id', groupId);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const updateOnlineStatus = async (isOnline: boolean) => {
    try {
      await supabase
        .from('chat_group_members')
        .update({ is_online: isOnline })
        .eq('group_id', groupId)
        .eq('user_id', user?.id);
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  const sendMessage = async (messageData?: any) => {
    const messageToSend = messageData || {
      type: 'text',
      content: newMessage.trim()
    };

    if (!messageToSend.content.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          group_id: groupId,
          user_id: user?.id,
          content: messageToSend.content,
          type: messageToSend.type || 'text',
          form_type: messageToSend.form_type,
          metadata: messageToSend.metadata
        });

      if (error) throw error;
      
      if (!messageData) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Fel', 'Kunde inte skicka meddelandet');
    }
  };

  const openFormModal = (formType: string) => {
    setActiveForm(formType);
    setShowFormModal(true);
  };

  const handleFormSubmit = (formData: any) => {
    sendMessage(formData);
    setShowFormModal(false);
    setActiveForm(null);
  };

  const handleInterested = async (messageId: string) => {
    try {
      // Hitta meddelandet och skaparen
      const message = messages.find(m => m.id === messageId);
      if (!message || !user) return;

      // Skicka privat meddelande
      const { error } = await supabase
        .from('private_messages')
        .insert({
          from_user_id: user.id,
          to_user_id: message.user.id,
          content: `Hej! Jag är intresserad av ditt extra arbete från ${new Date(message.created_at).toLocaleDateString('sv-SE')}. Kan vi prata mer om det?`,
          related_message_id: messageId
        });

      if (error) throw error;
      
      Alert.alert('Skickat!', 'Ett privat meddelande har skickats till användaren.');
    } catch (error) {
      console.error('Error sending private message:', error);
      Alert.alert('Fel', 'Kunde inte skicka privat meddelande');
    }
  };

  const renderForm = () => {
    switch (activeForm) {
      case 'extra_work':
        return <ExtraWorkForm onSend={handleFormSubmit} />;
      case 'shift_handover':
        return <ShiftHandoverForm onSend={handleFormSubmit} />;
      case 'breakdown':
        return <BreakdownForm onSend={handleFormSubmit} />;
      default:
        return null;
    }
  };

  const onlineMembers = members.filter(m => m.is_online);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Laddar chatt...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header med gruppnamn och online medlemmar */}
      <View className="bg-blue-500 p-4 pt-12">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-white text-lg">← Tillbaka</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold mt-2">{groupName}</Text>
        <Text className="text-blue-100">
          {onlineMembers.length} av {members.length} online
        </Text>
      </View>

      {/* Meddelanden */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatMessage 
            message={item} 
            onInterested={item.form_type === 'extra_work' && item.user.id !== user?.id ? handleInterested : undefined}
          />
        )}
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => 
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      {/* Formulärknappar */}
      <View className="flex-row justify-around p-2 border-t border-gray-200 bg-gray-50">
        <TouchableOpacity
          className="bg-green-500 px-3 py-2 rounded"
          onPress={() => openFormModal('extra_work')}
        >
          <Text className="text-white text-sm">Extra arbete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-orange-500 px-3 py-2 rounded"
          onPress={() => openFormModal('shift_handover')}
        >
          <Text className="text-white text-sm">Skiftöverlämning</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-red-500 px-3 py-2 rounded"
          onPress={() => openFormModal('breakdown')}
        >
          <Text className="text-white text-sm">Haveri</Text>
        </TouchableOpacity>
      </View>

      {/* Textinmatning */}
      <View className="flex-row items-center p-4 border-t border-gray-200">
        <TextInput
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 mr-2"
          placeholder="Skriv ett meddelande..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity
          className="bg-blue-500 w-10 h-10 rounded-full items-center justify-center"
          onPress={() => sendMessage()}
        >
          <Text className="text-white font-bold">→</Text>
        </TouchableOpacity>
      </View>

      {/* Formulär modal */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 p-4 pt-12">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">
              {activeForm === 'extra_work' && 'Extra arbete'}
              {activeForm === 'shift_handover' && 'Skiftöverlämning'}
              {activeForm === 'breakdown' && 'Haveri'}
            </Text>
            <TouchableOpacity onPress={() => setShowFormModal(false)}>
              <Text className="text-blue-500 text-lg">Stäng</Text>
            </TouchableOpacity>
          </View>
          {renderForm()}
        </View>
      </Modal>
    </View>
  );
}