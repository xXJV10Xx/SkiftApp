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

interface RealTimeScheduleContextType {
  schedules: ScheduleItem[];
  currentMonthSchedules: ScheduleItem[];
  todaySchedule: ScheduleItem | null;
  nextShift: ScheduleItem | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  fetchSchedules: (startDate?: Date, endDate?: Date) => Promise<void>;
  refreshSchedules: () => Promise<void>;
  getScheduleForDate: (date: Date) => ScheduleItem | null;
  getSchedulesForDateRange: (startDate: Date, endDate: Date) => ScheduleItem[];
  subscribeToScheduleUpdates: () => void;
  unsubscribeFromScheduleUpdates: () => void;
}

const RealTimeScheduleContext = createContext<RealTimeScheduleContextType | undefined>(undefined);

export const RealTimeScheduleProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { selectedCompany, selectedTeam, selectedDepartment } = useCompany();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // Memoized filtered schedules for current month
  const currentMonthSchedules = React.useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate >= startOfMonth && scheduleDate <= endOfMonth;
    });
  }, [schedules]);

  // Today's schedule
  const todaySchedule = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return schedules.find(schedule => schedule.date === today) || null;
  }, [schedules]);

  // Next shift
  const nextShift = React.useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Find next shift (today if not started, or next day)
    const upcomingSchedules = schedules
      .filter(schedule => schedule.date >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return upcomingSchedules[0] || null;
  }, [schedules]);

  // Fetch schedules from database
  const fetchSchedules = useCallback(async (startDate?: Date, endDate?: Date) => {
    if (!selectedCompany || !selectedTeam) {
      setSchedules([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('schedules')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .eq('team_name', selectedTeam)
        .eq('status', 'active')
        .order('date', { ascending: true });

      // Add department filter if selected
      if (selectedDepartment) {
        query = query.eq('department', selectedDepartment);
      }

      // Add date range filter if provided
      if (startDate) {
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        query = query.lte('date', endDate.toISOString().split('T')[0]);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setSchedules(data || []);
      setLastUpdated(new Date());
      
      console.log(`✅ Loaded ${data?.length || 0} schedule items for ${selectedCompany.name} - Team ${selectedTeam}`);
      
    } catch (err) {
      console.error('❌ Error fetching schedules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, selectedTeam, selectedDepartment]);

  // Refresh schedules (force reload)
  const refreshSchedules = useCallback(async () => {
    console.log('🔄 Refreshing schedules...');
    await fetchSchedules();
  }, [fetchSchedules]);

  // Get schedule for specific date
  const getScheduleForDate = useCallback((date: Date): ScheduleItem | null => {
    const dateString = date.toISOString().split('T')[0];
    return schedules.find(schedule => schedule.date === dateString) || null;
  }, [schedules]);

  // Get schedules for date range
  const getSchedulesForDateRange = useCallback((startDate: Date, endDate: Date): ScheduleItem[] => {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    
    return schedules.filter(schedule => 
      schedule.date >= start && schedule.date <= end
    );
  }, [schedules]);

  // Subscribe to real-time updates
  const subscribeToScheduleUpdates = useCallback(() => {
    if (!selectedCompany || !selectedTeam || subscription) return;

    console.log(`🔔 Subscribing to real-time schedule updates for ${selectedCompany.name} - Team ${selectedTeam}`);

    const channel = supabase
      .channel('schedule-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules',
          filter: `company_id=eq.${selectedCompany.id}`
        },
        (payload) => {
          console.log('📡 Real-time schedule update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newSchedule = payload.new as ScheduleItem;
            if (newSchedule.team_name === selectedTeam) {
              setSchedules(prev => {
                const exists = prev.find(s => s.id === newSchedule.id);
                if (exists) return prev;
                return [...prev, newSchedule].sort((a, b) => 
                  new Date(a.date).getTime() - new Date(b.date).getTime()
                );
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedSchedule = payload.new as ScheduleItem;
            if (updatedSchedule.team_name === selectedTeam) {
              setSchedules(prev => 
                prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s)
              );
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setSchedules(prev => prev.filter(s => s.id !== deletedId));
          }
          
          setLastUpdated(new Date());
        }
      )
      .subscribe();

    setSubscription(channel);
  }, [selectedCompany, selectedTeam, subscription]);

  // Unsubscribe from real-time updates
  const unsubscribeFromScheduleUpdates = useCallback(() => {
    if (subscription) {
      console.log('🔕 Unsubscribing from real-time schedule updates');
      supabase.removeChannel(subscription);
      setSubscription(null);
    }
  }, [subscription]);

  // Fetch schedules when company/team changes
  useEffect(() => {
    if (selectedCompany && selectedTeam) {
      // Fetch schedules for the next 3 months
      const startDate = new Date();
      startDate.setDate(1); // Start of current month
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // 3 months ahead
      
      fetchSchedules(startDate, endDate);
    } else {
      setSchedules([]);
    }
  }, [selectedCompany, selectedTeam, selectedDepartment, fetchSchedules]);

  // Set up real-time subscription when component mounts
  useEffect(() => {
    subscribeToScheduleUpdates();
    
    return () => {
      unsubscribeFromScheduleUpdates();
    };
  }, [subscribeToScheduleUpdates, unsubscribeFromScheduleUpdates]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromScheduleUpdates();
    };
  }, []);

  const value = {
    schedules,
    currentMonthSchedules,
    todaySchedule,
    nextShift,
    loading,
    error,
    lastUpdated,
    fetchSchedules,
    refreshSchedules,
    getScheduleForDate,
    getSchedulesForDateRange,
    subscribeToScheduleUpdates,
    unsubscribeFromScheduleUpdates
  };

  return (
    <RealTimeScheduleContext.Provider value={value}>
      {children}
    </RealTimeScheduleContext.Provider>
  );
};

export const useRealTimeSchedule = () => {
  const context = useContext(RealTimeScheduleContext);
  if (context === undefined) {
    throw new Error('useRealTimeSchedule must be used within a RealTimeScheduleProvider');
  }
  return context;
};