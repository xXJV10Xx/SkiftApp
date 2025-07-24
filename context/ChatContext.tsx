import { RealtimeChannel } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';
import { useOfflineChatStore, startAutoSync, stopAutoSync } from '../stores/OfflineChatStore';

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
  const { selectedCompany } = useCompany();
  const offlineStore = useOfflineChatStore();
  
  // Legacy state for backward compatibility - now sourced from offline store
  const [chatMembers, setChatMembers] = useState<ChatMember[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  
  // Proxy offline store state for backward compatibility
  const messages = offlineStore.messages;
  const chatRooms = offlineStore.chatRooms;
  const currentChatRoom = offlineStore.currentChatRoom;
  const loading = offlineStore.loading;

  // Fetch chat rooms user is member of - now uses offline store
  const fetchChatRooms = async () => {
    if (!user || !selectedCompany) return;
    
    // Load from offline store and sync if online
    await offlineStore.loadChatRooms(selectedCompany.id);
    if (offlineStore.isOnline) {
      await offlineStore.syncData();
    }
  };

  // Fetch messages for current chat room - now uses offline store
  const fetchMessages = async (roomId: string) => {
    await offlineStore.loadMessages(roomId);
    if (offlineStore.isOnline) {
      await offlineStore.syncData();
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

  // Send message - now uses offline store
  const sendMessage = async (content: string, messageType = 'text') => {
    if (!user || !currentChatRoom) return;

    try {
      await offlineStore.sendMessage(content, messageType, user.id);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
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
      .subscribe();

    setChannel(messageChannel);

    return () => {
      messageChannel.unsubscribe();
    };
  }, [currentChatRoom]);

  // Set current chat room
  const setCurrentChatRoom = (room: ChatRoom | null) => {
    offlineStore.setCurrentChatRoom(room);
  };

  // Initialize offline store and start auto-sync
  useEffect(() => {
    offlineStore.initialize();
    startAutoSync(30000); // Sync every 30 seconds
    
    return () => {
      stopAutoSync();
    };
  }, []);

  // Load data when current chat room changes
  useEffect(() => {
    if (currentChatRoom) {
      fetchChatMembers(currentChatRoom.id);
    } else {
      setChatMembers([]);
    }
  }, [currentChatRoom]);

  // Load chat rooms on mount
  useEffect(() => {
    if (user && selectedCompany) {
      fetchChatRooms();
    }
  }, [user, selectedCompany]);

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