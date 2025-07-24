import { supabase } from './supabase';
import { SHIFT_TYPES, calculateShiftForDate, generateMonthSchedule, calculateWorkedHours, getNextShift } from '../data/ShiftSchedules';
import { COMPANIES } from '../data/companies';

export interface ScheduleRequest {
  companyId: string;
  teamId: string;
  startDate: string;
  endDate: string;
  includeStats?: boolean;
}

export interface ScheduleResponse {
  success: boolean;
  data?: {
    schedule: any[];
    stats?: {
      totalHours: number;
      workDays: number;
      averageHours: number;
    };
    nextShift?: any;
    teamInfo: {
      teamId: string;
      companyName: string;
      shiftType: string;
      color: string;
    };
  };
  error?: string;
}

/**
 * Huvudfunktion för att generera scheman för SSAB Oxelösund
 * Denna funktion är optimerad för teams 31-35 med 3-skift system
 */
export async function generateSchedule(request: ScheduleRequest): Promise<ScheduleResponse> {
  try {
    // Validera input
    const validation = validateRequest(request);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const { companyId, teamId, startDate, endDate, includeStats } = request;
    
    // Hämta företagsinformation
    const company = COMPANIES[companyId.toUpperCase()];
    if (!company) {
      return {
        success: false,
        error: `Företag med ID '${companyId}' hittades inte`
      };
    }

    // Kontrollera att teamet finns
    if (!company.teams.includes(teamId)) {
      return {
        success: false,
        error: `Team '${teamId}' finns inte för ${company.name}. Tillgängliga teams: ${company.teams.join(', ')}`
      };
    }

    // Hämta skifttyp (SSAB Oxelösund använder bara 3-skift)
    const shiftType = SHIFT_TYPES.SSAB_3SKIFT;
    if (!shiftType) {
      return {
        success: false,
        error: 'SSAB 3-skift konfiguration hittades inte'
      };
    }

    // Generera schema för den begärda perioden
    const schedule = generatePeriodSchedule(
      new Date(startDate),
      new Date(endDate),
      shiftType,
      teamId
    );

    // Beräkna statistik om det begärs
    let stats;
    if (includeStats) {
      stats = calculateWorkedHours(schedule);
    }

    // Hämta nästa skift
    const nextShift = getNextShift(shiftType, teamId);

    // Spara i Supabase
    await saveScheduleToDatabase(companyId, teamId, schedule);

    return {
      success: true,
      data: {
        schedule,
        stats,
        nextShift,
        teamInfo: {
          teamId,
          companyName: company.name,
          shiftType: shiftType.name,
          color: company.colors[teamId]
        }
      }
    };

  } catch (error) {
    console.error('Fel vid generering av schema:', error);
    return {
      success: false,
      error: `Oväntat fel: ${error instanceof Error ? error.message : 'Okänt fel'}`
    };
  }
}

/**
 * Genererar schema för en specifik period
 */
function generatePeriodSchedule(startDate: Date, endDate: Date, shiftType: any, teamId: string) {
  const schedule = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const shift = calculateShiftForDate(currentDate, shiftType, teamId);
    
    schedule.push({
      date: new Date(currentDate),
      dateString: currentDate.toISOString().split('T')[0],
      day: currentDate.getDate(),
      weekday: currentDate.toLocaleDateString('sv-SE', { weekday: 'long' }),
      shift: shift,
      isToday: isToday(currentDate),
      isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
      teamId: teamId
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return schedule;
}

/**
 * Validerar inkommande förfrågan
 */
function validateRequest(request: ScheduleRequest): { valid: boolean; error?: string } {
  if (!request.companyId) {
    return { valid: false, error: 'companyId är obligatoriskt' };
  }
  
  if (!request.teamId) {
    return { valid: false, error: 'teamId är obligatoriskt' };
  }
  
  if (!request.startDate) {
    return { valid: false, error: 'startDate är obligatoriskt' };
  }
  
  if (!request.endDate) {
    return { valid: false, error: 'endDate är obligatoriskt' };
  }
  
  // Validera datumformat
  const startDate = new Date(request.startDate);
  const endDate = new Date(request.endDate);
  
  if (isNaN(startDate.getTime())) {
    return { valid: false, error: 'Ogiltigt startDate format' };
  }
  
  if (isNaN(endDate.getTime())) {
    return { valid: false, error: 'Ogiltigt endDate format' };
  }
  
  if (startDate > endDate) {
    return { valid: false, error: 'startDate kan inte vara senare än endDate' };
  }
  
  // Begränsa till max 1 år
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (endDate.getTime() - startDate.getTime() > oneYear) {
    return { valid: false, error: 'Period kan inte överstiga 1 år' };
  }
  
  return { valid: true };
}

/**
 * Sparar genererat schema i Supabase
 */
async function saveScheduleToDatabase(companyId: string, teamId: string, schedule: any[]) {
  try {
    // Ta bort gamla scheman för samma period
    const startDate = schedule[0]?.dateString;
    const endDate = schedule[schedule.length - 1]?.dateString;
    
    if (startDate && endDate) {
      await supabase
        .from('shifts')
        .delete()
        .eq('company_id', companyId)
        .eq('team_id', teamId)
        .gte('start_time', startDate)
        .lte('start_time', endDate);
    }

    // Förbered data för insättning
    const shiftsToInsert = schedule
      .filter(day => day.shift.time.start && day.shift.time.end) // Bara arbetsdagar
      .map(day => ({
        company_id: companyId,
        team_id: teamId,
        start_time: `${day.dateString} ${day.shift.time.start}`,
        end_time: `${day.dateString} ${day.shift.time.end}`,
        position: day.shift.code,
        location: 'SSAB Oxelösund',
        status: 'scheduled',
        notes: `Cykeldag ${day.shift.cycleDay}/${day.shift.totalCycleDays}`
      }));

    // Sätt in nya scheman
    if (shiftsToInsert.length > 0) {
      const { error } = await supabase
        .from('shifts')
        .insert(shiftsToInsert);

      if (error) {
        console.error('Fel vid sparande av schema i databas:', error);
        throw error;
      }
    }

  } catch (error) {
    console.error('Fel vid databasoperation:', error);
    // Vi kastar inte felet här eftersom huvudfunktionen fortfarande ska returnera schemat
    // även om databasoperationen misslyckas
  }
}

/**
 * Hjälpfunktion för att kontrollera om ett datum är idag
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Convenience-funktioner för specifika SSAB Oxelösund teams
 */
export async function generateSSABSchedule(teamId: '31' | '32' | '33' | '34' | '35', startDate: string, endDate: string, includeStats = true): Promise<ScheduleResponse> {
  return generateSchedule({
    companyId: 'ssab',
    teamId,
    startDate,
    endDate,
    includeStats
  });
}

/**
 * Genererar schema för aktuell månad för ett specifikt SSAB team
 */
export async function generateCurrentMonthSchedule(teamId: '31' | '32' | '33' | '34' | '35'): Promise<ScheduleResponse> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return generateSSABSchedule(
    teamId,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0],
    true
  );
}

/**
 * Genererar schema för alla SSAB teams för en specifik period
 */
export async function generateAllTeamsSchedule(startDate: string, endDate: string): Promise<Record<string, ScheduleResponse>> {
  const teams: ('31' | '32' | '33' | '34' | '35')[] = ['31', '32', '33', '34', '35'];
  const results: Record<string, ScheduleResponse> = {};
  
  for (const team of teams) {
    results[team] = await generateSSABSchedule(team, startDate, endDate, true);
  }
  
  return results;
}