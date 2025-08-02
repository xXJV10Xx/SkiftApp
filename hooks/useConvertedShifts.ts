import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShiftEvent } from '../lib/types';

interface ShiftFromDB {
  id: string;
  employee_id: string | null;
  company_id: string | null;
  team_id: string | null;
  start_time: string;
  end_time: string;
  position: string | null;
  location: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useConvertedShifts(employeeId?: string, companyId?: string, teamId?: string) {
  const [events, setEvents] = useState<ShiftEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndConvertShifts = async () => {
      try {
        setLoading(true);
        
        // Bygg query baserat på filter
        let query = supabase.from('shifts').select('*');
        
        if (employeeId) {
          query = query.eq('employee_id', employeeId);
        }
        if (companyId) {
          query = query.eq('company_id', companyId);
        }
        if (teamId) {
          query = query.eq('team_id', teamId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching shifts:', error);
          setError(error.message);
          return;
        }

        // Konvertera till kalenderformat
        const convertedEvents: ShiftEvent[] = data.map((shift: ShiftFromDB) => {
          const startDateTime = new Date(shift.start_time);
          const endDateTime = new Date(shift.end_time);
          
          // Formatera datum som YYYY-MM-DD
          const date = startDateTime.toISOString().split('T')[0];
          
          // Formatera tid som HH:MM
          const startTime = startDateTime.toTimeString().slice(0, 5);
          const endTime = endDateTime.toTimeString().slice(0, 5);
          
          // Skapa titel baserat på tillgänglig information
          let title = 'Skift';
          if (shift.position) {
            title = shift.position;
          }
          if (shift.location) {
            title += ` - ${shift.location}`;
          }
          
          return {
            title,
            date,
            startTime,
            endTime,
          };
        });

        setEvents(convertedEvents);
        setError(null);
      } catch (err) {
        console.error('Error in fetchAndConvertShifts:', err);
        setError('Ett fel uppstod vid hämtning av skift');
      } finally {
        setLoading(false);
      }
    };

    fetchAndConvertShifts();
  }, [employeeId, companyId, teamId]);

  return { events, loading, error };
}