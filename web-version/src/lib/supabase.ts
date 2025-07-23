import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fsefeherdbtsddqimjco.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    redirectTo: window.location.origin + '/auth/callback'
  }
});

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          employee_id: string | null;
          email: string;
          first_name: string;
          last_name: string;
          company_id: string | null;
          team_id: string | null;
          department: string | null;
          position: string | null;
          avatar_url: string | null;
          phone: string | null;
          is_active: boolean;
          profile_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          employee_id?: string | null;
          email: string;
          first_name: string;
          last_name: string;
          company_id?: string | null;
          team_id?: string | null;
          department?: string | null;
          position?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          profile_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string | null;
          email?: string;
          first_name?: string;
          last_name?: string;
          company_id?: string | null;
          team_id?: string | null;
          department?: string | null;
          position?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          is_active?: boolean;
          profile_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          company_id: string | null;
          name: string;
          description: string | null;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          name: string;
          description?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          name?: string;
          description?: string | null;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_rooms: {
        Row: {
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
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          team_id?: string | null;
          name: string;
          description?: string | null;
          type?: string;
          department?: string | null;
          is_private?: boolean;
          auto_join_department?: string | null;
          auto_join_team?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          team_id?: string | null;
          name?: string;
          description?: string | null;
          type?: string;
          department?: string | null;
          is_private?: boolean;
          auto_join_department?: string | null;
          auto_join_team?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_room_id: string | null;
          sender_id: string | null;
          content: string;
          message_type: string;
          file_url: string | null;
          reply_to: string | null;
          is_edited: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chat_room_id?: string | null;
          sender_id?: string | null;
          content: string;
          message_type?: string;
          file_url?: string | null;
          reply_to?: string | null;
          is_edited?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chat_room_id?: string | null;
          sender_id?: string | null;
          content?: string;
          message_type?: string;
          file_url?: string | null;
          reply_to?: string | null;
          is_edited?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};