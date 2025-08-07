// 🏭 SSAB Oxelösund System - JavaScript Backend Version
class SSABOxelosundSystem {
  // 35-day master cycle
  static MASTER_CYCLE = [
    // Period 1: 3F → 2E → 2N → 5L (12 days)
    'F', 'F', 'F', 'E', 'E', 'N', 'N', 'L', 'L', 'L', 'L', 'L',
    // Period 2: 2F → 3E → 2N → 5L (12 days)
    'F', 'F', 'E', 'E', 'E', 'N', 'N', 'L', 'L', 'L', 'L', 'L',
    // Period 3: 2F → 2E → 3N → 4L (11 days)
    'F', 'F', 'E', 'E', 'N', 'N', 'N', 'L', 'L', 'L', 'L'
  ];

  static TEAM_OFFSETS = {
    31: 0,   // Base team
    32: 7,   // 7 days offset
    33: 14,  // 14 days offset
    34: 21,  // 21 days offset
    35: 28   // 28 days offset
  };

  static BASE_DATE = new Date('2023-01-01');

  static SHIFT_TIMES = {
    F: { start: '06:00', end: '14:00', name: 'Förmiddag' },
    E: { start: '14:00', end: '22:00', name: 'Eftermiddag' },
    N: { start: '22:00', end: '06:00', name: 'Natt' },
    L: { start: '', end: '', name: 'Ledig' }
  };

  static SWEDISH_DAYS = [
    'söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'
  ];

  static SWEDISH_MONTHS = [
    'januari', 'februari', 'mars', 'april', 'maj', 'juni',
    'juli', 'augusti', 'september', 'oktober', 'november', 'december'
  ];

  static calculateShiftForDate(date, team) {
    const targetDate = new Date(date);
    const daysSinceBase = Math.floor((targetDate.getTime() - this.BASE_DATE.getTime()) / (1000 * 60 * 60 * 24));
    
    const teamOffset = this.TEAM_OFFSETS[team];
    const adjustedDays = daysSinceBase + teamOffset;
    const cyclePosition = ((adjustedDays % 35) + 35) % 35;
    
    const shiftType = this.MASTER_CYCLE[cyclePosition];
    
    return this.createShift(targetDate, team, shiftType, cyclePosition + 1);
  }

