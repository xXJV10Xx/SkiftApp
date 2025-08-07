import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fsefeherdbtsddqimjco.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Updated Database types for 31-company system
export type CompanyCategory = 
  'abb_hvc_5skift' | 'aga_avesta_6skift' | 'arctic_paper_grycksbo_3skift' |
  'barilla_sverige_filipstad' | 'billerudkorsnas_gruvon_grums' | 'boliden_aitik_gruva_k3' |
  'borlange_energi' | 'borlange_kommun_polskoterska' | 'cambrex_karlskoga_5skift' |
  'dentsply_molndal_5skift' | 'finess_hygiene_ab_5skift' | 'kubal_sundsvall_6skift' |
  'lkab_malmberget_5skift' | 'nordic_paper_backhammar_3skift' | 'orica_gyttorp_exel_5skift' |
  'outokumpu_avesta_5skift' | 'ovako_hofors_rorverk_4_5skift' | 'preemraff_lysekil_5skift' |
  'ryssviken_boendet' | 'sandvik_mt_2skift' | 'scania_cv_ab_transmission_5skift' |
  'schneider_electric_5skift' | 'seco_tools_fagersta_2skift' | 'skarnas_hamn_5_skift' |
  'skf_ab_5skift2' | 'sodra_cell_monsteras_3skift' | 'ssab_4_7skift' | 'ssab-oxelosund' |
  'stora_enso_fors_5skift' | 'truck_service_2skift' | 'uddeholm_tooling_2skift' |
  'voestalpine_precision_strip_2skift';

export type SubscriptionStatus = 'active' | 'inactive' | 'canceled' | 'past_due';
export type SubscriptionPlan = 'free' | 'basic' | 'premium';
export type ShiftCode = 'F' | 'E' | 'N' | 'L' | 'D' | 'D12' | 'N12';

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          company_id: CompanyCategory;
          name: string;
          display_name: string;
          description: string | null;
          industry: string | null;
          location: string | null;
          skiftschema_url: string | null;
          verified: boolean;
          total_teams: number;
          default_team: string;
          colors: Record<string, string>;
          departments: string[];
          created_at: string;
          updated_at: string;
          last_verified: string | null;
        };
        Insert: {
          id?: string;
          company_id: CompanyCategory;
          name: string;
          display_name: string;
          description?: string | null;
          industry?: string | null;
          location?: string | null;
          skiftschema_url?: string | null;
          verified?: boolean;
          total_teams?: number;
          default_team?: string;
          colors?: Record<string, string>;
          departments?: string[];
          created_at?: string;
          updated_at?: string;
          last_verified?: string | null;
        };
        Update: {
          id?: string;
          company_id?: CompanyCategory;
          name?: string;
          display_name?: string;
          description?: string | null;
          industry?: string | null;
          location?: string | null;
          skiftschema_url?: string | null;
          verified?: boolean;
          total_teams?: number;
          default_team?: string;
          colors?: Record<string, string>;
          departments?: string[];
          created_at?: string;
          updated_at?: string;
          last_verified?: string | null;
        };
      };
      teams: {
        Row: {
          id: string;
          company_id: CompanyCategory;
          team_identifier: string;
          display_name: string;
          color: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: CompanyCategory;
          team_identifier: string;
          display_name: string;
          color?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: CompanyCategory;
          team_identifier?: string;
          display_name?: string;
          color?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          company_id: CompanyCategory;
          selected_team: string;
          phone_number: string | null;
          timezone: string;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          company_id?: CompanyCategory;
          selected_team?: string;
          phone_number?: string | null;
          timezone?: string;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          company_id?: CompanyCategory;
          selected_team?: string;
          phone_number?: string | null;
          timezone?: string;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: SubscriptionPlan;
          status: SubscriptionStatus;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          price_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          trial_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          price_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: SubscriptionPlan;
          status?: SubscriptionStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          price_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_rooms: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          company_id: CompanyCategory | null;
          team_identifier: string | null;
          is_public: boolean;
          is_company_specific: boolean;
          is_team_specific: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          company_id?: CompanyCategory | null;
          team_identifier?: string | null;
          is_public?: boolean;
          is_company_specific?: boolean;
          is_team_specific?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          company_id?: CompanyCategory | null;
          team_identifier?: string | null;
          is_public?: boolean;
          is_company_specific?: boolean;
          is_team_specific?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          content: string;
          message_type: string;
          edited_at: string | null;
          reply_to: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          content: string;
          message_type?: string;
          edited_at?: string | null;
          reply_to?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          content?: string;
          message_type?: string;
          edited_at?: string | null;
          reply_to?: string | null;
          created_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          notifications_enabled: boolean;
          email_notifications: boolean;
          push_notifications: boolean;
          shift_reminders: boolean;
          reminder_hours: number;
          theme: string;
          calendar_sync_enabled: boolean;
          calendar_sync_provider: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notifications_enabled?: boolean;
          email_notifications?: boolean;
          push_notifications?: boolean;
          shift_reminders?: boolean;
          reminder_hours?: number;
          theme?: string;
          calendar_sync_enabled?: boolean;
          calendar_sync_provider?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notifications_enabled?: boolean;
          email_notifications?: boolean;
          push_notifications?: boolean;
          shift_reminders?: boolean;
          reminder_hours?: number;
          theme?: string;
          calendar_sync_enabled?: boolean;
          calendar_sync_provider?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      schedule_cache: {
        Row: {
          id: string;
          company_id: CompanyCategory;
          team_identifier: string;
          date: string;
          shift_code: ShiftCode;
          start_time: string | null;
          end_time: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: CompanyCategory;
          team_identifier: string;
          date: string;
          shift_code: ShiftCode;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: CompanyCategory;
          team_identifier?: string;
          date?: string;
          shift_code?: ShiftCode;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string;
        };
      };
    };
  };
};