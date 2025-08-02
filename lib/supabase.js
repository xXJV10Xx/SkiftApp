import { createClient } from '@supabase/supabase-js';

// Hämta Supabase-konfiguration från miljövariabler
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Kontrollera att miljövariabler är satta
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase-konfiguration saknas! Kontrollera att REACT_APP_SUPABASE_URL och REACT_APP_SUPABASE_ANON_KEY är satta i .env-filen.'
  );
}

// Skapa Supabase-klient
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Hjälpfunktioner för vanliga databasoperationer
export const shiftService = {
  // Hämta alla skift för ett team
  async getShiftsByTeam(teamId) {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('team_id', teamId)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Skapa nytt skift
  async createShift(shift) {
    const { data, error } = await supabase
      .from('shifts')
      .insert([shift])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Uppdatera skift
  async updateShift(id, updates) {
    const { data, error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Ta bort skift
  async deleteShift(id) {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};