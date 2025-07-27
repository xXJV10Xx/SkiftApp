import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          schedule_url: string | null;
          teams_config: string[] | null;
          departments_config: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          schedule_url?: string | null;
          teams_config?: string[] | null;
          departments_config?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          schedule_url?: string | null;
          teams_config?: string[] | null;
          departments_config?: string[] | null;
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
          department: string | null;
          shift_pattern: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          name: string;
          description?: string | null;
          color?: string;
          department?: string | null;
          shift_pattern?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          name?: string;
          description?: string | null;
          color?: string;
          department?: string | null;
          shift_pattern?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      schedules: {
        Row: {
          id: string;
          company_id: string;
          team_name: string;
          department: string | null;
          date: string;
          shift_type: string;
          start_time: string | null;
          end_time: string | null;
          location: string | null;
          notes: string | null;
          status: string;
          scraped_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          team_name: string;
          department?: string | null;
          date: string;
          shift_type: string;
          start_time?: string | null;
          end_time?: string | null;
          location?: string | null;
          notes?: string | null;
          status?: string;
          scraped_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          team_name?: string;
          department?: string | null;
          date?: string;
          shift_type?: string;
          start_time?: string | null;
          end_time?: string | null;
          location?: string | null;
          notes?: string | null;
          status?: string;
          scraped_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      schedule_sources: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          url: string;
          selector_config: any | null;
          is_active: boolean;
          last_scraped: string | null;
          scrape_frequency_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          url: string;
          selector_config?: any | null;
          is_active?: boolean;
          last_scraped?: string | null;
          scrape_frequency_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          url?: string;
          selector_config?: any | null;
          is_active?: boolean;
          last_scraped?: string | null;
          scrape_frequency_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      scrape_logs: {
        Row: {
          id: string;
          company_id: string;
          source_id: string | null;
          status: 'success' | 'error' | 'partial';
          records_processed: number;
          records_inserted: number;
          records_updated: number;
          records_failed: number;
          error_message: string | null;
          execution_time_ms: number | null;
          scraped_data: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          source_id?: string | null;
          status: 'success' | 'error' | 'partial';
          records_processed?: number;
          records_inserted?: number;
          records_updated?: number;
          records_failed?: number;
          error_message?: string | null;
          execution_time_ms?: number | null;
          scraped_data?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          source_id?: string | null;
          status?: 'success' | 'error' | 'partial';
          records_processed?: number;
          records_inserted?: number;
          records_updated?: number;
          records_failed?: number;
          error_message?: string | null;
          execution_time_ms?: number | null;
          scraped_data?: any | null;
          created_at?: string;
        };
      };
      shifts: {
        Row: {
          id: string;
          employee_id: string | null;
          company_id: string | null;
          team_id: string | null;
          start_time: string;
          end_time: string;
          position: string | null;
          location: string | null;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id?: string | null;
          company_id?: string | null;
          team_id?: string | null;
          start_time: string;
          end_time: string;
          position?: string | null;
          location?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string | null;
          company_id?: string | null;
          team_id?: string | null;
          start_time?: string;
          end_time?: string;
          position?: string | null;
          location?: string | null;
          status?: string;
          notes?: string | null;
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
      chat_room_members: {
        Row: {
          id: string;
          chat_room_id: string | null;
          employee_id: string | null;
          role: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          chat_room_id?: string | null;
          employee_id?: string | null;
          role?: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          chat_room_id?: string | null;
          employee_id?: string | null;
          role?: string;
          joined_at?: string;
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
      message_reactions: {
        Row: {
          id: string;
          message_id: string | null;
          employee_id: string | null;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id?: string | null;
          employee_id?: string | null;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string | null;
          employee_id?: string | null;
          emoji?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      current_schedules: {
        Row: {
          id: string;
          company_id: string;
          team_name: string;
          department: string | null;
          date: string;
          shift_type: string;
          start_time: string | null;
          end_time: string | null;
          location: string | null;
          notes: string | null;
          status: string;
          scraped_at: string;
          created_at: string;
          updated_at: string;
          company_name: string;
          logo_url: string | null;
        };
      };
      scraping_stats: {
        Row: {
          company_id: string;
          company_name: string;
          total_scrapes: number;
          successful_scrapes: number;
          failed_scrapes: number;
          avg_execution_time_ms: number;
          total_records_processed: number;
          total_records_inserted: number;
          last_scrape_time: string;
        };
      };
    };
    Functions: {
      cleanup_old_schedules: {
        Args: { days_to_keep?: number };
        Returns: number;
      };
      get_team_schedule: {
        Args: {
          p_company_id: string;
          p_team_name: string;
          p_start_date: string;
          p_end_date: string;
        };
        Returns: {
          date: string;
          shift_type: string;
          start_time: string | null;
          end_time: string | null;
          location: string | null;
          notes: string | null;
        }[];
      };
    };
  };
};