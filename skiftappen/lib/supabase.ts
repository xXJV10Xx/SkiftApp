import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase konfiguration för svenska skiftscheman
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Database types för svenska skiftscheman
export interface Database {
  public: {
    Tables: {
      swedish_holidays: {
        Row: {
          id: string;
          date: string;
          name: string;
          type: 'public' | 'regional' | 'religious';
          year: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['swedish_holidays']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['swedish_holidays']['Insert']>;
      };
      companies: {
        Row: {
          id: string;
          name: string;
          industry: string;
          location: string;
          shift_patterns: string[];
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['companies']['Insert']>;
      };
      departments: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          location: string;
          shift_type: string;
          employee_count: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['departments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['departments']['Insert']>;
      };
      shift_schedules: {
        Row: {
          id: string;
          company_id: string;
          department_id: string;
          date: string;
          shift_type: string;
          start_time: string;
          end_time: string;
          employee_count: number;
          is_holiday: boolean;
          is_weekend: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shift_schedules']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['shift_schedules']['Insert']>;
      };
      shift_teams: {
        Row: {
          id: string;
          company_id: string;
          department_id: string;
          name: string;
          shift_pattern: string;
          rotation_days: number;
          start_date: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shift_teams']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['shift_teams']['Insert']>;
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
  };
}

// Skapa Supabase klient med AsyncStorage för React Native
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper funktioner för svenska skiftscheman
export const shiftHelpers = {
  // Hämta alla aktiva företag
  async getActiveCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('active', true)
      .order('name');
    
    return { data, error };
  },

  // Hämta avdelningar för ett företag
  async getDepartmentsByCompany(companyId: string) {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('company_id', companyId)
      .eq('active', true)
      .order('name');
    
    return { data, error };
  },

  // Hämta skiftscheman för en period
  async getShiftSchedules(startDate: string, endDate: string, companyId?: string, departmentId?: string) {
    let query = supabase
      .from('shift_schedules')
      .select(`
        *,
        companies:company_id(name, location),
        departments:department_id(name, location)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  // Hämta svenska helgdagar för ett år
  async getSwedishHolidays(year: number) {
    const { data, error } = await supabase
      .from('swedish_holidays')
      .select('*')
      .eq('year', year)
      .order('date');
    
    return { data, error };
  },

  // Hämta skiftlag för en avdelning
  async getShiftTeams(departmentId: string) {
    const { data, error } = await supabase
      .from('shift_teams')
      .select('*')
      .eq('department_id', departmentId)
      .eq('active', true)
      .order('name');
    
    return { data, error };
  },

  // Synkronisera skiftscheman (för real-time uppdateringar)
  subscribeToShiftChanges(callback: (payload: any) => void) {
    return supabase
      .channel('shift_schedules_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shift_schedules'
      }, callback)
      .subscribe();
  }
};

// Svenska datum och tid formatering
export const swedishDateHelpers = {
  formatDate: (date: Date) => {
    return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(date);
  },

  formatTime: (time: string) => {
    return new Intl.DateTimeFormat('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(`2000-01-01T${time}`));
  },

  isWeekend: (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Söndag eller lördag
  },

  getWeekNumber: (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
};

export default supabase;