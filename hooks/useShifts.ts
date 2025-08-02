// /hooks/useShifts.ts

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Shift {
  id: string;
  company: string;
  location: string | null;
  team: string;
  date: string;
  shift_type: string;
  shift_time: string;
  scraped_at: string;
}

export function useShifts(company?: string, team?: string) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setLoading(true);
        
        let query = supabase.from('shifts').select('*');
        
        // Filtrera på företag om det är specificerat
        if (company) {
          query = query.eq('company', company);
        }
        
        // Filtrera på team om det är specificerat
        if (team && team !== 'ALLA') {
          query = query.eq('team', team);
        }
        
        // Sortera efter datum
        query = query.order('date', { ascending: true });

        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching shifts:', error);
          setError(error.message);
        } else {
          setShifts(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Ett oväntat fel inträffade');
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, [company, team]);

  return { shifts, loading, error };
}

// Hook för att hämta tillgängliga företag
export function useCompanies() {
  const [companies, setCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data, error } = await supabase
          .from('shifts')
          .select('company')
          .order('company');

        if (error) {
          console.error('Error fetching companies:', error);
          setError(error.message);
        } else {
          // Få unika företag
          const uniqueCompanies = [...new Set(data?.map(item => item.company) || [])];
          setCompanies(uniqueCompanies);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Ett oväntat fel inträffade');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  return { companies, loading, error };
}

// Hook för att hämta tillgängliga team för ett företag
export function useTeams(company: string) {
  const [teams, setTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company) {
      setTeams([]);
      setLoading(false);
      return;
    }

    const fetchTeams = async () => {
      try {
        const { data, error } = await supabase
          .from('shifts')
          .select('team')
          .eq('company', company)
          .order('team');

        if (error) {
          console.error('Error fetching teams:', error);
          setError(error.message);
        } else {
          // Få unika team
          const uniqueTeams = [...new Set(data?.map(item => item.team) || [])];
          setTeams(uniqueTeams);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Ett oväntat fel inträffade');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [company]);

  return { teams, loading, error };
}
