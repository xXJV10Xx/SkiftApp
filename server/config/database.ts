import { createClient } from "supabase";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing required Supabase environment variables");
}

// Client för användarautentisering
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client för server-side operationer
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface Database {
  public: {
    Tables: {
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
      shifts: {
        Row: {
          id: string;
          owner_id: string | null;
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
          owner_id?: string | null;
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
          owner_id?: string | null;
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
          participant_ids: string[];
          related_trade_request_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          participant_ids: string[];
          related_trade_request_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          participant_ids?: string[];
          related_trade_request_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      private_chat_messages: {
        Row: {
          id: string;
          private_chat_id: string;
          sender_id: string;
          content: string;
          message_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          private_chat_id: string;
          sender_id: string;
          content: string;
          message_type?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          private_chat_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}