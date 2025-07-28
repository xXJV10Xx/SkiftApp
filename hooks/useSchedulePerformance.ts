import { useCallback, useMemo, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';

interface ScheduleItem {
  id: string;
  date: string;
  shift_type: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
}

interface UseSchedulePerformanceOptions {
  schedules: ScheduleItem[];
  currentDate: Date;
  enableVirtualization?: boolean;
  cacheSize?: number;
}

export const useSchedulePerformance = ({
  schedules,
  currentDate,
  enableVirtualization = true,
  cacheSize = 100
}: UseSchedulePerformanceOptions) => {
  const [isInteractionComplete, setIsInteractionComplete] = useState(true);
  const renderCache = useRef(new Map<string, any>());
  const lastRenderTime = useRef(Date.now());

  // Throttle expensive operations
  const throttleRender = useCallback(() => {
    const now = Date.now();
    if (now - lastRenderTime.current < 16) { // 60fps throttling
      return false;
    }
    lastRenderTime.current = now;
    return true;
  }, []);

  // Memoized calendar data generation
  const calendarData = useMemo(() => {
    if (!throttleRender()) {
      return renderCache.current.get('calendarData') || [];
    }

    const cacheKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
    
    if (renderCache.current.has(cacheKey)) {
      return renderCache.current.get(cacheKey);
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const weeks = [];
    const currentDay = new Date(startDate);

    // Create a schedule lookup map for O(1) access
    const scheduleMap = new Map<string, ScheduleItem>();
    schedules.forEach(schedule => {
      scheduleMap.set(schedule.date, schedule);
    });

    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(currentDay);
        const dateString = date.toISOString().split('T')[0];
        const isCurrentMonth = date.getMonth() === month;
        const isToday = date.toDateString() === new Date().toDateString();
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const schedule = scheduleMap.get(dateString);

        weekDays.push({
          date,
          day: date.getDate(),
          dateString,
          isCurrentMonth,
          isToday,
          isWeekend,
          schedule,
          key: `${dateString}-${week}-${day}` // Stable key for React
        });

        currentDay.setDate(currentDay.getDate() + 1);
      }
      weeks.push(weekDays);
    }

    // Cache the result
    renderCache.current.set(cacheKey, weeks);
    renderCache.current.set('calendarData', weeks);

    // Limit cache size
    if (renderCache.current.size > cacheSize) {
      const firstKey = renderCache.current.keys().next().value;
      renderCache.current.delete(firstKey);
    }

    return weeks;
  }, [schedules, currentDate, cacheSize, throttleRender]);

  // Optimized schedule lookup
  const getScheduleForDate = useCallback((date: Date): ScheduleItem | null => {
    const dateString = date.toISOString().split('T')[0];
    return schedules.find(schedule => schedule.date === dateString) || null;
  }, [schedules]);

  // Batch operations after interactions
  const runAfterInteractions = useCallback((callback: () => void) => {
    setIsInteractionComplete(false);
    InteractionManager.runAfterInteractions(() => {
      callback();
      setIsInteractionComplete(true);
    });
  }, []);

  // Optimized refresh handler
  const handleRefresh = useCallback(async (refreshFn: () => Promise<void>) => {
    // Clear cache before refresh
    renderCache.current.clear();
    
    return runAfterInteractions(async () => {
      await refreshFn();
    });
  }, [runAfterInteractions]);

  // Performance metrics
  const getPerformanceMetrics = useCallback(() => {
    return {
      cacheSize: renderCache.current.size,
      isInteractionComplete,
      lastRenderTime: lastRenderTime.current,
      schedulesCount: schedules.length
    };
  }, [schedules.length, isInteractionComplete]);

  // Memory cleanup
  const clearCache = useCallback(() => {
    renderCache.current.clear();
  }, []);

  return {
    calendarData,
    getScheduleForDate,
    handleRefresh,
    runAfterInteractions,
    isInteractionComplete,
    getPerformanceMetrics,
    clearCache
  };
};