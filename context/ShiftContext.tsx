import React, { createContext, useContext, useEffect, useState } from 'react';
import { SHIFT_TYPES, ShiftType, calculateShiftForDate, generateMonthSchedule, calculateWorkedHours, getNextShift } from '../data/ShiftSchedules';
import { scheduleGenerator } from '../universal-schedule-system';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';

interface ShiftContextType {
  currentShift: any;
  monthSchedule: any[];
  nextShift: any;
  shiftStats: any;
  loading: boolean;
  selectedShiftType: ShiftType | null;
  setSelectedShiftType: (shiftType: ShiftType | null) => void;
  generateSchedule: (year: number, month: number) => void;
  saveShiftToDatabase: (shiftData: any) => Promise<void>;
  fetchUserShifts: (startDate: Date, endDate: Date) => Promise<any[]>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const ShiftProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { selectedCompany, selectedTeam, employee } = useCompany();
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [monthSchedule, setMonthSchedule] = useState<any[]>([]);
  const [nextShift, setNextShift] = useState<any>(null);
  const [shiftStats, setShiftStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedShiftType, setSelectedShiftType] = useState<ShiftType | null>(null);

  // Generate schedule when company, team, or shift type changes
  useEffect(() => {
    if (selectedCompany && selectedTeam && selectedShiftType) {
      const now = new Date();
      generateSchedule(now.getFullYear(), now.getMonth());
    }
  }, [selectedCompany, selectedTeam, selectedShiftType]);

  // Set default shift type when company changes
  useEffect(() => {
    if (selectedCompany && selectedCompany.shifts.length > 0) {
      const defaultShiftType = SHIFT_TYPES[selectedCompany.shifts[0]];
      if (defaultShiftType) {
        setSelectedShiftType(defaultShiftType);
      }
    }
  }, [selectedCompany]);

  const generateSchedule = async (year: number, month: number) => {
    if (!selectedCompany || !selectedTeam) return;

    try {
      setLoading(true);

      // Use Universal Schedule System for accurate data
      const companyId = selectedCompany.id;
      const fromDate = new Date(year, month, 1).toISOString().slice(0, 10);
      const toDate = new Date(year, month + 1, 0).toISOString().slice(0, 10);
      
      let schedule = [];
      try {
        // Try to generate from Universal Schedule System
        const rawSchedule = scheduleGenerator.generateCompanySchedule(companyId, fromDate, toDate);
        
        // Filter for selected team and format for React Native
        schedule = rawSchedule
          .filter(entry => entry.team.toString() === selectedTeam)
          .map(entry => {
            const date = new Date(entry.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);

            return {
              date,
              day: date.getDate(),
              isToday: date.getTime() === today.getTime(),
              isWeekend: date.getDay() === 0 || date.getDay() === 6,
              shift: {
                code: entry.type,
                time: {
                  start: entry.start_time,
                  end: entry.end_time
                }
              }
            };
          });

        // Save to Supabase schedule cache
        await syncScheduleToSupabase(schedule, companyId, selectedTeam, year, month);

      } catch (universalError) {
        console.log('Universal system unavailable, using fallback:', universalError);
        // Fallback to old system if Universal System fails
        if (selectedShiftType) {
          schedule = generateMonthSchedule(year, month, selectedShiftType, selectedTeam);
        }
      }

      setMonthSchedule(schedule);

      // Calculate current shift
      const today = new Date();
      const todaySchedule = schedule.find(day => day.isToday);
      if (todaySchedule) {
        setCurrentShift({
          date: today,
          shift: todaySchedule.shift,
          company: selectedCompany,
          team: selectedTeam
        });
      }

      // Calculate next shift
      const futureShifts = schedule.filter(day => day.date > today && day.shift.code !== 'L');
      if (futureShifts.length > 0) {
        const nextShiftDay = futureShifts[0];
        const daysUntil = Math.ceil((nextShiftDay.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        setNextShift({
          date: nextShiftDay.date,
          shift: nextShiftDay.shift,
          daysUntil
        });
      }

      // Calculate statistics
      const workDays = schedule.filter(day => day.shift.code !== 'L').length;
      const totalHours = workDays * 8; // Assume 8-hour shifts
      const averageHours = workDays > 0 ? totalHours / workDays : 0;

      setShiftStats({
        totalHours,
        workDays,
        averageHours: averageHours.toFixed(1),
        currentMonth: `${year}-${month + 1}`,
        company: selectedCompany.name,
        team: selectedTeam
      });

    } catch (error) {
      console.error('Error generating schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncScheduleToSupabase = async (schedule: any[], companyId: string, teamId: string, year: number, month: number) => {
    if (!user) return;

    try {
      // Clear existing cached schedule for this month/team
      const { error: deleteError } = await supabase
        .from('schedule_cache')
        .delete()
        .eq('company_id', companyId)
        .eq('team_identifier', teamId)
        .gte('date', new Date(year, month, 1).toISOString().slice(0, 10))
        .lt('date', new Date(year, month + 1, 1).toISOString().slice(0, 10));

      if (deleteError) console.error('Error clearing old schedule:', deleteError);

      // Insert new schedule data
      const cacheData = schedule.map(day => ({
        company_id: companyId,
        team_identifier: teamId,
        date: day.date.toISOString().slice(0, 10),
        shift_code: day.shift.code,
        start_time: day.shift.time.start,
        end_time: day.shift.time.end,
        created_by: user.id
      }));

      const { error: insertError } = await supabase
        .from('schedule_cache')
        .insert(cacheData);

      if (insertError) {
        console.error('Error syncing schedule to Supabase:', insertError);
      } else {
        console.log(`✅ Synced ${cacheData.length} schedule entries to Supabase`);
      }
    } catch (error) {
      console.error('Error in schedule sync:', error);
    }
  };

  const saveShiftToDatabase = async (shiftData: any) => {
    if (!user || !employee) return;

    try {
      const { error } = await supabase
        .from('shifts')
        .insert({
          employee_id: user.id,
          company_id: employee.company_id,
          team_id: employee.team_id,
          start_time: shiftData.start_time,
          end_time: shiftData.end_time,
          position: shiftData.position || employee.position,
          location: shiftData.location,
          status: shiftData.status || 'scheduled',
          notes: shiftData.notes
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving shift to database:', error);
      throw error;
    }
  };

  const fetchUserShifts = async (startDate: Date, endDate: Date) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          companies (
            name,
            slug
          ),
          teams (
            name,
            color
          )
        `)
        .eq('employee_id', user.id)
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user shifts:', error);
      return [];
    }
  };

  const value = {
    currentShift,
    monthSchedule,
    nextShift,
    shiftStats,
    loading,
    selectedShiftType,
    setSelectedShiftType,
    generateSchedule,
    saveShiftToDatabase,
    fetchUserShifts
  };

  return (
    <ShiftContext.Provider value={value}>
      {children}
    </ShiftContext.Provider>
  );
};

export const useShift = () => {
  const context = useContext(ShiftContext);
  if (context === undefined) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
};