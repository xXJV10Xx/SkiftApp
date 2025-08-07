// ✅ SSAB Oxelösund 3-Skift System - FINAL Implementation
// Garanterar att alltid exakt 3 lag arbetar (F, E, N) varje dag från 2023-2040

export interface SSABShift {
  team: number;
  date: string;
  type: 'F' | 'E' | 'N' | 'L';
  start_time: string;
  end_time: string;
  swedish_date: string;
  day_of_week: string;
  cycle_day: number;
  pattern_name: string;
}

export class SSABOxelosundFinalSystem {
  // ✅ SSAB 35-dagars komplett cykel för alla lag
  // Denna cykel säkerställer att alltid 3 lag arbetar och 2 är lediga
  private static readonly MASTER_CYCLE = [
    // Period 1: 3F → 2E → 2N → 5L (12 dagar)
    'F', 'F', 'F', 'E', 'E', 'N', 'N', 'L', 'L', 'L', 'L', 'L',
    // Period 2: 2F → 3E → 2N → 5L (12 dagar)
    'F', 'F', 'E', 'E', 'E', 'N', 'N', 'L', 'L', 'L', 'L', 'L',
    // Period 3: 2F → 2E → 3N → 4L (11 dagar)
    'F', 'F', 'E', 'E', 'N', 'N', 'N', 'L', 'L', 'L', 'L'
  ];

  // ✅ Team offsets beräknade för att säkerställa kontinuerlig täckning
  // Varje team börjar 7 dagar efter föregående för optimal rotation
  private static readonly TEAM_OFFSETS = {
    31: 0,   // Startar cykel position 0
    32: 7,   // Startar cykel position 7
    33: 14,  // Startar cykel position 14
    34: 21,  // Startar cykel position 21
    35: 28   // Startar cykel position 28
  };

  // ✅ Base datum för beräkningar - 1 januari 2023
  private static readonly BASE_DATE = new Date('2023-01-01');

  // ✅ Skifttider
  private static readonly SHIFT_TIMES = {
    F: { start: '06:00', end: '14:00', name: 'Förmiddag' },
    E: { start: '14:00', end: '22:00', name: 'Eftermiddag' },
    N: { start: '22:00', end: '06:00', name: 'Natt' },
    L: { start: '', end: '', name: 'Ledig' }
  };

  // ✅ Svenska dagnamn och månader
  private static readonly SWEDISH_DAYS = [
    'söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'
  ];

  private static readonly SWEDISH_MONTHS = [
    'januari', 'februari', 'mars', 'april', 'maj', 'juni',
    'juli', 'augusti', 'september', 'oktober', 'november', 'december'
  ];

  /**
   * ✅ Beräknar skift för specifikt datum och team
   */
  private static calculateShiftForDate(date: Date, team: number): SSABShift {
    // Beräkna antal dagar sedan bas datum
    const daysSinceBase = Math.floor((date.getTime() - this.BASE_DATE.getTime()) / (1000 * 60 * 60 * 24));
    
    // Lägg till team offset för att staggera lagen
    const teamOffset = this.TEAM_OFFSETS[team as keyof typeof this.TEAM_OFFSETS];
    const adjustedDays = daysSinceBase + teamOffset;
    
    // Beräkna position i 35-dagars cykel
    const cyclePosition = ((adjustedDays % 35) + 35) % 35;
    
    // Hämta skifttyp från master cykel
    const shiftType = this.MASTER_CYCLE[cyclePosition] as 'F' | 'E' | 'N' | 'L';
    
    return this.createShift(date, team, shiftType, cyclePosition + 1);
  }

