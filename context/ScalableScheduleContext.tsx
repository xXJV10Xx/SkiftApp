import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  status: string;
  scraped_at: string;
}

interface ScalableScheduleContextType {
  schedules: ScheduleItem[];
  todaySchedule: ScheduleItem | null;
  nextShift: ScheduleItem | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  connectionMode: 'real-time' | 'polling' | 'manual';
  userCount: number;
  refreshSchedules: () => Promise<void>;
  getScheduleForDate: (date: Date) => ScheduleItem | null;
  setConnectionMode: (mode: 'real-time' | 'polling' | 'manual') => void;
}

const ScalableScheduleContext = createContext<ScalableScheduleContextType | undefined>(undefined);

export const ScalableScheduleProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { selectedCompany, selectedTeam, selectedDepartment } = useCompany();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionMode, setConnectionMode] = useState<'real-time' | 'polling' | 'manual'>('polling');
  const [userCount, setUserCount] = useState(0);
  
  // Performance tracking
  const performanceMetrics = useRef({
    queryTime: 0,
    renderTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  });

  // Multi-level caching system
  const memoryCache = useRef(new Map<string, { data: ScheduleItem[], timestamp: number }>());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const MAX_CACHE_SIZE = 50; // Limit memory usage

  // Connection management for scale
  const subscription = useRef<any>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const lastPollTime = useRef<number>(0);

  // OPTIMIZATION 1: Persistent local storage cache
  const getCacheKey = useCallback(() => {
    return `schedules_${selectedCompany?.id}_${selectedTeam}_${selectedDepartment}`;
  }, [selectedCompany, selectedTeam, selectedDepartment]);

  const loadFromCache = useCallback(async (): Promise<ScheduleItem[] | null> => {
    try {
      const cacheKey = getCacheKey();
      
      // Check memory cache first (fastest)
      const memoryData = memoryCache.current.get(cacheKey);
      if (memoryData && (Date.now() - memoryData.timestamp) < CACHE_DURATION) {
        performanceMetrics.current.cacheHits++;
        console.log('⚡ Memory cache hit');
        return memoryData.data;
      }

      // Check AsyncStorage cache (slower but persistent)
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if ((Date.now() - timestamp) < CACHE_DURATION) {
          // Update memory cache
          memoryCache.current.set(cacheKey, { data, timestamp });
          performanceMetrics.current.cacheHits++;
          console.log('💾 Storage cache hit');
          return data;
        }
      }

      performanceMetrics.current.cacheMisses++;
      return null;
    } catch (error) {
      console.error('Cache load error:', error);
      return null;
    }
  }, [getCacheKey]);

  const saveToCache = useCallback(async (data: ScheduleItem[]) => {
    try {
      const cacheKey = getCacheKey();
      const cacheData = { data, timestamp: Date.now() };

      // Save to memory cache
      memoryCache.current.set(cacheKey, cacheData);
      
      // Limit memory cache size
      if (memoryCache.current.size > MAX_CACHE_SIZE) {
        const firstKey = memoryCache.current.keys().next().value;
        memoryCache.current.delete(firstKey);
      }

      // Save to persistent storage
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log('💾 Data cached successfully');
    } catch (error) {
      console.error('Cache save error:', error);
    }
  }, [getCacheKey]);

  // OPTIMIZATION 2: Intelligent connection mode selection
  const determineOptimalConnectionMode = useCallback(() => {
    if (userCount < 100) {
      return 'real-time'; // Low load - real-time is fine
    } else if (userCount < 1000) {
      return 'polling'; // Medium load - polling every 30s
    } else {
      return 'manual'; // High load - manual refresh only
    }
  }, [userCount]);

  // OPTIMIZATION 3: Batch database queries with pagination
  const fetchSchedules = useCallback(async (useCache: boolean = true) => {
    if (!selectedCompany || !selectedTeam) {
      setSchedules([]);
      return;
    }

    const startTime = Date.now();

    try {
      setLoading(true);
      setError(null);

      // Try cache first if enabled
      if (useCache) {
        const cachedData = await loadFromCache();
        if (cachedData) {
          setSchedules(cachedData);
          setLastUpdated(new Date());
          console.log(`⚡ Loaded ${cachedData.length} schedules from cache`);
          return;
        }
      }

      // Optimized query with minimal data transfer
      const startDate = new Date();
      startDate.setDate(1); // Current month start
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // 3 months ahead

      const { data, error: fetchError } = await supabase
        .from('schedules')
        .select('id, company_id, team_name, department, date, shift_type, start_time, end_time, location, status')
        .eq('company_id', selectedCompany.id)
        .eq('team_name', selectedTeam)
        .eq('status', 'active')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(500); // Limit to prevent large transfers

      if (fetchError) throw fetchError;

      const scheduleData = data || [];
      setSchedules(scheduleData);
      setLastUpdated(new Date());

      // Cache the results
      await saveToCache(scheduleData);

      performanceMetrics.current.queryTime = Date.now() - startTime;
      console.log(`🚀 Loaded ${scheduleData.length} schedules in ${performanceMetrics.current.queryTime}ms`);
      
    } catch (err) {
      console.error('❌ Error fetching schedules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, selectedTeam, loadFromCache, saveToCache]);

  // OPTIMIZATION 4: Smart real-time subscriptions with throttling
  const setupRealTimeSubscription = useCallback(() => {
    if (subscription.current || connectionMode !== 'real-time') return;

    console.log('🔔 Setting up throttled real-time subscription');

    let updateBuffer: any[] = [];
    let bufferTimeout: NodeJS.Timeout | null = null;

    const processBufferedUpdates = () => {
      if (updateBuffer.length === 0) return;

      console.log(`📡 Processing ${updateBuffer.length} buffered updates`);
      
      // Process updates in batch
      setSchedules(prev => {
        let updated = [...prev];
        
        updateBuffer.forEach(payload => {
          if (payload.eventType === 'INSERT') {
            const newSchedule = payload.new as ScheduleItem;
            if (newSchedule.team_name === selectedTeam) {
              const exists = updated.find(s => s.id === newSchedule.id);
              if (!exists) {
                updated.push(newSchedule);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedSchedule = payload.new as ScheduleItem;
            if (updatedSchedule.team_name === selectedTeam) {
              updated = updated.map(s => s.id === updatedSchedule.id ? updatedSchedule : s);
            }
          } else if (payload.eventType === 'DELETE') {
            updated = updated.filter(s => s.id !== payload.old.id);
          }
        });

        return updated.sort((a, b) => a.date.localeCompare(b.date));
      });

      updateBuffer = [];
      setLastUpdated(new Date());
    };

    subscription.current = supabase
      .channel(`schedule-updates-${user?.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'schedules',
        filter: `company_id=eq.${selectedCompany?.id}`
      }, (payload) => {
        // Buffer updates instead of processing immediately
        updateBuffer.push(payload);

        // Clear existing timeout
        if (bufferTimeout) {
          clearTimeout(bufferTimeout);
        }

        // Process buffered updates after 1 second of inactivity
        bufferTimeout = setTimeout(processBufferedUpdates, 1000);
      })
      .subscribe();
  }, [selectedCompany, selectedTeam, connectionMode, user?.id]);

  // OPTIMIZATION 5: Smart polling with exponential backoff
  const setupPolling = useCallback(() => {
    if (pollingInterval.current || connectionMode !== 'polling') return;

    let pollFrequency = 30000; // Start with 30 seconds
    const maxPollFrequency = 300000; // Max 5 minutes

    const poll = async () => {
      const now = Date.now();
      
      // Skip if recent manual refresh
      if (now - lastPollTime.current < pollFrequency) {
        return;
      }

      try {
        await fetchSchedules(true); // Use cache
        pollFrequency = Math.max(30000, pollFrequency * 0.9); // Decrease frequency on success
      } catch (error) {
        pollFrequency = Math.min(maxPollFrequency, pollFrequency * 1.5); // Increase on error
        console.warn(`Polling error, backing off to ${pollFrequency}ms`);
      }

      lastPollTime.current = now;
    };

    console.log(`⏰ Setting up polling every ${pollFrequency}ms`);
    pollingInterval.current = setInterval(poll, pollFrequency);
  }, [connectionMode, fetchSchedules]);

  // OPTIMIZATION 6: Pre-computed lookups for O(1) access
  const scheduleMap = React.useMemo(() => {
    const map = new Map<string, ScheduleItem>();
    schedules.forEach(schedule => {
      map.set(schedule.date, schedule);
    });
    return map;
  }, [schedules]);

  const getScheduleForDate = useCallback((date: Date): ScheduleItem | null => {
    const dateString = date.toISOString().split('T')[0];
    return scheduleMap.get(dateString) || null;
  }, [scheduleMap]);

  const todaySchedule = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return scheduleMap.get(today) || null;
  }, [scheduleMap]);

  const nextShift = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = schedules.filter(s => s.date >= today);
    return upcoming[0] || null;
  }, [schedules]);

  // Manual refresh with cache bypass
  const refreshSchedules = useCallback(async () => {
    console.log('🔄 Manual refresh triggered (bypassing cache)');
    await fetchSchedules(false);
  }, [fetchSchedules]);

  // Cleanup subscriptions
  const cleanup = useCallback(() => {
    if (subscription.current) {
      supabase.removeChannel(subscription.current);
      subscription.current = null;
    }
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  // Setup connection based on mode
  useEffect(() => {
    cleanup();

    switch (connectionMode) {
      case 'real-time':
        setupRealTimeSubscription();
        break;
      case 'polling':
        setupPolling();
        break;
      case 'manual':
        // No automatic updates
        break;
    }

    return cleanup;
  }, [connectionMode, setupRealTimeSubscription, setupPolling, cleanup]);

  // Auto-adjust connection mode based on load
  useEffect(() => {
    const optimalMode = determineOptimalConnectionMode();
    if (optimalMode !== connectionMode) {
      console.log(`🔄 Auto-switching to ${optimalMode} mode (${userCount} users)`);
      setConnectionMode(optimalMode);
    }
  }, [userCount, connectionMode, determineOptimalConnectionMode]);

  // Initial data load
  useEffect(() => {
    if (selectedCompany && selectedTeam) {
      fetchSchedules(true);
    }
  }, [selectedCompany, selectedTeam, selectedDepartment, fetchSchedules]);

  const value = {
    schedules,
    todaySchedule,
    nextShift,
    loading,
    error,
    lastUpdated,
    connectionMode,
    userCount,
    refreshSchedules,
    getScheduleForDate,
    setConnectionMode
  };

  return (
    <ScalableScheduleContext.Provider value={value}>
      {children}
    </ScalableScheduleContext.Provider>
  );
};

export const useScalableSchedule = () => {
  const context = useContext(ScalableScheduleContext);
  if (context === undefined) {
    throw new Error('useScalableSchedule must be used within a ScalableScheduleProvider');
  }
  return context;
};