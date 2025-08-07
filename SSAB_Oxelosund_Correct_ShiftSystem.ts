// ✅ SSAB Oxelösund 3-Skift System - Korrekt Implementation 2025-2040
// Baserat på exakta regler: 3F→2E→2N→5L | 2F→3E→2N→5L | 2F→2E→3N→4L

export interface SSABShift {
  team: number;
  date: string;
  type: 'F' | 'E' | 'N' | 'L';
  start_time: string;
  end_time: string;
  swedish_date: string;
  day_of_week: string;
  cycle_day: number;
  pattern_position: number;
}

export interface SSABTeamStartInfo {
  team: number;
  start_date: string;
  start_day: string;
  pattern_start: string;
}

export class SSABOxelosundCorrectSystem {
  // ✅ Korrekta rotationsmönster enligt specifikation
  private static readonly ROTATION_PATTERNS = [
    // Period 1: 3F → 2E → 2N → 5L (12 dagar total)
    ['F', 'F', 'F', 'E', 'E', 'N', 'N', 'L', 'L', 'L', 'L', 'L'],
    // Period 2: 2F → 3E → 2N → 5L (12 dagar total)  
    ['F', 'F', 'E', 'E', 'E', 'N', 'N', 'L', 'L', 'L', 'L', 'L'],
    // Period 3: 2F → 2E → 3N → 4L (11 dagar total)
    ['F', 'F', 'E', 'E', 'N', 'N', 'N', 'L', 'L', 'L', 'L']
  ];

  // Total cykel: 35 dagar (12 + 12 + 11)
  private static readonly FULL_CYCLE = [
    ...SSABOxelosundCorrectSystem.ROTATION_PATTERNS[0],
    ...SSABOxelosundCorrectSystem.ROTATION_PATTERNS[1], 
    ...SSABOxelosundCorrectSystem.ROTATION_PATTERNS[2]
  ];

  private static readonly CYCLE_LENGTH = 35;

  // ✅ Team startdatum och pattern position enligt specifikation
  private static readonly TEAM_START_INFO: SSABTeamStartInfo[] = [
    { team: 31, start_date: '2025-01-03', start_day: 'fredag', pattern_start: '3F→2E→2N→5L' },
    { team: 32, start_date: '2025-01-06', start_day: 'måndag', pattern_start: '2F→2E→3N→4L' },
    { team: 33, start_date: '2025-01-08', start_day: 'onsdag', pattern_start: '2F→3E→2N→5L' },
    { team: 34, start_date: '2025-01-10', start_day: 'fredag', pattern_start: '3F→2E→2N→5L' },
    { team: 35, start_date: '2025-01-13', start_day: 'måndag', pattern_start: '2F→2E→3N→4L' }
  ];

  // Definiera vilken pattern varje team börjar med
  private static readonly TEAM_PATTERN_START = {
    31: 0,  // Börjar med 3F→2E→2N→5L (position 0)
    32: 24, // Börjar med 2F→2E→3N→4L (position 24)
    33: 12, // Börjar med 2F→3E→2N→5L (position 12)
    34: 0,  // Börjar med 3F→2E→2N→5L (position 0) 
    35: 24  // Börjar med 2F→2E→3N→4L (position 24)
  };

  // Team offsets baserat på startdatum relativ till lag 31
  private static readonly TEAM_OFFSETS = {
    31: 0,   // Startar 2025-01-03
    32: 3,   // Startar 2025-01-06 (3 dagar senare)
    33: 5,   // Startar 2025-01-08 (5 dagar senare)
    34: 7,   // Startar 2025-01-10 (7 dagar senare)
    35: 10   // Startar 2025-01-13 (10 dagar senare)
  };

  // ✅ Skifttider
  private static readonly SHIFT_TIMES = {
    F: { start: '06:00', end: '14:00', name: 'Förmiddag' },
    E: { start: '14:00', end: '22:00', name: 'Eftermiddag' },
    N: { start: '22:00', end: '06:00', name: 'Natt' },
    L: { start: '', end: '', name: 'Ledig' }
  };

  // ✅ Svenska dagnamn
  private static readonly SWEDISH_DAYS = [
    'söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'
  ];

  // ✅ Svenska månader
  private static readonly SWEDISH_MONTHS = [
    'januari', 'februari', 'mars', 'april', 'maj', 'juni',
    'juli', 'augusti', 'september', 'oktober', 'november', 'december'
  ];

