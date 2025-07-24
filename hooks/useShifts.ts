// /hooks/useShifts.ts

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Ersätt med dina faktiska Supabase uppgifter
const supabaseUrl = 'https://fsefeherdbtsddqimjco.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc4NTA0NywiZXhwIjoyMDY4MzYxMDQ3fQ.IN-OF4_M7KhNwfAtrOcjS2SfVIbw_80lpgyzlngc_Lg';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface Shift {
  id: number;
  company_id: string;
  shift_type_id: string;
  team_name: string;
  date: string;
  shift_code: string;
  shift_name: string;
  start_time: string | null;
  end_time: string | null;
  cycle_day: number;
  total_cycle_days: number;
}

export interface ShiftCalendarView {
  company_id: string;
  company_name: string;
  team_name: string;
  team_color: string;
  date: string;
  shift_code: string;
  shift_name: string;
  start_time: string | null;
  end_time: string | null;
  cycle_day: number;
  total_cycle_days: number;
  year: number;
  month: number;
  day: number;
  day_of_week: number;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  location: string;
}

export interface Team {
  id: number;
  company_id: string;
  team_name: string;
  color: string;
}

export interface ShiftType {
  id: string;
  name: string;
  description: string;
  pattern: string[];
  cycle: number;
  times: Record<string, { start: string; end: string; name: string }>;
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

export function useShiftCalendar(companyId?: string, teamName?: string, year?: number, month?: number) {
  const [shifts, setShifts] = useState<ShiftCalendarView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShiftCalendar = async () => {
      let query = supabase.from('shift_calendar').select('*');
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      if (teamName) {
        query = query.eq('team_name', teamName);
      }
      
      if (year && month !== undefined) {
        query = query.eq('year', year).eq('month', month + 1); // JavaScript months are 0-indexed
      }
      
      const { data, error } = await query.order('date').order('team_name');
      
      if (error) {
        console.error('Error fetching shift calendar:', error);
        setError(error.message);
      } else {
        setShifts(data || []);
      }
      setLoading(false);
    };

    fetchShiftCalendar();
  }, [companyId, teamName, year, month]);

  return { shifts, loading, error };
}

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase.from('companies').select('*');
      if (error) {
        console.error('Error fetching companies:', error);
        setError(error.message);
      } else {
        setCompanies(data || []);
      }
      setLoading(false);
    };

    fetchCompanies();
  }, []);

  return { companies, loading, error };
}

export function useTeams(companyId?: string) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      let query = supabase.from('teams').select('*');
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query.order('team_name');
      
      if (error) {
        console.error('Error fetching teams:', error);
        setError(error.message);
      } else {
        setTeams(data || []);
      }
      setLoading(false);
    };

    fetchTeams();
  }, [companyId]);

  return { teams, loading, error };
}

export function useShiftTypes() {
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShiftTypes = async () => {
      const { data, error } = await supabase.from('shift_types').select('*');
      if (error) {
        console.error('Error fetching shift types:', error);
        setError(error.message);
      } else {
        setShiftTypes(data || []);
      }
      setLoading(false);
    };

    fetchShiftTypes();
  }, []);

  return { shiftTypes, loading, error };
}

// Hjälpfunktion för att hämta skift för specifik dag och lag
export async function getShiftForDate(companyId: string, teamName: string, date: string): Promise<ShiftCalendarView | null> {
  const { data, error } = await supabase
    .from('shift_calendar')
    .select('*')
    .eq('company_id', companyId)
    .eq('team_name', teamName)
    .eq('date', date)
    .single();

  if (error) {
    console.error('Error fetching shift for date:', error);
    return null;
  }

  return data;
}

// Hjälpfunktion för att hämta skift för en månad
export async function getMonthShifts(companyId: string, year: number, month: number, teamName?: string): Promise<ShiftCalendarView[]> {
  let query = supabase
    .from('shift_calendar')
    .select('*')
    .eq('company_id', companyId)
    .eq('year', year)
    .eq('month', month + 1); // JavaScript months are 0-indexed

  if (teamName) {
    query = query.eq('team_name', teamName);
  }

  const { data, error } = await query.order('date').order('team_name');

  if (error) {
    console.error('Error fetching month shifts:', error);
    return [];
  }

  return data || [];
}

// Hjälpfunktion för att regenerera schema för en period
export async function regenerateSchedule(companyId: string, shiftTypeId: string, startDate: string, endDate: string): Promise<boolean> {
  const { error } = await supabase.rpc('generate_shift_schedule', {
    p_company_id: companyId,
    p_shift_type_id: shiftTypeId,
    p_start_date: startDate,
    p_end_date: endDate
  });

  if (error) {
    console.error('Error regenerating schedule:', error);
    return false;
  }

  return true;
}
