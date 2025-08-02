import { createClient } from '@supabase/supabase-js';

// Hämta Supabase-konfiguration från miljövariabler
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Kontrollera att miljövariabler finns
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL och Anon Key måste definieras i .env-filen. ' +
    'Se .env.example för exempel.'
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
export const shiftOperations = {
  // Hämta alla skift för ett team
  getShiftsByTeam: async (teamId) => {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('team_id', teamId)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Skapa nytt skift
  createShift: async (shiftData) => {
    const { data, error } = await supabase
      .from('shifts')
      .insert([shiftData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Uppdatera skift
  updateShift: async (shiftId, updates) => {
    const { data, error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', shiftId)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Ta bort skift
  deleteShift: async (shiftId) => {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', shiftId);
    
    if (error) throw error;
  }
};

// Hjälpfunktioner för team-operationer
export const teamOperations = {
  // Hämta alla team
  getAllTeams: async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Skapa nytt team
  createTeam: async (teamData) => {
    const { data, error } = await supabase
      .from('teams')
      .insert([teamData])
      .select();
    
    if (error) throw error;
    return data[0];
  }
};