  /**
   * ✅ Beräknar korrekt skift för ett specifikt datum och team
   */
  private static calculateShiftForDate(date: Date, team: number): SSABShift {
    // Hämta team-specifik startdatum
    const teamStartInfo = this.TEAM_START_INFO.find(t => t.team === team);
    if (!teamStartInfo) {
      throw new Error(`Team ${team} not found`);
    }
    
    const teamStartDate = new Date(teamStartInfo.start_date);
    const daysDiff = Math.floor((date.getTime() - teamStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Om vi är före teamets startdatum, returnera ledig
    if (daysDiff < 0) {
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = this.SWEDISH_DAYS[date.getDay()];
      const swedishDate = `${date.getDate()} ${this.SWEDISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
      
      return {
        team,
        date: dateStr,
        type: 'L',
        start_time: '',
        end_time: '',
        swedish_date: swedishDate,
        day_of_week: dayOfWeek,
        cycle_day: 0,
        pattern_position: 0
      };
    }
    
    // Beräkna position i 35-dagars cykel med team-specifik start position
    const teamPatternStart = this.TEAM_PATTERN_START[team as keyof typeof this.TEAM_PATTERN_START];
    const cyclePosition = (daysDiff + teamPatternStart) % this.CYCLE_LENGTH;
    
    // Hämta skifttyp från fullständig cykel
    const shiftType = this.FULL_CYCLE[cyclePosition] as 'F' | 'E' | 'N' | 'L';
    
    // Formatera datum
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = this.SWEDISH_DAYS[date.getDay()];
    const swedishDate = `${date.getDate()} ${this.SWEDISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    
    // Skapa skift objekt
    const shift: SSABShift = {
      team,
      date: dateStr,
      type: shiftType,
      start_time: this.SHIFT_TIMES[shiftType].start,
      end_time: this.SHIFT_TIMES[shiftType].end,
      swedish_date: swedishDate,
      day_of_week: dayOfWeek,
      cycle_day: cyclePosition + 1,
      pattern_position: this.getPatternPosition(cyclePosition)
    };

    return shift;
  }

  /**
   * ✅ Bestämmer vilken pattern-position (1, 2, eller 3) vi är i
   */
  private static getPatternPosition(cyclePosition: number): number {
    if (cyclePosition < 12) return 1; // 3F→2E→2N→5L
    if (cyclePosition < 24) return 2; // 2F→3E→2N→5L
    return 3; // 2F→2E→3N→4L
  }

  /**
   * ✅ Genererar komplett skiftschema för alla lag för given period
   */
  static generateSchedule(startDate: string, endDate: string): SSABShift[] {
    const shifts: SSABShift[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // För varje team (31-35)
    for (const teamInfo of this.TEAM_START_INFO) {
      let currentDate = new Date(start);
      
      // Generera skift för varje dag i perioden
      while (currentDate <= end) {
        const shift = this.calculateShiftForDate(currentDate, teamInfo.team);
        shifts.push(shift);
        
        // Gå till nästa dag
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return shifts.sort((a, b) => {
      // Sortera först på datum, sedan på team
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.team - b.team;
    });
  }

  /**
   * ✅ Validerar att schemat följer SSAB regler
   */
  static validateSchedule(shifts: SSABShift[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    statistics: any;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Gruppera skift per dag för att validera att alltid 3 lag arbetar
    const shiftsByDate: { [date: string]: SSABShift[] } = {};
    
    shifts.forEach(shift => {
      if (!shiftsByDate[shift.date]) {
        shiftsByDate[shift.date] = [];
      }
      shiftsByDate[shift.date].push(shift);
    });
    
    // Validera att alltid 3 lag arbetar per dag (F, E, N)
    Object.entries(shiftsByDate).forEach(([date, dayShifts]) => {
      const workingShifts = dayShifts.filter(s => s.type !== 'L');
      const shiftTypes = workingShifts.map(s => s.type);
      
      if (workingShifts.length !== 3) {
        errors.push(`${date}: ${workingShifts.length} lag arbetar istället för 3`);
      }
      
      // Kontrollera att vi har F, E, N
      const expectedTypes = ['F', 'E', 'N'];
      expectedTypes.forEach(type => {
        if (!shiftTypes.includes(type as 'F' | 'E' | 'N')) {
          errors.push(`${date}: Saknar ${type} skift`);
        }
      });
      
      // Kontrollera att inget team arbetar samma skift samma dag
      const teamsByType: { [type: string]: number[] } = {};
      workingShifts.forEach(shift => {
        if (!teamsByType[shift.type]) {
          teamsByType[shift.type] = [];
        }
        teamsByType[shift.type].push(shift.team);
      });
      
      Object.entries(teamsByType).forEach(([type, teams]) => {
        if (teams.length > 1) {
          errors.push(`${date}: Flera lag (${teams.join(', ')}) arbetar ${type} skift`);
        }
      });
    });

    // Beräkna statistik
    const statistics = this.calculateStatistics(shifts);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      statistics
    };
  }

  /**
   * ✅ Beräknar statistik för schemat
   */
  private static calculateStatistics(shifts: SSABShift[]): any {
    const stats: any = {};
    
    // Statistik per team
    [31, 32, 33, 34, 35].forEach(team => {
      const teamShifts = shifts.filter(s => s.team === team);
      const workShifts = teamShifts.filter(s => s.type !== 'L');
      
      stats[`team_${team}`] = {
        total_days: teamShifts.length,
        work_days: workShifts.length,
        free_days: teamShifts.filter(s => s.type === 'L').length,
        morning_shifts: teamShifts.filter(s => s.type === 'F').length,
        afternoon_shifts: teamShifts.filter(s => s.type === 'E').length,
        night_shifts: teamShifts.filter(s => s.type === 'N').length,
        work_hours: workShifts.length * 8 // 8 timmar per skift
      };
    });
    
    return stats;
  }

  /**
   * ✅ Kontrollerar om datum är skottår
   */
  private static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  /**
   * ✅ Hanterar svensk sommartid/vintertid
   */
  private static isDST(date: Date): boolean {
    const year = date.getFullYear();
    
    // Sommartid: sista söndagen i mars till sista söndagen i oktober
    const marchLast = new Date(year, 2, 31);
    const marchLastSunday = new Date(marchLast.getFullYear(), marchLast.getMonth(), 
      marchLast.getDate() - marchLast.getDay());
    
    const octoberLast = new Date(year, 9, 31);
    const octoberLastSunday = new Date(octoberLast.getFullYear(), octoberLast.getMonth(), 
      octoberLast.getDate() - octoberLast.getDay());
    
    return date >= marchLastSunday && date < octoberLastSunday;
  }

  /**
   * ✅ Exporterar för Supabase
   */
  static exportForSupabase(shifts: SSABShift[]): any[] {
    return shifts.map(shift => ({
      team: shift.team,
      date: shift.date,
      type: shift.type,
      start_time: shift.start_time,
      end_time: shift.end_time,
      created_at: new Date().toISOString(),
      is_generated: true
    }));
  }

  /**
   * ✅ Exporterar till CSV format
   */
  static exportToCSV(shifts: SSABShift[]): string {
    const headers = ['Team', 'Datum', 'Typ', 'Starttid', 'Sluttid', 'Svensk Datum', 'Veckodag', 'Cykeldag'];
    const rows = shifts.map(shift => [
      shift.team,
      shift.date,
      shift.type,
      shift.start_time,
      shift.end_time,
      shift.swedish_date,
      shift.day_of_week,
      shift.cycle_day
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * ✅ Exporterar till ICS kalenderformat
   */
  static exportToICS(shifts: SSABShift[], team?: number): string {
    const filteredShifts = team ? shifts.filter(s => s.team === team) : shifts;
    const workShifts = filteredShifts.filter(s => s.type !== 'L');
    
    let ics = 'BEGIN:VCALENDAR\n';
    ics += 'VERSION:2.0\n';
    ics += 'PRODID:-//SSAB Oxelösund//Skiftschema//SV\n';
    ics += 'CALSCALE:GREGORIAN\n';
    
    workShifts.forEach(shift => {
      const startDate = new Date(shift.date + 'T' + shift.start_time + ':00');
      const endDate = shift.type === 'N' 
        ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000) // Nattskift går över midnatt
        : new Date(shift.date + 'T' + shift.end_time + ':00');
      
      ics += 'BEGIN:VEVENT\n';
      ics += `UID:${shift.team}-${shift.date}-${shift.type}@ssab.se\n`;
      ics += `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      ics += `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      ics += `SUMMARY:${shift.type} - Lag ${shift.team} (${this.SHIFT_TIMES[shift.type].name})\n`;
      ics += `DESCRIPTION:SSAB Oxelösund skift\\nTyp: ${shift.type}\\nTid: ${shift.start_time}-${shift.end_time}\n`;
      ics += 'END:VEVENT\n';
    });
    
    ics += 'END:VCALENDAR';
    return ics;
  }
}

// ✅ Exempel användning och validering
export const SSABExamples = {
  // Generera schema för 2025-2026
  generate2025_2026: () => {
    return SSABOxelosundCorrectSystem.generateSchedule('2025-01-01', '2026-12-31');
  },

  // Validera schema för en månad
  validateJanuary2025: () => {
    const shifts = SSABOxelosundCorrectSystem.generateSchedule('2025-01-01', '2025-01-31');
    return SSABOxelosundCorrectSystem.validateSchedule(shifts);
  },

  // Exportera för Supabase
  exportToSupabase: () => {
    const shifts = SSABOxelosundCorrectSystem.generateSchedule('2025-01-01', '2025-12-31');
    return SSABOxelosundCorrectSystem.exportForSupabase(shifts);
  },

  // Exportera till CSV
  exportToCSV: () => {
    const shifts = SSABOxelosundCorrectSystem.generateSchedule('2025-01-01', '2025-01-31');
    return SSABOxelosundCorrectSystem.exportToCSV(shifts);
  },

  // Exportera kalender för specifikt lag
  exportCalendarTeam31: () => {
    const shifts = SSABOxelosundCorrectSystem.generateSchedule('2025-01-01', '2025-12-31');
    return SSABOxelosundCorrectSystem.exportToICS(shifts, 31);
  }
};

export default SSABOxelosundCorrectSystem;