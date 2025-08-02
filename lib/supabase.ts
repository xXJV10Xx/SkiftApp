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
      // Payment-related tables
      subscriptions: {
        Row: {
          id: string;
          company_id: string | null;
          stripe_subscription_id: string | null;
          plan_name: string;
          plan_price: number;
          billing_period: string; // 'monthly' | 'yearly'
          employee_limit: number;
          status: string; // 'active' | 'canceled' | 'past_due' | 'unpaid'
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          stripe_subscription_id?: string | null;
          plan_name: string;
          plan_price: number;
          billing_period: string;
          employee_limit: number;
          status?: string;
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          stripe_subscription_id?: string | null;
          plan_name?: string;
          plan_price?: number;
          billing_period?: string;
          employee_limit?: number;
          status?: string;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          company_id: string | null;
          subscription_id: string | null;
          stripe_payment_intent_id: string | null;
          amount: number;
          currency: string;
          status: string; // 'pending' | 'succeeded' | 'failed' | 'canceled'
          payment_method: string; // 'card' | 'apple_pay' | 'google_pay'
          description: string | null;
          receipt_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          subscription_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount: number;
          currency: string;
          status?: string;
          payment_method: string;
          description?: string | null;
          receipt_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          subscription_id?: string | null;
          stripe_payment_intent_id?: string | null;
          amount?: number;
          currency?: string;
          status?: string;
          payment_method?: string;
          description?: string | null;
          receipt_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_methods: {
        Row: {
          id: string;
          company_id: string | null;
          stripe_payment_method_id: string | null;
          type: string; // 'card' | 'apple_pay' | 'google_pay'
          card_brand: string | null; // 'visa' | 'mastercard' | 'amex' | etc
          card_last4: string | null;
          card_exp_month: number | null;
          card_exp_year: number | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          stripe_payment_method_id?: string | null;
          type: string;
          card_brand?: string | null;
          card_last4?: string | null;
          card_exp_month?: number | null;
          card_exp_year?: number | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          stripe_payment_method_id?: string | null;
          type?: string;
          card_brand?: string | null;
          card_last4?: string | null;
          card_exp_month?: number | null;
          card_exp_year?: number | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          company_id: string | null;
          subscription_id: string | null;
          stripe_invoice_id: string | null;
          invoice_number: string;
          amount_due: number;
          amount_paid: number;
          currency: string;
          status: string; // 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
          due_date: string | null;
          paid_at: string | null;
          invoice_pdf: string | null;
          hosted_invoice_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          subscription_id?: string | null;
          stripe_invoice_id?: string | null;
          invoice_number: string;
          amount_due: number;
          amount_paid?: number;
          currency: string;
          status?: string;
          due_date?: string | null;
          paid_at?: string | null;
          invoice_pdf?: string | null;
          hosted_invoice_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          subscription_id?: string | null;
          stripe_invoice_id?: string | null;
          invoice_number?: string;
          amount_due?: number;
          amount_paid?: number;
          currency?: string;
          status?: string;
          due_date?: string | null;
          paid_at?: string | null;
          invoice_pdf?: string | null;
          hosted_invoice_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};