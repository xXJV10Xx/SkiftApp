// Type definitions for the generate-schedule Edge Function
// Import these types in your client application for type safety

export interface GenerateScheduleRequest {
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
}

export interface GenerateScheduleResponse {
  [date: string]: {
    [teamName: string]: ShiftCode;
  };
}

export type ShiftCode = 'F' | 'E' | 'N' | 'L';

export interface GenerateScheduleError {
  error: string;
  details?: string;
}

// Database table types (for reference)
export interface TeamState {
  id: string;
  team_id: string;
  date: string;
  state_type: 'WORK' | 'LEAVE';
  current_day: number;
  total_days: number;
  work_pattern_id?: string;
  n_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  team_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkPattern {
  id: string;
  schedule_id: string;
  name: string;
  composition: ShiftCode[]; // Array of shift codes like ['F', 'E', 'N', 'N']
  n_count: number; // 4 or 5 - determines leave days
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  company_id: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

// Helper type for the function's internal state tracking
export interface TeamStateTracker {
  stateType: 'WORK' | 'LEAVE';
  currentDay: number;
  totalDays: number;
  workPatternId?: string;
  workPatternIndex: number;
  nCount?: number;
}

// Utility types for client applications
export type ScheduleDate = string; // YYYY-MM-DD
export type TeamName = string;
export type ScheduleEntry = {
  date: ScheduleDate;
  team: TeamName;
  shift: ShiftCode;
};

// Function to convert response to flat array format
export function flattenScheduleResponse(response: GenerateScheduleResponse): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  
  for (const [date, teams] of Object.entries(response)) {
    for (const [teamName, shiftCode] of Object.entries(teams)) {
      entries.push({
        date,
        team: teamName,
        shift: shiftCode
      });
    }
  }
  
  return entries;
}

// Function to group schedule by team
export function groupScheduleByTeam(response: GenerateScheduleResponse): Record<TeamName, Record<ScheduleDate, ShiftCode>> {
  const teamSchedules: Record<TeamName, Record<ScheduleDate, ShiftCode>> = {};
  
  for (const [date, teams] of Object.entries(response)) {
    for (const [teamName, shiftCode] of Object.entries(teams)) {
      if (!teamSchedules[teamName]) {
        teamSchedules[teamName] = {};
      }
      teamSchedules[teamName][date] = shiftCode;
    }
  }
  
  return teamSchedules;
}

// Function to get schedule for specific team
export function getTeamSchedule(response: GenerateScheduleResponse, teamName: string): Record<ScheduleDate, ShiftCode> {
  const teamSchedule: Record<ScheduleDate, ShiftCode> = {};
  
  for (const [date, teams] of Object.entries(response)) {
    if (teams[teamName]) {
      teamSchedule[date] = teams[teamName];
    }
  }
  
  return teamSchedule;
}

// Function to get schedule for specific date
export function getDateSchedule(response: GenerateScheduleResponse, date: string): Record<TeamName, ShiftCode> {
  return response[date] || {};
}