import { RealtimeChannel } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  message_type: string;
  edited_at: string | null;
  reply_to: string | null;
  created_at: string;
  sender?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  company_id: string | null;
  team_identifier: string | null;
  is_public: boolean;
  is_company_specific: boolean;
  is_team_specific: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatMember {
  id: string;
  chat_room_id: string;
  employee_id: string;
  role: string;
  joined_at: string;
  employees?: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
    department: string | null;
    position: string | null;
  };
}

interface ChatContextType {
  messages: ChatMessage[];
  chatRooms: ChatRoom[];
  currentChatRoom: ChatRoom | null;
  chatMembers: ChatMember[];
  loading: boolean;
  sendMessage: (content: string, messageType?: string) => Promise<void>;
  joinChatRoom: (roomId: string) => Promise<void>;
  leaveChatRoom: (roomId: string) => Promise<void>;
  setCurrentChatRoom: (room: ChatRoom | null) => void;
  fetchChatRooms: () => Promise<void>;
  createChatRoom: (roomData: any) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentChatRoom, setCurrentChatRoom] = useState<ChatRoom | null>(null);
  const [chatMembers, setChatMembers] = useState<ChatMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch accessible chat rooms
  const fetchChatRooms = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get user's profile to know their company and team
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, selected_team')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Fetch public rooms, company rooms, and team rooms
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .or(`is_public.eq.true,and(is_company_specific.eq.true,company_id.eq.${profile.company_id}),and(is_team_specific.eq.true,company_id.eq.${profile.company_id},team_identifier.eq.${profile.selected_team})`);

      if (error) throw error;
      setChatRooms(data || []);
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
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!user_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Fetch chat room members (simplified for new schema)
  const fetchChatMembers = async (roomId: string) => {
    // Since we use RLS policies, we can't directly query members
    // Just set empty for now - could be enhanced later
    setChatMembers([]);
  };

  // Send message
  const sendMessage = async (content: string, messageType = 'text') => {
    if (!user || !currentChatRoom) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: currentChatRoom.id,
          user_id: user.id,
          content,
          message_type: messageType
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Join chat room (simplified - just select the room)
  const joinChatRoom = async (roomId: string) => {
    const room = chatRooms.find(r => r.id === roomId);
    if (room) {
      setCurrentChatRoom(room);
    }
  };

  // Leave chat room (simplified - just deselect)
  const leaveChatRoom = async (roomId: string) => {
    if (currentChatRoom?.id === roomId) {
      setCurrentChatRoom(null);
    }
  };

  // Create chat room
  const createChatRoom = async (roomData: any) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: roomData.name,
          description: roomData.description,
          company_id: roomData.company_id,
          team_identifier: roomData.team_id,
          is_public: !roomData.is_private,
          is_company_specific: roomData.type === 'company' || roomData.type === 'team',
          is_team_specific: roomData.type === 'team',
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh chat rooms
      await fetchChatRooms();
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!currentChatRoom) {
      if (channel) {
        channel.unsubscribe();
        setChannel(null);
      }
      return;
    }

    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`chat:${currentChatRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${currentChatRoom.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${currentChatRoom.id}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe();

    setChannel(messageChannel);

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

  const value = {
    messages,
    chatRooms,
    currentChatRoom,
    chatMembers,
    loading,
    sendMessage,
    joinChatRoom,
    leaveChatRoom,
    setCurrentChatRoom,
    fetchChatRooms,
    createChatRoom
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};