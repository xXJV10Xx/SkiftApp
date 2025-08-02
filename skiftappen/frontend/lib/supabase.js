import { createClient } from '@supabase/supabase-js';

// Supabase konfiguration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL och anon key måste vara konfigurerade i miljövariabler');
}

// Skapa Supabase klient
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Hjälpfunktioner för datahantering

/**
 * Hämta alla företag
 */
export const getCompanies = async () => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('name');
    
  if (error) throw error;
  return data;
};

/**
 * Hämta orter för ett företag
 */
export const getLocationsByCompany = async (companyId) => {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('company_id', companyId)
    .order('name');
    
  if (error) throw error;
  return data;
};

/**
 * Hämta skiftlag för en ort
 */
export const getTeamsByLocation = async (locationId) => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('location_id', locationId)
    .order('name');
    
  if (error) throw error;
  return data;
};

/**
 * Hämta skift för en tidsperiod
 */
export const getShifts = async (startDate, endDate, teamIds = null) => {
  let query = supabase
    .from('shift_details')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate);
    
  if (teamIds && teamIds.length > 0) {
    query = query.in('team_id', teamIds);
  }
  
  const { data, error } = await query.order('date', { ascending: true });
  
  if (error) throw error;
  return data;
};

/**
 * Hämta skift för ett specifikt lag
 */
export const getShiftsByTeam = async (teamId, startDate, endDate) => {
  const { data, error } = await supabase
    .from('shifts')
    .select(`
      *,
      teams (
        name,
        color,
        locations (
          name,
          companies (
            name
          )
        )
      )
    `)
    .eq('team_id', teamId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
    
  if (error) throw error;
  return data;
};

/**
 * Prenumerera på skiftändringar för realtidsuppdateringar
 */
export const subscribeToShifts = (callback) => {
  return supabase
    .channel('shifts-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shifts',
      },
      callback
    )
    .subscribe();
};

/**
 * Prenumerera på lagändringar
 */
export const subscribeToTeams = (callback) => {
  return supabase
    .channel('teams-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'teams',
      },
      callback
    )
    .subscribe();
};

/**
 * Avsluta prenumeration
 */
export const unsubscribe = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};

/**
 * Kontrollera anslutningsstatus
 */
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('count')
      .limit(1);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase anslutningsfel:', error);
    return false;
  }
};

export default supabase;