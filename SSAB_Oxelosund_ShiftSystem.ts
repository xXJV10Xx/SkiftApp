// 🏭 SSAB Oxelösund 3-Skift System Implementation
// TypeScript/JavaScript version för Loveable

export interface SSABShift {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  shiftType: 'F' | 'E' | 'N' | 'L';
  teamName: string;
  teamColor: string;
  cycleDay: number;
  isGenerated: boolean;
}

export interface SSABTeam {
  id: string;
  name: string;
  colorHex: string;
  teamOffset: number;
  description: string;
}

export interface SSABStats {
  teamName: string;
  totalShifts: number;
  morningShifts: number;
  afternoonShifts: number;
  nightShifts: number;
  freeDays: number;
  totalHours: number;
  averageShiftLength: number;
}

export class SSABOxelosundShiftSystem {
  private static readonly SHIFT_PATTERN = [
    '2F', '2E', '3N', '4L', '3F', '3E', '1N', '5L',
    '2F', '2E', '3N', '5L', '3F', '2E', '2N', '4L'
  ];
  
  private static readonly ALLOWED_START_DAYS = [1, 3, 5]; // Måndag, Onsdag, Fredag
  private static readonly TEAMS: SSABTeam[] = [
    { id: 'lag-31', name: 'Lag 31', colorHex: '#FF6B6B', teamOffset: 0, description: '3-skift lag 31' },
    { id: 'lag-32', name: 'Lag 32', colorHex: '#4ECDC4', teamOffset: 1, description: '3-skift lag 32' },
    { id: 'lag-33', name: 'Lag 33', colorHex: '#45B7D1', teamOffset: 2, description: '3-skift lag 33' },
    { id: 'lag-34', name: 'Lag 34', colorHex: '#96CEB4', teamOffset: 3, description: '3-skift lag 34' },
    { id: 'lag-35', name: 'Lag 35', colorHex: '#FFEAA7', teamOffset: 4, description: '3-skift lag 35' }
  ];

  /**
   * Genererar skiftschema för SSAB Oxelösund 2023-2035
   */
  static generateShifts(startDate: Date = new Date('2023-01-01'), endDate: Date = new Date('2035-12-31')): SSABShift[] {
    const shifts: SSABShift[] = [];
    
    for (const team of this.TEAMS) {
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        // Kontrollera om det är en tillåten startdag
        if (this.ALLOWED_START_DAYS.includes(currentDate.getDay())) {
          // Generera 7-dagars arbetsblock
          for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const workDate = new Date(currentDate);
            workDate.setDate(currentDate.getDate() + dayOffset);
            
            const cycleDay = this.calculateCycleDay(workDate, team.teamOffset);
            const shiftType = this.SHIFT_PATTERN[cycleDay];
            
            const shift = this.createShift(workDate, shiftType, team);
            if (shift) {
              shifts.push(shift);
            }
          }
          
          // Hoppa till nästa 7-dagars block (16 dagar framåt för full rotation)
          currentDate.setDate(currentDate.getDate() + 16);
        } else {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }
    
    return shifts;
  }

  /**
   * Beräknar cykeldag baserat på datum och team offset
   */
  private static calculateCycleDay(date: Date, teamOffset: number): number {
    const baseDate = new Date('2023-01-01');
    const daysDiff = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    return (daysDiff + teamOffset) % this.SHIFT_PATTERN.length;
  }

  /**
   * Skapar ett skift baserat på datum, skifttyp och team
   */
  private static createShift(date: Date, shiftType: string, team: SSABTeam): SSABShift | null {
    const shiftCode = shiftType.charAt(shiftType.length - 1); // F, E, N, eller L
    const duration = parseInt(shiftType.slice(0, -1)); // Antal dagar
    
    let title: string;
    let startTime: Date;
    let endTime: Date;
    
    switch (shiftCode) {
      case 'F':
        title = 'Förmiddagsskift';
        startTime = new Date(date);
        startTime.setHours(6, 0, 0, 0);
        endTime = new Date(date);
        endTime.setHours(14, 0, 0, 0);
        break;
        
      case 'E':
        title = 'Eftermiddagsskift';
        startTime = new Date(date);
        startTime.setHours(14, 0, 0, 0);
        endTime = new Date(date);
        endTime.setHours(22, 0, 0, 0);
        break;
        
      case 'N':
        title = 'Nattskift';
        startTime = new Date(date);
        startTime.setHours(22, 0, 0, 0);
        endTime = new Date(date);
        endTime.setDate(date.getDate() + 1);
        endTime.setHours(6, 0, 0, 0);
        break;
        
      case 'L':
        title = 'Ledig';
        startTime = new Date(date);
        startTime.setHours(0, 0, 0, 0);
        endTime = new Date(date);
        endTime.setHours(23, 59, 59, 999);
        break;
        
      default:
        return null;
    }
    
    return {
      id: `${team.id}-${date.toISOString().split('T')[0]}`,
      title,
      startTime,
      endTime,
      shiftType: shiftCode as 'F' | 'E' | 'N' | 'L',
      teamName: team.name,
      teamColor: team.colorHex,
      cycleDay: this.calculateCycleDay(date, team.teamOffset) + 1,
      isGenerated: true
    };
  }

  /**
   * Hämtar skift för specifikt datumintervall och team
   */
  static getShifts(
    startDate: Date = new Date(),
    endDate: Date = new Date(),
    teamFilter: string = 'all'
  ): SSABShift[] {
    const allShifts = this.generateShifts(startDate, endDate);
    
    if (teamFilter === 'all') {
      return allShifts;
    }
    
    return allShifts.filter(shift => 
      shift.teamName === teamFilter || 
      shift.teamName.toLowerCase().includes(teamFilter.toLowerCase())
    );
  }

