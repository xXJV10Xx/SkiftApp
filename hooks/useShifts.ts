import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fsefeherdbtsddqimjco.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc4NTA0NywiZXhwIjoyMDY4MzYxMDQ3fQ.IN-OF4_M7KhNwfAtrOcjS2SfVIbw_80lpgyzlngc_Lg';

const supabase = createClient(supabaseUrl, supabaseKey);

export function useShifts(team?: string) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShifts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error loading shifts:', error.message);
      } else {
        setShifts(data);
      }
      setLoading(false);
    };

    loadShifts();
  }, [team]);

  return { shifts, loading };
}
