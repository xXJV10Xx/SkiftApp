import { create } from 'zustand';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';

// Types from the existing ChatContext
export interface ChatMessage {
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

export interface ChatRoom {
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

export interface ChatMember {
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

interface ChatState {
  // State
  messages: ChatMessage[];
  chatRooms: ChatRoom[];
  currentChatRoom: ChatRoom | null;
  chatMembers: ChatMember[];
  currentTeamId: string | null;
  loading: boolean;
  error: string | null;
  channel: RealtimeChannel | null;
  
  // Actions
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (message: ChatMessage) => void;
  setChatRooms: (rooms: ChatRoom[]) => void;
  setCurrentChatRoom: (room: ChatRoom | null) => void;
  setChatMembers: (members: ChatMember[]) => void;
  setCurrentTeamId: (teamId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setChannel: (channel: RealtimeChannel | null) => void;
  
  // Async actions
  fetchChatRooms: (userId: string) => Promise<void>;
  fetchMessages: (roomId: string) => Promise<void>;
  fetchChatMembers: (roomId: string) => Promise<void>;
  sendMessage: (content: string, userId: string, messageType?: string) => Promise<void>;
  joinChatRoom: (roomId: string, userId: string) => Promise<void>;
  leaveChatRoom: (roomId: string, userId: string) => Promise<void>;
  createChatRoom: (roomData: any, userId: string) => Promise<void>;
  subscribeToRoom: (roomId: string) => void;
  unsubscribeFromRoom: () => void;
  
  // Reset actions
  reset: () => void;
  resetMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  chatRooms: [],
  currentChatRoom: null,
  chatMembers: [],
  currentTeamId: null,
  loading: false,
  error: null,
  channel: null,

  // State setters
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  updateMessage: (updatedMessage) => set((state) => ({
    messages: state.messages.map(msg => 
      msg.id === updatedMessage.id ? updatedMessage : msg
    )
  })),
  setChatRooms: (chatRooms) => set({ chatRooms }),
  setCurrentChatRoom: (currentChatRoom) => set({ currentChatRoom }),
  setChatMembers: (chatMembers) => set({ chatMembers }),
  setCurrentTeamId: (currentTeamId) => set({ currentTeamId }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setChannel: (channel) => set({ channel }),

  // Async actions
  fetchChatRooms: async (userId: string) => {
    if (!userId) return;

    try {
      set({ loading: true, error: null });
      
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
        .eq('employee_id', userId);

      if (error) throw error;

      const rooms = (data?.map(item => item.chat_rooms).filter(Boolean) || []) as ChatRoom[];
      set({ chatRooms: rooms || [], loading: false });
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch chat rooms',
        loading: false 
      });
    }
  },

  fetchMessages: async (roomId: string) => {
    try {
      set({ loading: true, error: null });
      
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
      
      set({ messages: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
        loading: false 
      });
    }
  },

  fetchChatMembers: async (roomId: string) => {
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
      
      set({ chatMembers: data || [] });
    } catch (error) {
      console.error('Error fetching chat members:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch chat members'
      });
    }
  },

  sendMessage: async (content: string, userId: string, messageType = 'text') => {
    const { currentChatRoom } = get();
    if (!userId || !currentChatRoom) return;

    try {
      set({ error: null });
      
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: currentChatRoom.id,
          sender_id: userId,
          content,
          message_type: messageType
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to send message'
      });
      throw error;
    }
  },

  joinChatRoom: async (roomId: string, userId: string) => {
    if (!userId) return;

    try {
      set({ error: null });
      
      const { error } = await supabase
        .from('chat_room_members')
        .insert({
          chat_room_id: roomId,
          employee_id: userId,
          role: 'member'
        });

      if (error) throw error;
      
      // Refresh chat rooms
      await get().fetchChatRooms(userId);
    } catch (error) {
      console.error('Error joining chat room:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to join chat room'
      });
      throw error;
    }
  },

  leaveChatRoom: async (roomId: string, userId: string) => {
    if (!userId) return;

    try {
      set({ error: null });
      
      const { error } = await supabase
        .from('chat_room_members')
        .delete()
        .eq('chat_room_id', roomId)
        .eq('employee_id', userId);

      if (error) throw error;
      
      const { currentChatRoom } = get();
      if (currentChatRoom?.id === roomId) {
        set({ currentChatRoom: null });
      }
      
      // Refresh chat rooms
      await get().fetchChatRooms(userId);
    } catch (error) {
      console.error('Error leaving chat room:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to leave chat room'
      });
      throw error;
    }
  },

  createChatRoom: async (roomData: any, userId: string) => {
    if (!userId) return;

    try {
      set({ error: null });
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          ...roomData,
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join creator to the room
      await get().joinChatRoom(data.id, userId);
    } catch (error) {
      console.error('Error creating chat room:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create chat room'
      });
      throw error;
    }
  },

  subscribeToRoom: (roomId: string) => {
    const { channel } = get();
    
    // Unsubscribe from previous channel
    if (channel) {
      channel.unsubscribe();
    }

    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          get().addMessage(newMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          get().updateMessage(updatedMessage);
        }
      )
      .subscribe();

    set({ channel: messageChannel });
  },

  unsubscribeFromRoom: () => {
    const { channel } = get();
    if (channel) {
      channel.unsubscribe();
      set({ channel: null });
    }
  },

  // Reset actions
  reset: () => set({
    messages: [],
    chatRooms: [],
    currentChatRoom: null,
    chatMembers: [],
    currentTeamId: null,
    loading: false,
    error: null,
    channel: null,
  }),

  resetMessages: () => set({
    messages: [],
    chatMembers: [],
  }),
}));