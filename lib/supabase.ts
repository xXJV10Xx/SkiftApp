import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      shift_teams: {
        Row: {
          id: string
          name: string
          color_hex: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          color_hex?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          color_hex?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          fcm_token: string | null
          company: string | null
          department_location: string | null
          shift_team_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          fcm_token?: string | null
          company?: string | null
          department_location?: string | null
          shift_team_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          fcm_token?: string | null
          company?: string | null
          department_location?: string | null
          shift_team_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          shift_team_id: string
          start_time: string
          end_time: string
          title: string
          description: string | null
          shift_type: 'morning' | 'afternoon' | 'night' | 'regular'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shift_team_id: string
          start_time: string
          end_time: string
          title: string
          description?: string | null
          shift_type?: 'morning' | 'afternoon' | 'night' | 'regular'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shift_team_id?: string
          start_time?: string
          end_time?: string
          title?: string
          description?: string | null
          shift_type?: 'morning' | 'afternoon' | 'night' | 'regular'
          created_at?: string
          updated_at?: string
        }
      }
      shift_trade_requests: {
        Row: {
          id: string
          requester_id: string
          shift_id: string
          reason: string | null
          status: 'open' | 'accepted' | 'cancelled' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          shift_id: string
          reason?: string | null
          status?: 'open' | 'accepted' | 'cancelled' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          shift_id?: string
          reason?: string | null
          status?: 'open' | 'accepted' | 'cancelled' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      private_chats: {
        Row: {
          id: string
          trade_request_id: string
          participant_1_id: string
          participant_2_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trade_request_id: string
          participant_1_id: string
          participant_2_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trade_request_id?: string
          participant_1_id?: string
          participant_2_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          content: string
          message_type: 'text' | 'trade_proposal' | 'trade_accepted' | 'trade_declined'
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          content: string
          message_type?: 'text' | 'trade_proposal' | 'trade_accepted' | 'trade_declined'
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          sender_id?: string
          content?: string
          message_type?: 'text' | 'trade_proposal' | 'trade_accepted' | 'trade_declined'
          created_at?: string
        }
      }
    }
    Functions: {
      get_calendar_shifts: {
        Args: {
          filter_type?: string
          user_team_id?: string
        }
        Returns: {
          shift_id: string
          shift_team_id: string
          team_name: string
          team_color: string
          start_time: string
          end_time: string
          title: string
          description: string | null
          shift_type: string
        }[]
      }
      is_profile_complete: {
        Args: {
          user_id?: string
        }
        Returns: boolean
      }
    }
  }
}

export type ShiftTeam = Database['public']['Tables']['shift_teams']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Shift = Database['public']['Tables']['shifts']['Row']
export type ShiftTradeRequest = Database['public']['Tables']['shift_trade_requests']['Row']
export type PrivateChat = Database['public']['Tables']['private_chats']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type CalendarShift = Database['public']['Functions']['get_calendar_shifts']['Returns'][0]