  static createShift(date, team, shiftType, cycleDay) {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = this.SWEDISH_DAYS[date.getDay()];
    const swedishDate = `${date.getDate()} ${this.SWEDISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    
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
      pattern_name: patternName,
      shift_name: this.SHIFT_TIMES[shiftType].name
    };
  }

  static generateSchedule(startDate, endDate) {
    const shifts = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
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

  static getTeamSchedule(team, startDate, endDate) {
    const allShifts = this.generateSchedule(startDate, endDate);
    return allShifts.filter(s => s.team === team);
  }

  static getDayShifts(date) {
    const shifts = [];
    for (const team of [31, 32, 33, 34, 35]) {
      const shift = this.calculateShiftForDate(date, team);
      shifts.push(shift);
    }
    return shifts;
  }

  static getMonthSchedule(year, month) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    
    return this.generateSchedule(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );
  }

  static validateMonth(year, month) {
    const monthShifts = this.getMonthSchedule(year, month);
    const errors = [];
    
    // Group by date
    const shiftsByDate = {};
    monthShifts.forEach(shift => {
      if (!shiftsByDate[shift.date]) shiftsByDate[shift.date] = [];
      shiftsByDate[shift.date].push(shift);
    });
    
    // Validate each day
    Object.entries(shiftsByDate).forEach(([date, dayShifts]) => {
      const workingShifts = dayShifts.filter(s => s.type !== 'L');
      const types = workingShifts.map(s => s.type);
      
      if (workingShifts.length !== 3) {
        errors.push(`${date}: ${workingShifts.length} lag arbetar istället för 3`);
      }
      
      ['F', 'E', 'N'].forEach(type => {
        if (!types.includes(type)) {
          errors.push(`${date}: Saknar ${type} skift`);
        }
      });
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      totalDays: Object.keys(shiftsByDate).length
    };
  }

  static getNextShift(team) {
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0];
    const currentHour = today.getHours();
    
    // Check if there's a shift later today
    const todayShift = this.calculateShiftForDate(currentDate, team);
    if (todayShift.type !== 'L') {
      const shiftStart = parseInt(todayShift.start_time.split(':')[0]);
      if (currentHour < shiftStart) {
        return todayShift;
      }
    }
    
    // Look for next work shift in the coming days
    for (let i = 1; i <= 35; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      const dateStr = futureDate.toISOString().split('T')[0];
      
      const shift = this.calculateShiftForDate(dateStr, team);
      if (shift.type !== 'L') {
        return shift;
      }
    }
    
    return null;
  }

  static getCountdownToShift(shift) {
    if (!shift || shift.type === 'L') return null;
    
    const now = new Date();
    const shiftDateTime = new Date(`${shift.date}T${shift.start_time}:00`);
    const diffMs = shiftDateTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return null;
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      days,
      hours,
      minutes,
      total_hours: Math.floor(diffMs / (1000 * 60 * 60)),
      formatted: `${days}d ${hours}h ${minutes}m`
    };
  }

  static getCurrentShiftTime(hour) {
    if (hour >= 6 && hour < 14) return 'F';
    if (hour >= 14 && hour < 22) return 'E';
    return 'N';
  }

  static getCurrentStatus(date, currentHour) {
    const dayShifts = this.getDayShifts(date);
    const currentShiftTime = this.getCurrentShiftTime(currentHour);
    
    return dayShifts.map(shift => ({
      team: shift.team,
      shift_type: shift.type,
      is_working: shift.type !== 'L',
      is_current_shift: shift.type === currentShiftTime,
      start_time: shift.start_time,
      end_time: shift.end_time,
      pattern: shift.pattern_name
    }));
  }

  static getMonthStatistics(monthShifts) {
    const stats = {
      total_shifts: monthShifts.length,
      work_shifts: 0,
      free_days: 0,
      teams: {}
    };
    
    [31, 32, 33, 34, 35].forEach(team => {
      const teamShifts = monthShifts.filter(s => s.team === team);
      const workShifts = teamShifts.filter(s => s.type !== 'L');
      
      stats.teams[team] = {
        total_days: teamShifts.length,
        work_days: workShifts.length,
        free_days: teamShifts.filter(s => s.type === 'L').length,
        work_hours: workShifts.length * 8,
        shift_distribution: {
          F: teamShifts.filter(s => s.type === 'F').length,
          E: teamShifts.filter(s => s.type === 'E').length,
          N: teamShifts.filter(s => s.type === 'N').length
        }
      };
      
      stats.work_shifts += workShifts.length;
      stats.free_days += teamShifts.filter(s => s.type === 'L').length;
    });
    
    return stats;
  }

  static getTeamStatistics(team, year, month) {
    const monthShifts = this.getMonthSchedule(year, month);
    const teamShifts = monthShifts.filter(s => s.team === team);
    const workShifts = teamShifts.filter(s => s.type !== 'L');
    
    return {
      period: `${year}-${month.toString().padStart(2, '0')}`,
      total_days: teamShifts.length,
      work_days: workShifts.length,
      free_days: teamShifts.filter(s => s.type === 'L').length,
      work_hours: workShifts.length * 8,
      shift_distribution: {
        F: teamShifts.filter(s => s.type === 'F').length,
        E: teamShifts.filter(s => s.type === 'E').length,
        N: teamShifts.filter(s => s.type === 'N').length
      },
      upcoming_shifts: teamShifts.slice(0, 7).map(s => ({
        date: s.date,
        type: s.type,
        start_time: s.start_time,
        end_time: s.end_time,
        day_of_week: s.day_of_week
      }))
    };
  }

  static exportTeamCSV(team, startDate, endDate) {
    const teamShifts = this.getTeamSchedule(team, startDate, endDate);
    
    const headers = ['Datum', 'Veckodag', 'Skifttyp', 'Starttid', 'Sluttid', 'Mönster'];
    const rows = teamShifts.map(shift => [
      shift.date,
      shift.day_of_week,
      shift.type,
      shift.start_time,
      shift.end_time,
      shift.pattern_name
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

module.exports = SSABOxelosundSystem;