  /**
   * ✅ Skapar skift objekt med svensk formatering
   */
  private static createShift(date: Date, team: number, shiftType: 'F' | 'E' | 'N' | 'L', cycleDay: number): SSABShift {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = this.SWEDISH_DAYS[date.getDay()];
    const swedishDate = `${date.getDate()} ${this.SWEDISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    
    // Bestäm pattern namn baserat på cykel position
    let patternName = '';
    if (cycleDay <= 12) {
      patternName = '3F→2E→2N→5L';
    } else if (cycleDay <= 24) {
      patternName = '2F→3E→2N→5L';
    } else {
      patternName = '2F→2E→3N→4L';
    }
    
    return {
      team,
      date: dateStr,
      type: shiftType,
      start_time: this.SHIFT_TIMES[shiftType].start,
      end_time: this.SHIFT_TIMES[shiftType].end,
      swedish_date: swedishDate,
      day_of_week: dayOfWeek,
      cycle_day: cycleDay,
      pattern_name: patternName
    };
  }

  /**
   * ✅ Genererar komplett schema för alla lag inom datumintervall
   */
  static generateSchedule(startDate: string, endDate: string): SSABShift[] {
    const shifts: SSABShift[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Säkerställ att datum är giltiga
    if (start > end) {
      throw new Error('Startdatum måste vara före slutdatum');
    }
    
    // Generera för alla lag (31-35)
    for (const team of [31, 32, 33, 34, 35]) {
      let currentDate = new Date(start);
      
      while (currentDate <= end) {
        const shift = this.calculateShiftForDate(currentDate, team);
        shifts.push(shift);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    // Sortera på datum och sedan team
    return shifts.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.team - b.team;
    });
  }

  /**
   * ✅ Validerar att schemat följer SSAB regler
   */
  static validateSchedule(shifts: SSABShift[]): {
    isValid: boolean;
    errors: string[];
    coverage: { date: string; teams: number[]; shift_types: string[]; valid: boolean }[];
    statistics: any;
  } {
    const errors: string[] = [];
    const coverage: any[] = [];
    
    // Gruppera skift per datum
    const shiftsByDate: { [date: string]: SSABShift[] } = {};
    shifts.forEach(shift => {
      if (!shiftsByDate[shift.date]) shiftsByDate[shift.date] = [];
      shiftsByDate[shift.date].push(shift);
    });
    
    // Validera varje dag
    Object.entries(shiftsByDate).forEach(([date, dayShifts]) => {
      const workingShifts = dayShifts.filter(s => s.type !== 'L');
      const shiftTypes = workingShifts.map(s => s.type);
      const teams = workingShifts.map(s => s.team);
      
      const dayData = {
        date,
        teams,
        shift_types: shiftTypes,
        valid: true
      };
      
      // Kontrollera att exakt 3 lag arbetar
      if (teams.length !== 3) {
        dayData.valid = false;
        errors.push(`${date}: ${teams.length} lag arbetar istället för 3`);
      }
      
      // Kontrollera att vi har F, E, N
      const requiredTypes = ['F', 'E', 'N'];
      requiredTypes.forEach(type => {
        if (!shiftTypes.includes(type)) {
          dayData.valid = false;
          errors.push(`${date}: Saknar ${type} skift`);
        }
      });
      
      // Kontrollera inga duplicerade skifttyper
      const typeCounts = shiftTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });
      
      Object.entries(typeCounts).forEach(([type, count]) => {
        if (count > 1) {
          dayData.valid = false;
          errors.push(`${date}: ${count} lag arbetar ${type} skift`);
        }
      });
      
      coverage.push(dayData);
    });
    
    // Beräkna statistik
    const statistics = this.calculateStatistics(shifts);
    
    return {
      isValid: errors.length === 0,
      errors,
      coverage,
      statistics
    };
  }

  /**
   * ✅ Beräknar omfattande statistik
   */
  private static calculateStatistics(shifts: SSABShift[]): any {
    const stats: any = {
      total_shifts: shifts.length,
      teams: {},
      overall: {
        work_shifts: 0,
        free_days: 0,
        F_shifts: 0,
        E_shifts: 0,
        N_shifts: 0
      }
    };
    
    // Statistik per team
    [31, 32, 33, 34, 35].forEach(team => {
      const teamShifts = shifts.filter(s => s.team === team);
      const workShifts = teamShifts.filter(s => s.type !== 'L');
      
      const teamStats = {
        total_days: teamShifts.length,
        work_days: workShifts.length,
        free_days: teamShifts.filter(s => s.type === 'L').length,
        F_shifts: teamShifts.filter(s => s.type === 'F').length,
        E_shifts: teamShifts.filter(s => s.type === 'E').length,
        N_shifts: teamShifts.filter(s => s.type === 'N').length,
        work_hours: workShifts.length * 8,
        patterns: {
          pattern_1: teamShifts.filter(s => s.pattern_name === '3F→2E→2N→5L').length,
          pattern_2: teamShifts.filter(s => s.pattern_name === '2F→3E→2N→5L').length,
          pattern_3: teamShifts.filter(s => s.pattern_name === '2F→2E→3N→4L').length
        }
      };
      
      stats.teams[`team_${team}`] = teamStats;
      
      // Lägg till overall statistik
      stats.overall.work_shifts += teamStats.work_days;
      stats.overall.free_days += teamStats.free_days;
      stats.overall.F_shifts += teamStats.F_shifts;
      stats.overall.E_shifts += teamStats.E_shifts;
      stats.overall.N_shifts += teamStats.N_shifts;
    });
    
    return stats;
  }

  /**
   * ✅ Kontrollerar skottår
   */
  static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  /**
   * ✅ Kontrollerar svensk sommartid (sista söndagen i mars till sista söndagen i oktober)
   */
  static isDST(date: Date): boolean {
    const year = date.getFullYear();
    
    // Hitta sista söndagen i mars
    const marchLast = new Date(year, 2, 31);
    const dstStart = new Date(year, 2, 31 - marchLast.getDay());
    
    // Hitta sista söndagen i oktober
    const octoberLast = new Date(year, 9, 31);
    const dstEnd = new Date(year, 9, 31 - octoberLast.getDay());
    
    return date >= dstStart && date < dstEnd;
  }

  /**
   * ✅ Exporterar för Supabase databas
   */
  static exportForSupabase(shifts: SSABShift[]): any[] {
    return shifts.map(shift => ({
      team: shift.team,
      date: shift.date,
      type: shift.type,
      start_time: shift.start_time,
      end_time: shift.end_time,
      created_at: new Date().toISOString(),
      is_generated: true,
      pattern_name: shift.pattern_name,
      cycle_day: shift.cycle_day
    }));
  }

  /**
   * ✅ Exporterar till CSV format
   */
  static exportToCSV(shifts: SSABShift[]): string {
    const headers = [
      'Team', 'Datum', 'Typ', 'Starttid', 'Sluttid', 
      'Svensk_Datum', 'Veckodag', 'Cykeldag', 'Mönster'
    ];
    
    const rows = shifts.map(shift => [
      shift.team,
      shift.date,
      shift.type,
      shift.start_time,
      shift.end_time,
      `"${shift.swedish_date}"`,
      shift.day_of_week,
      shift.cycle_day,
      `"${shift.pattern_name}"`
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * ✅ Exporterar till ICS kalenderformat
   */
  static exportToICS(shifts: SSABShift[], teamFilter?: number): string {
    const filteredShifts = teamFilter 
      ? shifts.filter(s => s.team === teamFilter && s.type !== 'L')
      : shifts.filter(s => s.type !== 'L');
    
    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SSAB Oxelösund//Skiftschema//SV',
      'CALSCALE:GREGORIAN'
    ].join('\n');
    
    filteredShifts.forEach(shift => {
      const startDate = new Date(`${shift.date}T${shift.start_time}:00`);
      const endDate = shift.type === 'N' 
        ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000) // Nattskift går över midnatt
        : new Date(`${shift.date}T${shift.end_time}:00`);
      
      const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      ics += '\n' + [
        'BEGIN:VEVENT',
        `UID:ssab-${shift.team}-${shift.date}-${shift.type}@oxelosund.se`,
        `DTSTART:${formatDate(startDate)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${shift.type}-skift Lag ${shift.team}`,
        `DESCRIPTION:SSAB Oxelösund\\nLag: ${shift.team}\\nSkift: ${this.SHIFT_TIMES[shift.type].name}\\nTid: ${shift.start_time}-${shift.end_time}\\nMönster: ${shift.pattern_name}`,
        'END:VEVENT'
      ].join('\n');
    });
    
    ics += '\nEND:VCALENDAR';
    return ics;
  }

  /**
   * ✅ Genererar komplett schema 2023-2040
   */
  static generateCompleteSchedule(): SSABShift[] {
    return this.generateSchedule('2023-01-01', '2040-12-31');
  }

  /**
   * ✅ Snabb validering av specifik period
   */
  static quickValidate(startDate: string, endDate: string): boolean {
    const shifts = this.generateSchedule(startDate, endDate);
    const validation = this.validateSchedule(shifts);
    return validation.isValid;
  }
}

// ✅ Bekvämlighets exports för olika användningsområden
export const SSABQuickAccess = {
  // Generera för specifik månad
  getMonth: (year: number, month: number) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return SSABOxelosundFinalSystem.generateSchedule(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );
  },

  // Generera för specifikt år
  getYear: (year: number) => {
    return SSABOxelosundFinalSystem.generateSchedule(
      `${year}-01-01`,
      `${year}-12-31`
    );
  },

  // Validera specifik månad
  validateMonth: (year: number, month: number) => {
    const shifts = SSABQuickAccess.getMonth(year, month);
    return SSABOxelosundFinalSystem.validateSchedule(shifts);
  },

  // Hämta för specifikt lag
  getTeamSchedule: (team: number, startDate: string, endDate: string) => {
    const allShifts = SSABOxelosundFinalSystem.generateSchedule(startDate, endDate);
    return allShifts.filter(s => s.team === team);
  }
};

export default SSABOxelosundFinalSystem;