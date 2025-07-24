import { create } from 'zustand';
import { supabase } from './supabase';

export type MessageStatus = 'pending' | 'sent' | 'error';

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
  status?: MessageStatus; // For optimistic updates
  tempId?: string; // Temporary ID for pending messages
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

interface ChatStore {
  messages: ChatMessage[];
  chatRooms: ChatRoom[];
  currentChatRoom: ChatRoom | null;
  chatMembers: ChatMember[];
  loading: boolean;
  
  // Actions
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (content: string, userId: string, messageType?: string) => Promise<void>;
  updateMessageStatus: (tempId: string, status: MessageStatus, realId?: string) => void;
  retryMessage: (tempId: string) => Promise<void>;
  setChatRooms: (rooms: ChatRoom[]) => void;
  setCurrentChatRoom: (room: ChatRoom | null) => void;
  setChatMembers: (members: ChatMember[]) => void;
  setLoading: (loading: boolean) => void;
  
  // Real-time message handler
  handleRealtimeMessage: (message: ChatMessage) => void;
}

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  chatRooms: [],
  currentChatRoom: null,
  chatMembers: [],
  loading: false,

  setMessages: (messages) => set({ messages }),
  
  setChatRooms: (chatRooms) => set({ chatRooms }),
  
  setCurrentChatRoom: (currentChatRoom) => set({ currentChatRoom }),
  
  setChatMembers: (chatMembers) => set({ chatMembers }),
  
  setLoading: (loading) => set({ loading }),

  addMessage: async (content: string, userId: string, messageType = 'text') => {
    const { currentChatRoom, messages } = get();
    
    if (!currentChatRoom) {
      throw new Error('No chat room selected');
    }

    const tempId = generateTempId();
    const now = new Date().toISOString();
    
    // Create optimistic message
    const optimisticMessage: ChatMessage = {
      id: tempId,
      chat_room_id: currentChatRoom.id,
      sender_id: userId,
      content,
      message_type: messageType,
      file_url: null,
      reply_to: null,
      is_edited: false,
      created_at: now,
      updated_at: now,
      status: 'pending',
      tempId,
    };

    // Immediately add to local state
    set({ messages: [...messages, optimisticMessage] });

    try {
      // Attempt to send to Supabase
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: currentChatRoom.id,
          sender_id: userId,
          content,
          message_type: messageType
        })
        .select(`
          *,
          sender:employees!sender_id (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update message status to 'sent' and replace with real data
      set(state => ({
        messages: state.messages.map(msg => 
          msg.tempId === tempId 
            ? { ...data, status: 'sent' as MessageStatus }
            : msg
        )
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update message status to 'error'
      set(state => ({
        messages: state.messages.map(msg => 
          msg.tempId === tempId 
            ? { ...msg, status: 'error' as MessageStatus }
            : msg
        )
      }));
      
      throw error;
    }
  },

  updateMessageStatus: (tempId: string, status: MessageStatus, realId?: string) => {
    set(state => ({
      messages: state.messages.map(msg => 
        msg.tempId === tempId 
          ? { ...msg, status, ...(realId && { id: realId }) }
          : msg
      )
    }));
  },

  retryMessage: async (tempId: string) => {
    const { messages } = get();
    const messageToRetry = messages.find(msg => msg.tempId === tempId);
    
    if (!messageToRetry) {
      throw new Error('Message not found');
    }

    // Update status to pending
    set(state => ({
      messages: state.messages.map(msg => 
        msg.tempId === tempId 
          ? { ...msg, status: 'pending' as MessageStatus }
          : msg
      )
    }));

    try {
      // Retry sending to Supabase
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: messageToRetry.chat_room_id,
          sender_id: messageToRetry.sender_id,
          content: messageToRetry.content,
          message_type: messageToRetry.message_type
        })
        .select(`
          *,
          sender:employees!sender_id (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update message with real data and 'sent' status
      set(state => ({
        messages: state.messages.map(msg => 
          msg.tempId === tempId 
            ? { ...data, status: 'sent' as MessageStatus }
            : msg
        )
      }));

    } catch (error) {
      console.error('Error retrying message:', error);
      
      // Update status back to 'error'
      set(state => ({
        messages: state.messages.map(msg => 
          msg.tempId === tempId 
            ? { ...msg, status: 'error' as MessageStatus }
            : msg
        )
      }));
      
      throw error;
    }
  },

  handleRealtimeMessage: (message: ChatMessage) => {
    const { messages } = get();
    
    // Check if this message already exists (to avoid duplicates from optimistic updates)
    const existingMessage = messages.find(msg => 
      msg.id === message.id || 
      (msg.tempId && msg.sender_id === message.sender_id && msg.content === message.content && msg.created_at === message.created_at)
    );
    
    if (!existingMessage) {
      // Add new message from realtime
      set({ messages: [...messages, { ...message, status: 'sent' }] });
    }
  },
}));