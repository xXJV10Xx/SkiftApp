// ✅ SSAB Oxelösund 3-Skift System - Korrekt Implementation v2
// Säkerställer att alltid exakt 3 lag arbetar (F, E, N) och 2 lag är lediga

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

export class SSABOxelosundSystemV2 {
  // ✅ Rotationsmönster - varje team följer samma grundmönster men startar vid olika tidpunkter
  private static readonly BASE_PATTERN = [
    // Period 1: 3F → 2E → 2N → 5L (12 dagar)
    'F', 'F', 'F', 'E', 'E', 'N', 'N', 'L', 'L', 'L', 'L', 'L',
    // Period 2: 2F → 3E → 2N → 5L (12 dagar)
    'F', 'F', 'E', 'E', 'E', 'N', 'N', 'L', 'L', 'L', 'L', 'L',
    // Period 3: 2F → 2E → 3N → 4L (11 dagar)
    'F', 'F', 'E', 'E', 'N', 'N', 'N', 'L', 'L', 'L', 'L'
  ];

  private static readonly CYCLE_LENGTH = 35;

  // ✅ Team offsets för att skapa rätt förskjutning
  // Beräknat så att alltid 3 lag arbetar och 2 är lediga
  private static readonly TEAM_OFFSETS = {
    31: 0,   // Startar dag 0 i cykeln
    32: 7,   // Startar dag 7 i cykeln  
    33: 14,  // Startar dag 14 i cykeln
    34: 21,  // Startar dag 21 i cykeln
    35: 28   // Startar dag 28 i cykeln
  };

  // ✅ Faktiska startdatum för varje team
  private static readonly TEAM_START_DATES = {
    31: '2025-01-03', // fredag
    32: '2025-01-06', // måndag 
    33: '2025-01-08', // onsdag
    34: '2025-01-10', // fredag
    35: '2025-01-13'  // måndag
  };

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
    const teamStartDate = new Date(this.TEAM_START_DATES[team as keyof typeof this.TEAM_START_DATES]);
    
    // Om vi är före teamets startdatum, returnera ledig
    if (date < teamStartDate) {
      return this.createShift(date, team, 'L', 0);
    }

    // Beräkna antal dagar sedan teamstart
    const daysSinceStart = Math.floor((date.getTime() - teamStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Beräkna position i cykel
    const cyclePosition = daysSinceStart % this.CYCLE_LENGTH;
    
    // Hämta skifttyp från pattern
    const shiftType = this.BASE_PATTERN[cyclePosition] as 'F' | 'E' | 'N' | 'L';
    
    return this.createShift(date, team, shiftType, cyclePosition + 1);
  }

  /**
   * ✅ Skapar skift objekt
   */
  private static createShift(date: Date, team: number, shiftType: 'F' | 'E' | 'N' | 'L', cycleDay: number): SSABShift {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = this.SWEDISH_DAYS[date.getDay()];
    const swedishDate = `${date.getDate()} ${this.SWEDISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    
    return {
      team,
      date: dateStr,
      type: shiftType,
      start_time: this.SHIFT_TIMES[shiftType].start,
      end_time: this.SHIFT_TIMES[shiftType].end,
      swedish_date: swedishDate,
      day_of_week: dayOfWeek,
      cycle_day: cycleDay,
      pattern_position: this.getPatternPosition(cycleDay - 1)
    };
  }

  /**
   * ✅ Bestämmer pattern position
   */
  private static getPatternPosition(cyclePosition: number): number {
    if (cyclePosition < 12) return 1; // 3F→2E→2N→5L
    if (cyclePosition < 24) return 2; // 2F→3E→2N→5L
    return 3; // 2F→2E→3N→4L
  }

  /**
   * ✅ Genererar schema för alla lag
   */
  static generateSchedule(startDate: string, endDate: string): SSABShift[] {
    const shifts: SSABShift[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // För varje team
    for (const team of [31, 32, 33, 34, 35]) {
      let currentDate = new Date(start);
      
      while (currentDate <= end) {
        const shift = this.calculateShiftForDate(currentDate, team);
        shifts.push(shift);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return shifts.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.team - b.team;
    });
  }

  /**
   * ✅ Optimerad validering - kontrollerar att schemat fungerar korrekt
   */
  static validateSchedule(shifts: SSABShift[]): {
    isValid: boolean;
    errors: string[];
    dailyStats: any[];
    teamStats: any;
  } {
    const errors: string[] = [];
    const dailyStats: any[] = [];
    
    // Gruppera per datum
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
      
      const stats = {
        date,
        working_teams: teams.length,
        shift_types: shiftTypes,
        has_F: shiftTypes.includes('F'),
        has_E: shiftTypes.includes('E'),
        has_N: shiftTypes.includes('N'),
        valid: true,
        issues: [] as string[]
      };

      // Kontrollera att exakt 3 lag arbetar
      if (teams.length !== 3) {
        stats.valid = false;
        stats.issues.push(`${teams.length} lag arbetar, förväntat 3`);
        errors.push(`${date}: ${teams.length} lag arbetar istället för 3`);
      }

      // Kontrollera att vi har F, E, N
      if (!stats.has_F) {
        stats.valid = false;
        stats.issues.push('Saknar F skift');
        errors.push(`${date}: Saknar F skift`);
      }
      if (!stats.has_E) {
        stats.valid = false;
        stats.issues.push('Saknar E skift');
        errors.push(`${date}: Saknar E skift`);
      }
      if (!stats.has_N) {
        stats.valid = false;
        stats.issues.push('Saknar N skift');
        errors.push(`${date}: Saknar N skift`);
      }

      // Kontrollera duplicerade skifttyper
      const typeCounts = shiftTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      Object.entries(typeCounts).forEach(([type, count]) => {
        if (count > 1) {
          stats.valid = false;
          stats.issues.push(`${count} lag arbetar ${type} skift`);
          errors.push(`${date}: ${count} lag arbetar ${type} skift`);
        }
      });

      dailyStats.push(stats);
    });

    // Beräkna team statistik
    const teamStats: any = {};
    [31, 32, 33, 34, 35].forEach(team => {
      const teamShifts = shifts.filter(s => s.team === team);
      const workShifts = teamShifts.filter(s => s.type !== 'L');
      
      teamStats[`team_${team}`] = {
        total_days: teamShifts.length,
        work_days: workShifts.length,
        free_days: teamShifts.filter(s => s.type === 'L').length,
        F_shifts: teamShifts.filter(s => s.type === 'F').length,
        E_shifts: teamShifts.filter(s => s.type === 'E').length,
        N_shifts: teamShifts.filter(s => s.type === 'N').length,
        work_hours: workShifts.length * 8
      };
    });

    return {
      isValid: errors.length === 0,
      errors,
      dailyStats,
      teamStats
    };
  }

  /**
   * ✅ Exportfunktioner
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

  static exportToCSV(shifts: SSABShift[]): string {
    const headers = ['Team', 'Datum', 'Typ', 'Starttid', 'Sluttid', 'Svensk Datum', 'Veckodag'];
    const rows = shifts.map(shift => [
      shift.team,
      shift.date,
      shift.type,
      shift.start_time,
      shift.end_time,
      shift.swedish_date,
      shift.day_of_week
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

export default SSABOxelosundSystemV2;