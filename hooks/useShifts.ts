// /hooks/useShifts.ts

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Ersätt med dina faktiska Supabase uppgifter
const supabaseUrl = 'https://fsefeherdbtsddqimjco.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc4NTA0NywiZXhwIjoyMDY4MzYxMDQ3fQ.IN-OF4_M7KhNwfAtrOcjS2SfVIbw_80lpgyzlngc_Lg';

const supabase = createClient(supabaseUrl, supabaseKey);

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
      const { data, error } = await supabase.from('shifts').select('*');
      if (error) {
        console.error('Error fetching shifts:', error);
        setError(error.message);
      } else {
        setShifts(data);
      }
      setLoading(false);
    };

    fetchShifts();
  }, []);

  return { shifts, loading, error };
}
