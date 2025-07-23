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
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          industry: string | null;
          size: string | null; // 'small', 'medium', 'large'
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          industry?: string | null;
          size?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          logo_url?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          industry?: string | null;
          size?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          company_id: string;
          manager_id: string | null;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          company_id: string;
          manager_id?: string | null;
          color: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          company_id?: string;
          manager_id?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          color: string;
          company_id: string;
          department_id: string | null;
          description: string | null;
          team_leader_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          company_id: string;
          department_id?: string | null;
          team_leader_id?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          company_id?: string;
          department_id?: string | null;
          team_leader_id?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          user_id: string;
          team_id: string;
          role: string; // 'member', 'leader', 'manager'
          joined_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          team_id: string;
          role?: string;
          joined_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          team_id?: string;
          role?: string;
          joined_at?: string;
          is_active?: boolean;
        };
      };
      shifts: {
        Row: {
          id: string;
          name: string;
          start_time: string;
          end_time: string;
          break_duration: number; // minutes
          color: string;
          company_id: string;
          department_id: string | null;
          team_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          start_time: string;
          end_time: string;
          break_duration?: number;
          color: string;
          company_id: string;
          department_id?: string | null;
          team_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          start_time?: string;
          end_time?: string;
          break_duration?: number;
          color?: string;
          company_id?: string;
          department_id?: string | null;
          team_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      shift_schedules: {
        Row: {
          id: string;
          user_id: string;
          shift_id: string;
          date: string;
          status: string; // 'scheduled', 'confirmed', 'completed', 'cancelled'
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          shift_id: string;
          date: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          shift_id?: string;
          date?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      shift_swaps: {
        Row: {
          id: string;
          requester_id: string;
          requested_user_id: string;
          shift_schedule_id: string;
          status: string; // 'pending', 'accepted', 'rejected', 'cancelled'
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          requested_user_id: string;
          shift_schedule_id: string;
          status?: string;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          requested_user_id?: string;
          shift_schedule_id?: string;
          status?: string;
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_channels: {
        Row: {
          id: string;
          name: string;
          type: string; // 'team', 'department', 'company', 'private'
          team_id: string | null;
          department_id: string | null;
          company_id: string | null;
          participants: string[] | null; // Array of user IDs for private chats
          created_by: string;
          last_message: string | null;
          last_message_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          team_id?: string | null;
          department_id?: string | null;
          company_id?: string | null;
          participants?: string[] | null;
          created_by: string;
          last_message?: string | null;
          last_message_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          team_id?: string | null;
          department_id?: string | null;
          company_id?: string | null;
          participants?: string[] | null;
          created_by?: string;
          last_message?: string | null;
          last_message_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          team_id: string | null;
          department_id: string | null;
          company_id: string | null;
          channel_id: string | null; // For private chats
          user_id: string;
          message: string;
          message_type: string; // 'text', 'image', 'file', 'system', 'shift_interest'
          image_url: string | null;
          shift_interest: any | null; // JSON object for shift interest data
          reply_to_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id?: string | null;
          department_id?: string | null;
          company_id?: string | null;
          channel_id?: string | null;
          user_id: string;
          message: string;
          message_type?: string;
          image_url?: string | null;
          shift_interest?: any | null;
          reply_to_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string | null;
          department_id?: string | null;
          company_id?: string | null;
          channel_id?: string | null;
          user_id?: string;
          message?: string;
          message_type?: string;
          image_url?: string | null;
          shift_interest?: any | null;
          reply_to_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      online_status: {
        Row: {
          id: string;
          user_id: string;
          is_online: boolean;
          last_seen: string;
          current_shift_id: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          is_online: boolean;
          last_seen?: string;
          current_shift_id?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          is_online?: boolean;
          last_seen?: string;
          current_shift_id?: string | null;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string; // 'shift_swap', 'chat', 'system', 'reminder'
          is_read: boolean;
          related_id: string | null; // ID to related record
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read?: boolean;
          related_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          is_read?: boolean;
          related_id?: string | null;
          created_at?: string;
        };
      };
      calendar_syncs: {
        Row: {
          id: string;
          user_id: string;
          calendar_type: string; // 'google', 'apple'
          is_enabled: boolean;
          last_sync: string;
          sync_frequency: string; // 'hourly', 'daily', 'weekly'
          access_token: string | null;
          refresh_token: string | null;
          calendar_id: string | null; // External calendar ID
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          calendar_type: string;
          is_enabled?: boolean;
          last_sync?: string;
          sync_frequency?: string;
          access_token?: string | null;
          refresh_token?: string | null;
          calendar_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          calendar_type?: string;
          is_enabled?: boolean;
          last_sync?: string;
          sync_frequency?: string;
          access_token?: string | null;
          refresh_token?: string | null;
          calendar_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          location: string | null;
          calendar_type: string; // 'google', 'apple', 'skiftapp'
          external_event_id: string | null; // ID from external calendar
          is_synced: boolean;
          sync_direction: string; // 'inbound', 'outbound', 'bidirectional'
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time: string;
          location?: string | null;
          calendar_type: string;
          external_event_id?: string | null;
          is_synced?: boolean;
          sync_direction?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string;
          location?: string | null;
          calendar_type?: string;
          external_event_id?: string | null;
          is_synced?: boolean;
          sync_direction?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}; 