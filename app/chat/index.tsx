import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface ChatGroup {
  id: string;
  name: string;
  company_id: string;
  department_id: string;
  shift_team_id: string;
  created_at: string;
  last_message?: {
    content: string;
    created_at: string;
    user: { name: string };
  };
  online_members: number;
}

export default function ChatIndex() {
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    fetchChatGroups();
    
    // Realtime subscription för nya grupper
    const groupsSubscription = supabase
      .channel('chat_groups')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chat_groups' },
        () => fetchChatGroups()
      )
      .subscribe();

    return () => {
      groupsSubscription.unsubscribe();
    };
  }, []);

  const fetchChatGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_groups')
        .select(`
          *,
          chat_messages!inner(
            content,
            created_at,
            user:users(name)
          ),
          chat_group_members!inner(
            user_id,
            is_online
          )
        `)
        .eq('chat_group_members.user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const groupsWithStats = data?.map(group => ({
        ...group,
        last_message: group.chat_messages?.[0] || null,
        online_members: group.chat_group_members?.filter(m => m.is_online).length || 0
      })) || [];

      setGroups(groupsWithStats);
    } catch (error) {
      console.error('Error fetching chat groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChatGroup = ({ item }: { item: ChatGroup }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 border-b border-gray-200 bg-white"
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-3">
        <Text className="text-white font-bold text-lg">
          {item.name?.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="font-bold text-lg">{item.name}</Text>
          <View className="flex-row items-center">
            <View className="w-2 h-2 bg-green-500 rounded-full mr-1" />
            <Text className="text-sm text-gray-600">{item.online_members}</Text>
          </View>
        </View>
        
        {item.last_message && (
          <View className="mt-1">
            <Text className="text-gray-600 text-sm" numberOfLines={1}>
              {item.last_message.user.name}: {item.last_message.content}
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              {new Date(item.last_message.created_at).toLocaleTimeString('sv-SE', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg">Laddar chattar...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-2xl font-bold">Gruppchatt</Text>
        <Text className="text-gray-600">Välj en chatt för att börja</Text>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderChatGroup}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push('/chat/new')}
      >
        <Text className="text-white text-2xl font-bold">+</Text>
      </TouchableOpacity>
    </View>
  );
}