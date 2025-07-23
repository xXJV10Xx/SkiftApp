import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fsefeherdbtsddqimjco.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          fcm_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          fcm_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          fcm_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      shifts: {
        Row: {
          id: string;
          owner_id: string;
          start_time: string;
          end_time: string;
          title: string;
          description: string | null;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          start_time: string;
          end_time: string;
          title: string;
          description?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          start_time?: string;
          end_time?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      shift_trade_requests: {
        Row: {
          id: string;
          shift_id: string;
          requesting_user_id: string;
          message: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shift_id: string;
          requesting_user_id: string;
          message?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shift_id?: string;
          requesting_user_id?: string;
          message?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      private_chats: {
        Row: {
          id: string;
          trade_request_id: string;
          participants: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trade_request_id: string;
          participants: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trade_request_id?: string;
          participants?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Type helpers
export type Shift = Database['public']['Tables']['shifts']['Row'];
export type ShiftInsert = Database['public']['Tables']['shifts']['Insert'];
export type ShiftUpdate = Database['public']['Tables']['shifts']['Update'];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type ShiftTradeRequest = Database['public']['Tables']['shift_trade_requests']['Row'];
export type ShiftTradeRequestInsert = Database['public']['Tables']['shift_trade_requests']['Insert'];
export type ShiftTradeRequestUpdate = Database['public']['Tables']['shift_trade_requests']['Update'];

export type PrivateChat = Database['public']['Tables']['private_chats']['Row'];
export type PrivateChatInsert = Database['public']['Tables']['private_chats']['Insert'];
export type PrivateChatUpdate = Database['public']['Tables']['private_chats']['Update'];

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

// Utility functions för Edge Functions
export const callEdgeFunction = async (functionName: string, payload: any) => {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: JSON.stringify(payload),
  });
  
  if (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
  
  return data;
};

// Realtime subscriptions helpers
export const subscribeToMessages = (chatId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`messages:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToShifts = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`shifts:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shifts',
        filter: `owner_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToTradeRequests = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`trade_requests:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shift_trade_requests',
        filter: `requesting_user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};