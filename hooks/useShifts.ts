// /hooks/useShifts.ts

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Shift {
  id: string;
  uuid: string;
  date: string;
  shift_type: string;
}

export function useShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase.from('shifts').select('*');
        
        if (error) {
          console.error('Error fetching shifts:', error);
          setError(error.message);
        } else {
          setShifts(data || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching shifts:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.from('shifts').select('*');
      
      if (error) {
        console.error('Error refetching shifts:', error);
        setError(error.message);
      } else {
        setShifts(data || []);
      }
    } catch (err) {
      console.error('Unexpected error refetching shifts:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { shifts, loading, error, refetch };
}
