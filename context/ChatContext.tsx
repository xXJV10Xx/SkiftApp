import { RealtimeChannel } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ChatMessage {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url: string | null;
  reply_to: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
  };
}

interface ChatRoom {
  id: string;
  company_id: string | null;
  team_id: string | null;
  name: string;
  description: string | null;
  type: string;
  department: string | null;
  is_private: boolean;
  auto_join_department: string | null;
  auto_join_team: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  companies?: {
    name: string;
  };
  teams?: {
    name: string;
    color: string;
  };
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
  error: string | null;
  sendMessage: (content: string, messageType?: string) => Promise<void>;
  joinChatRoom: (roomId: string) => Promise<void>;
  leaveChatRoom: (roomId: string) => Promise<void>;
  setCurrentChatRoom: (room: ChatRoom | null) => void;
  fetchChatRooms: () => Promise<void>;
  createChatRoom: (roomData: any) => Promise<void>;
  clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentChatRoom, setCurrentChatRoom] = useState<ChatRoom | null>(null);
  const [chatMembers, setChatMembers] = useState<ChatMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const clearError = () => setError(null);

  // Fetch chat rooms user is member of
  const fetchChatRooms = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
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

      if (error) {
        console.error('Error fetching chat rooms:', error);
        setError('Kunde inte hämta chattrum');
        return;
      }

      const rooms = data?.map(item => item.chat_rooms).filter(Boolean) as ChatRoom[];
      setChatRooms(rooms || []);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      setError('Ett oväntat fel uppstod vid hämtning av chattrum');
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for current chat room
  const fetchMessages = async (roomId: string) => {
    try {
      setError(null);
      
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

      if (error) {
        console.error('Error fetching messages:', error);
        setError('Kunde inte hämta meddelanden');
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Ett oväntat fel uppstod vid hämtning av meddelanden');
    }
  };

  // Fetch chat room members
  const fetchChatMembers = async (roomId: string) => {
    try {
      setError(null);
      
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

      if (error) {
        console.error('Error fetching chat members:', error);
        setError('Kunde inte hämta chattmedlemmar');
        return;
      }

      setChatMembers(data || []);
    } catch (error) {
      console.error('Error fetching chat members:', error);
      setError('Ett oväntat fel uppstod vid hämtning av chattmedlemmar');
    }
  };

  // Send message
  const sendMessage = async (content: string, messageType = 'text') => {
    if (!user || !currentChatRoom) {
      throw new Error('Ingen användare eller chattrum valt');
    }

    if (!content.trim()) {
      throw new Error('Meddelandet får inte vara tomt');
    }

    try {
      setError(null);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: currentChatRoom.id,
          sender_id: user.id,
          content: content.trim(),
          message_type: messageType
        });

      if (error) {
        console.error('Error sending message:', error);
        throw new Error('Kunde inte skicka meddelandet');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ett oväntat fel uppstod vid skickande av meddelande');
      }
      throw error;
    }
  };

  // Join chat room
  const joinChatRoom = async (roomId: string) => {
    if (!user) {
      throw new Error('Ingen användare inloggad');
    }

    try {
      setError(null);
      
      const { error } = await supabase
        .from('chat_room_members')
        .insert({
          chat_room_id: roomId,
          employee_id: user.id,
          role: 'member'
        });

      if (error) {
        console.error('Error joining chat room:', error);
        throw new Error('Kunde inte gå med i chattrummet');
      }

      await fetchChatRooms();
    } catch (error) {
      console.error('Error joining chat room:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ett oväntat fel uppstod vid anslutning till chattrum');
      }
      throw error;
    }
  };

  // Leave chat room
  const leaveChatRoom = async (roomId: string) => {
    if (!user) {
      throw new Error('Ingen användare inloggad');
    }

    try {
      setError(null);
      
      const { error } = await supabase
        .from('chat_room_members')
        .delete()
        .eq('chat_room_id', roomId)
        .eq('employee_id', user.id);

      if (error) {
        console.error('Error leaving chat room:', error);
        throw new Error('Kunde inte lämna chattrummet');
      }
      
      if (currentChatRoom?.id === roomId) {
        setCurrentChatRoom(null);
      }
      
      await fetchChatRooms();
    } catch (error) {
      console.error('Error leaving chat room:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ett oväntat fel uppstod vid utträde från chattrum');
      }
      throw error;
    }
  };

  // Create chat room
  const createChatRoom = async (roomData: any) => {
    if (!user) {
      throw new Error('Ingen användare inloggad');
    }

    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          ...roomData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat room:', error);
        throw new Error('Kunde inte skapa chattrummet');
      }

      // Auto-join creator to the room
      await joinChatRoom(data.id);
    } catch (error) {
      console.error('Error creating chat room:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Ett oväntat fel uppstod vid skapande av chattrum');
      }
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

    try {
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
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `chat_room_id=eq.${currentChatRoom.id}`,
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
        .subscribe((status) => {
          if (status === 'SUBSCRIPTION_ERROR') {
            console.error('Subscription error for chat room:', currentChatRoom.id);
            setError('Realtidsuppdateringar kunde inte aktiveras');
          }
        });

      setChannel(messageChannel);

      return () => {
        messageChannel.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      setError('Kunde inte aktivera realtidsuppdateringar');
    }
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
    } else {
      // Reset state when user logs out
      setChatRooms([]);
      setCurrentChatRoom(null);
      setMessages([]);
      setChatMembers([]);
      setError(null);
      if (channel) {
        channel.unsubscribe();
        setChannel(null);
      }
    }
  }, [user]);

  const value = {
    messages,
    chatRooms,
    currentChatRoom,
    chatMembers,
    loading,
    error,
    sendMessage,
    joinChatRoom,
    leaveChatRoom,
    setCurrentChatRoom,
    fetchChatRooms,
    createChatRoom,
    clearError
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