import React, { createContext, useContext, useEffect, useState } from 'react';
import { SHIFT_TYPES, ShiftType, calculateShiftForDate, generateMonthSchedule, calculateWorkedHours, getNextShift } from '../data/ShiftSchedules';
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

  const generateSchedule = (year: number, month: number) => {
    if (!selectedCompany || !selectedTeam || !selectedShiftType) return;

    try {
      setLoading(true);

      // Generate month schedule
      const schedule = generateMonthSchedule(year, month, selectedShiftType, selectedTeam);
      setMonthSchedule(schedule);

      // Calculate current shift
      const today = new Date();
      const todayShift = calculateShiftForDate(today, selectedShiftType, selectedTeam);
      setCurrentShift({
        date: today,
        shift: todayShift,
        company: selectedCompany,
        team: selectedTeam
      });

      // Calculate next shift
      const next = getNextShift(selectedShiftType, selectedTeam, today);
      setNextShift(next);

      // Calculate statistics
      const stats = calculateWorkedHours(schedule);
      setShiftStats({
        ...stats,
        currentMonth: `${year}-${month + 1}`,
        company: selectedCompany.name,
        team: selectedTeam,
        shiftType: selectedShiftType.name
      });

    } catch (error) {
      console.error('Error generating schedule:', error);
    } finally {
      setLoading(false);
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