  /**
   * Beräknar statistik för SSAB teams
   */
  static getStats(startDate: Date = new Date(), endDate: Date = new Date()): SSABStats[] {
    const shifts = this.getShifts(startDate, endDate);
    const stats: { [teamName: string]: SSABStats } = {};
    
    for (const team of this.TEAMS) {
      const teamShifts = shifts.filter(s => s.teamName === team.name);
      
      const morningShifts = teamShifts.filter(s => s.shiftType === 'F').length;
      const afternoonShifts = teamShifts.filter(s => s.shiftType === 'E').length;
      const nightShifts = teamShifts.filter(s => s.shiftType === 'N').length;
      const freeDays = teamShifts.filter(s => s.shiftType === 'L').length;
      
      const totalHours = teamShifts.reduce((sum, shift) => {
        if (shift.shiftType === 'L') return sum;
        const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      
      const averageShiftLength = teamShifts.length > 0 ? totalHours / (teamShifts.length - freeDays) : 0;
      
      stats[team.name] = {
        teamName: team.name,
        totalShifts: teamShifts.length,
        morningShifts,
        afternoonShifts,
        nightShifts,
        freeDays,
        totalHours: Math.round(totalHours * 100) / 100,
        averageShiftLength: Math.round(averageShiftLength * 100) / 100
      };
    }
    
    return Object.values(stats);
  }

  /**
   * Validerar SSAB Oxelösund regler
   */
  static validateRules(startDate: Date = new Date('2023-01-01'), endDate: Date = new Date('2025-12-31')): {
    rule: string;
    status: 'PASS' | 'FAIL';
    details: string;
  }[] {
    const results = [];
    const shifts = this.getShifts(startDate, endDate);
    
    // Kontrollera att alla 5 lag finns
    const uniqueTeams = new Set(shifts.map(s => s.teamName));
    if (uniqueTeams.size === 5) {
      results.push({
        rule: 'Alla 5 lag finns',
        status: 'PASS',
        details: 'Lag 31-35 är korrekt skapade'
      });
    } else {
      results.push({
        rule: 'Alla 5 lag finns',
        status: 'FAIL',
        details: `Saknar lag - förväntade 5, fann ${uniqueTeams.size}`
      });
    }
    
    // Kontrollera startdagar (måndag, onsdag, fredag)
    const invalidStartDays = shifts.filter(s => 
      ![1, 3, 5].includes(s.startTime.getDay())
    ).length;
    
    if (invalidStartDays === 0) {
      results.push({
        rule: 'Startdagar',
        status: 'PASS',
        details: 'Alla skift börjar på måndag, onsdag eller fredag'
      });
    } else {
      results.push({
        rule: 'Startdagar',
        status: 'FAIL',
        details: `${invalidStartDays} skift börjar på fel dag`
      });
    }
    
    // Kontrollera 7-dagars arbetsblock
    const workShifts = shifts.filter(s => s.shiftType !== 'L');
    const dailyShifts: { [date: string]: number } = {};
    
    workShifts.forEach(shift => {
      const dateKey = shift.startTime.toISOString().split('T')[0];
      dailyShifts[dateKey] = (dailyShifts[dateKey] || 0) + 1;
    });
    
    const invalidDays = Object.values(dailyShifts).filter(count => count > 1).length;
    
    if (invalidDays === 0) {
      results.push({
        rule: '7-dagars block',
        status: 'PASS',
        details: 'Inga dubbla skift per dag'
      });
    } else {
      results.push({
        rule: '7-dagars block',
        status: 'FAIL',
        details: `${invalidDays} dagar har dubbla skift`
      });
    }
    
    return results;
  }

  /**
   * Exporterar data för Supabase
   */
  static exportForSupabase(shifts: SSABShift[]): any[] {
    return shifts.map(shift => ({
      title: shift.title,
      start_time: shift.startTime.toISOString(),
      end_time: shift.endTime.toISOString(),
      shift_type: shift.shiftType,
      cycle_day: shift.cycleDay,
      is_generated: shift.isGenerated,
      team_name: shift.teamName,
      team_color: shift.teamColor
    }));
  }

  /**
   * Importerar data från Supabase
   */
  static importFromSupabase(data: any[]): SSABShift[] {
    return data.map(item => ({
      id: item.id || `${item.team_name}-${item.start_time.split('T')[0]}`,
      title: item.title,
      startTime: new Date(item.start_time),
      endTime: new Date(item.end_time),
      shiftType: item.shift_type,
      teamName: item.team_name,
      teamColor: item.team_color,
      cycleDay: item.cycle_day,
      isGenerated: item.is_generated
    }));
  }
}

// Exempel på användning:
export const SSABExample = {
  // Generera skift för 2025
  generate2025Shifts: () => {
    return SSABOxelosundShiftSystem.generateShifts(
      new Date('2025-01-01'),
      new Date('2025-12-31')
    );
  },

  // Hämta skift för specifikt lag
  getTeamShifts: (teamName: string) => {
    return SSABOxelosundShiftSystem.getShifts(
      new Date('2025-01-01'),
      new Date('2025-01-31'),
      teamName
    );
  },

  // Beräkna statistik
  getStats: () => {
    return SSABOxelosundShiftSystem.getStats(
      new Date('2025-01-01'),
      new Date('2025-01-31')
    );
  },

  // Validera regler
  validateRules: () => {
    return SSABOxelosundShiftSystem.validateRules(
      new Date('2023-01-01'),
      new Date('2025-12-31')
    );
  }
};

// Export för Loveable
export default SSABOxelosundShiftSystem; 