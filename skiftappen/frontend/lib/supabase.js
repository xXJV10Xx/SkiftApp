import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Missing Supabase environment variables. Please check your .env file.');
  console.warn('Required: SUPABASE_URL and SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper functions for common database operations
export const shiftService = {
  // Get all shifts
  async getAllShifts() {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching shifts:', error);
      throw error;
    }
    
    return data;
  },

  // Get shifts for a specific date range
  async getShiftsByDateRange(startDate, endDate) {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching shifts by date range:', error);
      throw error;
    }
    
    return data;
  },

  // Create a new shift
  async createShift(shiftData) {
    const { data, error } = await supabase
      .from('shifts')
      .insert([shiftData])
      .select();
    
    if (error) {
      console.error('Error creating shift:', error);
      throw error;
    }
    
    return data[0];
  },

  // Update an existing shift
  async updateShift(id, updates) {
    const { data, error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating shift:', error);
      throw error;
    }
    
    return data[0];
  },

  // Delete a shift
  async deleteShift(id) {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting shift:', error);
      throw error;
    }
    
    return true;
  }
};

// Helper function to check connection
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};

export default supabase;