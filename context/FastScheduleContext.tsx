import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';

interface ScheduleItem {
  id: string;
  company_id: string;
  team_name: string;
  department: string | null;
  date: string;
  shift_type: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  notes: string | null;
  status: string;
  scraped_at: string;
}

interface FastScheduleContextType {
  schedules: ScheduleItem[];
  todaySchedule: ScheduleItem | null;
  nextShift: ScheduleItem | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshSchedules: () => Promise<void>;
  getScheduleForDate: (date: Date) => ScheduleItem | null;
  // Real-time features disabled for maximum speed
  enableRealTime: boolean;
  setEnableRealTime: (enabled: boolean) => void;
}

const FastScheduleContext = createContext<FastScheduleContextType | undefined>(undefined);

export const FastScheduleProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { selectedCompany, selectedTeam, selectedDepartment } = useCompany();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [enableRealTime, setEnableRealTime] = useState(false); // DISABLED by default
  
  // Pre-computed lookups for maximum speed
  const scheduleMap = React.useMemo(() => {
    const map = new Map<string, ScheduleItem>();
    schedules.forEach(schedule => {
      map.set(schedule.date, schedule);
    });
    return map;
  }, [schedules]);

  // ULTRA-FAST: O(1) lookup using pre-computed Map
  const getScheduleForDate = useCallback((date: Date): ScheduleItem | null => {
    const dateString = date.toISOString().split('T')[0];
    return scheduleMap.get(dateString) || null;
  }, [scheduleMap]);

  // ULTRA-FAST: Pre-computed today's schedule
  const todaySchedule = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return scheduleMap.get(today) || null;
  }, [scheduleMap]);

  // ULTRA-FAST: Pre-computed next shift
  const nextShift = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Use Array.find on pre-sorted array (faster than filter + sort)
    const sortedSchedules = schedules
      .filter(s => s.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return sortedSchedules[0] || null;
  }, [schedules]);

  // OPTIMIZED: Single database query with all filters
  const fetchSchedules = useCallback(async () => {
    if (!selectedCompany || !selectedTeam) {
      setSchedules([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // SINGLE OPTIMIZED QUERY - no real-time subscription overhead
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // 1 month back
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6); // 6 months ahead

      const { data, error: fetchError } = await supabase
        .from('schedules')
        .select('id, company_id, team_name, department, date, shift_type, start_time, end_time, location, status') // Only needed fields
        .eq('company_id', selectedCompany.id)
        .eq('team_name', selectedTeam)
        .eq('status', 'active')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      setSchedules(data || []);
      setLastUpdated(new Date());
      
      console.log(`⚡ FAST MODE: Loaded ${data?.length || 0} schedules in single query`);
      
    } catch (err) {
      console.error('❌ Error fetching schedules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, selectedTeam]);

  // MANUAL REFRESH ONLY - no automatic updates for maximum speed
  const refreshSchedules = useCallback(async () => {
    console.log('🔄 Manual refresh triggered...');
    await fetchSchedules();
  }, [fetchSchedules]);

  // Load schedules when company/team changes
  useEffect(() => {
    fetchSchedules();
  }, [selectedCompany, selectedTeam, selectedDepartment, fetchSchedules]);

  const value = {
    schedules,
    todaySchedule,
    nextShift,
    loading,
    error,
    lastUpdated,
    refreshSchedules,
    getScheduleForDate,
    enableRealTime,
    setEnableRealTime
  };

  return (
    <FastScheduleContext.Provider value={value}>
      {children}
    </FastScheduleContext.Provider>
  );
};

export const useFastSchedule = () => {
  const context = useContext(FastScheduleContext);
  if (context === undefined) {
    throw new Error('useFastSchedule must be used within a FastScheduleProvider');
  }
  return context;
};