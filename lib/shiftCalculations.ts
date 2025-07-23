// 🇸🇪 Skiftberäkningar för Svenska Företag
// Hanterar alla 33+ företag med exakta skiftmönster och teamoffsets

import { COMPANIES, SHIFT_TYPES, calculateShiftForDate, getShiftColor } from '../data/companies';

export interface ShiftInfo {
  code: string;
  time: {
    start: string;
    end: string;
    name: string;
  };
  cycleDay: number;
  color: string;
  isToday: boolean;
  isWorkDay: boolean;
}

export interface MonthShiftData {
  [date: string]: ShiftInfo;
}

export interface ShiftStatistics {
  totalWorkDays: number;
  totalWorkHours: number;
  nextShiftDate: string;
  daysUntilNextShift: number;
  currentCycleDay: number;
}

// Huvudfunktion för att beräkna skift för en månad
export function calculateMonthShifts(
  year: number,
  month: number,
  companyId: string,
  team: string,
  shiftTypeId: string
): MonthShiftData {
  const company = COMPANIES[companyId];
  const shiftType = SHIFT_TYPES[shiftTypeId];
  
  if (!company || !shiftType) {
    throw new Error(`Ogiltig företag eller skifttyp: ${companyId}, ${shiftTypeId}`);
  }

  const startDate = new Date('2025-01-18'); // Basdatum för alla beräkningar
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const today = new Date();

  const shifts: MonthShiftData = {};

  // Beräkna skift för varje dag i månaden
  for (let day = 1; day <= monthEnd.getDate(); day++) {
    const date = new Date(year, month - 1, day);
    const dateString = date.toISOString().split('T')[0];
    
    const shiftInfo = calculateShiftForDate(date, shiftType, team, startDate);
    const isToday = date.toDateString() === today.toDateString();
    const isWorkDay = shiftInfo.code !== 'L';

    shifts[dateString] = {
      ...shiftInfo,
      color: getShiftColor(shiftInfo.code),
      isToday,
      isWorkDay
    };
  }

  return shifts;
}

// Beräkna statistik för en månad
export function calculateMonthStatistics(
  year: number,
  month: number,
  companyId: string,
  team: string,
  shiftTypeId: string
): ShiftStatistics {
  const shifts = calculateMonthShifts(year, month, companyId, team, shiftTypeId);
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  let totalWorkDays = 0;
  let totalWorkHours = 0;
  let nextShiftDate = '';
  let daysUntilNextShift = 0;
  let currentCycleDay = 0;

  // Beräkna totala arbetsdagar och timmar
  Object.entries(shifts).forEach(([dateString, shift]) => {
    if (shift.isWorkDay) {
      totalWorkDays++;
      if (shift.time.start && shift.time.end) {
        const startTime = new Date(`2000-01-01T${shift.time.start}`);
        const endTime = new Date(`2000-01-01T${shift.time.end}`);
        let hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        if (hours < 0) hours += 24; // Hantera nattpass som går över midnatt
        totalWorkHours += hours;
      }
    }
  });

  // Hitta nästa skift
  const sortedDates = Object.keys(shifts).sort();
  const todayIndex = sortedDates.indexOf(todayString);
  
  if (todayIndex >= 0) {
    currentCycleDay = shifts[todayString].cycleDay;
    
    // Hitta nästa arbetsdag
    for (let i = todayIndex + 1; i < sortedDates.length; i++) {
      const dateString = sortedDates[i];
      if (shifts[dateString].isWorkDay) {
        nextShiftDate = dateString;
        daysUntilNextShift = i - todayIndex;
        break;
      }
    }
  }

  return {
    totalWorkDays,
    totalWorkHours,
    nextShiftDate,
    daysUntilNextShift,
    currentCycleDay
  };
}

// Beräkna skift för en specifik dag
export function calculateDayShift(
  date: Date,
  companyId: string,
  team: string,
  shiftTypeId: string
): ShiftInfo {
  const shiftType = SHIFT_TYPES[shiftTypeId];
  const startDate = new Date('2025-01-18');
  
  const shiftInfo = calculateShiftForDate(date, shiftType, team, startDate);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const isWorkDay = shiftInfo.code !== 'L';

  return {
    ...shiftInfo,
    color: getShiftColor(shiftInfo.code),
    isToday,
    isWorkDay
  };
}

// Hämta alla tillgängliga företag
export function getAvailableCompanies() {
  return Object.values(COMPANIES);
}

// Hämta skifttyper för ett företag
export function getCompanyShiftTypes(companyId: string) {
  const company = COMPANIES[companyId];
  if (!company) return [];
  
  return company.shifts.map(shiftId => SHIFT_TYPES[shiftId]);
}

// Hämta team för ett företag
export function getCompanyTeams(companyId: string) {
  const company = COMPANIES[companyId];
  if (!company) return [];
  
  return company.teams.map(team => ({
    name: team,
    color: company.colors[team]
  }));
}

// Validera datum intervall (2020-2030)
export function isValidDateRange(date: Date): boolean {
  const year = date.getFullYear();
  return year >= 2020 && year <= 2030;
}

// Formatera datum på svenska
export function formatDateSwedish(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return date.toLocaleDateString('sv-SE', options);
}

// Formatera tid
export function formatTime(time: string): string {
  if (!time) return '';
  return time;
}

// Beräkna arbetstid i timmar
export function calculateWorkHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  
  if (hours < 0) hours += 24; // Hantera nattpass som går över midnatt
  return hours;
}

// Hämta skiftnamn på svenska
export function getShiftNameSwedish(shiftCode: string): string {
  const shiftNames: Record<string, string> = {
    'F': 'Förmiddag',
    'E': 'Eftermiddag', 
    'N': 'Natt',
    'D': 'Dag',
    'L': 'Ledig',
    'D12': 'Dag 12h',
    'N12': 'Natt 12h',
    'FH': 'Förmiddag Helg',
    'NH': 'Natt Helg',
    'FE': 'Förmiddag-Eftermiddag',
    'EN': 'Eftermiddag-Natt'
  };
  
  return shiftNames[shiftCode] || shiftCode;
}

// Beräkna cykelposition för en dag
export function getCyclePosition(date: Date, shiftTypeId: string, team: string): number {
  const shiftType = SHIFT_TYPES[shiftTypeId];
  const startDate = new Date('2025-01-18');
  
  const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const teamOffset = getTeamOffset(team, shiftType);
  const adjustedDaysDiff = daysDiff + teamOffset;
  const cyclePosition = ((adjustedDaysDiff % shiftType.cycle) + shiftType.cycle) % shiftType.cycle;
  
  return cyclePosition + 1;
}

// Hjälpfunktion för team offset
function getTeamOffset(team: string, shiftType: any): number {
  const teamIndex = getTeamIndex(team);
  return teamIndex;
}

// Hjälpfunktion för team index
function getTeamIndex(team: string): number {
  if (team === 'A' || team === '1' || team === 'Alpha' || team === 'Röd' || team === 'Lag 1' || team === 'Team A') return 0;
  if (team === 'B' || team === '2' || team === 'Beta' || team === 'Blå' || team === 'Lag 2' || team === 'Team B') return 1;
  if (team === 'C' || team === '3' || team === 'Gamma' || team === 'Gul' || team === 'Lag 3' || team === 'Team C') return 2;
  if (team === 'D' || team === '4' || team === 'Delta' || team === 'Grön' || team === 'Team D') return 3;
  if (team === '5' || team === 'E') return 4;
  if (team === '6' || team === 'F') return 5;
  return 0;
} 