/**
 * Schedule Generator Service - Long-term SSAB shift scheduling (2022-2040)
 * Generates accurate shift schedules with team color coding
 */

const fs = require('fs').promises;
const path = require('path');

class ScheduleGeneratorService {
  constructor() {
    this.ssabTeams = {
      31: { name: 'Team 31', color: '#4CAF50', startDate: '2022-01-01' },
      32: { name: 'Team 32', color: '#2196F3', startDate: '2022-01-01' },
      33: { name: 'Team 33', color: '#FF9800', startDate: '2022-01-01' },
      34: { name: 'Team 34', color: '#9C27B0', startDate: '2022-01-01' },
      35: { name: 'Team 35', color: '#F44336', startDate: '2022-01-01' }
    };

    // SSAB Oxelösund 5-team continuous shift pattern (21-day cycle)
    this.shiftPattern = [
      'F', 'F', 'F', 'E', 'E', 'E', 'N', 'N', 'N', 'N', 
      'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L', 'L'
    ];

    this.shiftTypes = {
      'F': { 
        name: 'Förmiddag', 
        time: '06:00-14:00', 
        duration: 8,
        description: 'Morning shift'
      },
      'E': { 
        name: 'Eftermiddag', 
        time: '14:00-22:00', 
        duration: 8,
        description: 'Afternoon shift'
      },
      'N': { 
        name: 'Natt', 
        time: '22:00-06:00', 
        duration: 8,
        description: 'Night shift'
      },
      'L': { 
        name: 'Ledigt', 
        time: null, 
        duration: 0,
        description: 'Day off'
      }
    };

    // Team rotation offsets (days each team is ahead in the pattern)
    this.teamOffsets = {
      31: 0,   // Base team
      32: 4,   // 4 days ahead
      33: 8,   // 8 days ahead  
      34: 12,  // 12 days ahead
      35: 16   // 16 days ahead
    };

    this.dateRange = {
      start: new Date('2022-01-01'),
      end: new Date('2040-12-31')
    };
  }

  /**
   * Calculate shift for a specific team on a specific date
   */
  getShiftForDate(teamNumber, date) {
    const targetDate = new Date(date);
    const baseDate = new Date('2022-01-01'); // Reference date
    
    // Calculate days since base date
    const daysSinceBase = Math.floor((targetDate - baseDate) / (1000 * 60 * 60 * 24));
    
    // Apply team offset
    const offset = this.teamOffsets[teamNumber] || 0;
    const adjustedDays = daysSinceBase + offset;
    
    // Get position in 21-day cycle
    const cyclePosition = ((adjustedDays % 21) + 21) % 21; // Handle negative numbers
    
    const shiftType = this.shiftPattern[cyclePosition];
    const teamInfo = this.ssabTeams[teamNumber];
    const shiftInfo = this.shiftTypes[shiftType];

    return {
      date: targetDate.toISOString().split('T')[0],
      team: teamNumber,
      teamName: teamInfo?.name || `Team ${teamNumber}`,
      teamColor: teamInfo?.color || '#757575',
      shiftType: shiftType,
      shiftName: shiftInfo.name,
      shiftTime: shiftInfo.time,
      shiftDuration: shiftInfo.duration,
      isWorkingDay: shiftType !== 'L',
      cycleDay: cyclePosition + 1,
      daysSinceBase: daysSinceBase
    };
  }

  /**
   * Generate schedule for a team within a date range
   */
  generateTeamSchedule(teamNumber, startDate, endDate) {
    const schedule = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    while (current <= end) {
      const shift = this.getShiftForDate(teamNumber, current);
      schedule.push(shift);
      current.setDate(current.getDate() + 1);
    }

    return {
      team: teamNumber,
      teamName: this.ssabTeams[teamNumber]?.name || `Team ${teamNumber}`,
      teamColor: this.ssabTeams[teamNumber]?.color || '#757575',
      dateRange: {
        start: startDate,
        end: endDate
      },
      schedule: schedule,
      statistics: this.calculateScheduleStatistics(schedule)
    };
  }

  /**
   * Generate monthly calendar for a specific team and month
   */
  generateMonthlyCalendar(teamNumber, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    
    const schedule = this.generateTeamSchedule(
      teamNumber, 
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    // Create calendar grid (6 weeks x 7 days)
    const calendar = {
      year: year,
      month: month,
      monthName: startDate.toLocaleString('sv-SE', { month: 'long' }),
      team: teamNumber,
      teamName: schedule.teamName,
      teamColor: schedule.teamColor,
      weeks: [],
      statistics: schedule.statistics
    };

    // Get first day of month and calculate starting position
    const firstDay = startDate.getDay();
    const startOfWeek = firstDay === 0 ? 6 : firstDay - 1; // Monday = 0

    // Create 6 weeks
    for (let week = 0; week < 6; week++) {
      const weekData = {
        weekNumber: this.getWeekNumber(new Date(startDate.getTime() + (week * 7 - startOfWeek) * 24 * 60 * 60 * 1000)),
        days: []
      };

      // Create 7 days per week
      for (let day = 0; day < 7; day++) {
        const dayOffset = week * 7 + day - startOfWeek;
        const currentDate = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
        
        if (currentDate.getMonth() === month - 1) {
          // Day belongs to current month
          const shift = this.getShiftForDate(teamNumber, currentDate);
          weekData.days.push({
            ...shift,
            dayOfMonth: currentDate.getDate(),
            isCurrentMonth: true,
            weekday: currentDate.toLocaleString('sv-SE', { weekday: 'short' })
          });
        } else {
          // Day belongs to previous/next month
          weekData.days.push({
            date: currentDate.toISOString().split('T')[0],
            dayOfMonth: currentDate.getDate(),
            isCurrentMonth: false,
            shiftType: null,
            weekday: currentDate.toLocaleString('sv-SE', { weekday: 'short' })
          });
        }
      }
      
      calendar.weeks.push(weekData);
    }

    return calendar;
  }

  /**
   * Generate yearly overview for a specific team
   */
  generateYearlyCalendar(teamNumber, year) {
    const yearSchedule = {
      year: year,
      team: teamNumber,
      teamName: this.ssabTeams[teamNumber]?.name || `Team ${teamNumber}`,
      teamColor: this.ssabTeams[teamNumber]?.color || '#757575',
      months: [],
      statistics: {
        totalWorkingDays: 0,
        totalRestDays: 0,
        shiftBreakdown: { F: 0, E: 0, N: 0, L: 0 },
        totalHours: 0
      }
    };

    // Generate each month
    for (let month = 1; month <= 12; month++) {
      const monthlyCalendar = this.generateMonthlyCalendar(teamNumber, year, month);
      yearSchedule.months.push({
        month: month,
        monthName: monthlyCalendar.monthName,
        statistics: monthlyCalendar.statistics,
        // Simplified month view - just shift types per day
        days: monthlyCalendar.weeks.flatMap(week => 
          week.days.filter(day => day.isCurrentMonth)
            .map(day => ({
              date: day.date,
              dayOfMonth: day.dayOfMonth,
              shiftType: day.shiftType,
              isWorkingDay: day.isWorkingDay
            }))
        )
      });

      // Accumulate yearly statistics
      const monthStats = monthlyCalendar.statistics;
      yearSchedule.statistics.totalWorkingDays += monthStats.workingDays;
      yearSchedule.statistics.totalRestDays += monthStats.restDays;
      yearSchedule.statistics.totalHours += monthStats.totalHours;
      
      Object.keys(monthStats.shiftBreakdown).forEach(shiftType => {
        yearSchedule.statistics.shiftBreakdown[shiftType] += monthStats.shiftBreakdown[shiftType];
      });
    }

    return yearSchedule;
  }

  /**
   * Generate all teams schedule for comparison
   */
  generateAllTeamsComparison(year, month) {
    const comparison = {
      year: year,
      month: month,
      monthName: new Date(year, month - 1, 1).toLocaleString('sv-SE', { month: 'long' }),
      teams: {}
    };

    // Generate schedule for each team
    Object.keys(this.ssabTeams).forEach(teamNumber => {
      const teamNum = parseInt(teamNumber);
      comparison.teams[teamNum] = this.generateMonthlyCalendar(teamNum, year, month);
    });

    return comparison;
  }

  /**
   * Get shift pattern for educational purposes
   */
  getShiftPatternInfo() {
    return {
      patternLength: this.shiftPattern.length,
      pattern: this.shiftPattern,
      shiftTypes: this.shiftTypes,
      teams: this.ssabTeams,
      teamOffsets: this.teamOffsets,
      description: 'SSAB Oxelösund 5-team continuous shift system with 21-day cycle',
      workingDaysPerCycle: this.shiftPattern.filter(shift => shift !== 'L').length,
      restDaysPerCycle: this.shiftPattern.filter(shift => shift === 'L').length
    };
  }

  /**
   * Calculate statistics for a schedule
   */
  calculateScheduleStatistics(schedule) {
    const stats = {
      totalDays: schedule.length,
      workingDays: 0,
      restDays: 0,
      shiftBreakdown: { F: 0, E: 0, N: 0, L: 0 },
      totalHours: 0,
      averageHoursPerWeek: 0,
      longestWorkStreak: 0,
      longestRestStreak: 0
    };

    let currentWorkStreak = 0;
    let currentRestStreak = 0;
    let maxWorkStreak = 0;
    let maxRestStreak = 0;

    schedule.forEach(shift => {
      // Count shift types
      stats.shiftBreakdown[shift.shiftType]++;
      
      // Count working vs rest days
      if (shift.isWorkingDay) {
        stats.workingDays++;
        stats.totalHours += shift.shiftDuration;
        currentWorkStreak++;
        currentRestStreak = 0;
        maxWorkStreak = Math.max(maxWorkStreak, currentWorkStreak);
      } else {
        stats.restDays++;
        currentRestStreak++;
        currentWorkStreak = 0;
        maxRestStreak = Math.max(maxRestStreak, currentRestStreak);
      }
    });

    stats.longestWorkStreak = maxWorkStreak;
    stats.longestRestStreak = maxRestStreak;
    stats.averageHoursPerWeek = (stats.totalHours / stats.totalDays) * 7;

    return stats;
  }

  /**
   * Get ISO week number
   */
  getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  /**
   * Export schedule data
   */
  async exportSchedule(teamNumber, startDate, endDate, format = 'json') {
    const schedule = this.generateTeamSchedule(teamNumber, startDate, endDate);
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      format: format,
      data: schedule,
      metadata: {
        patternInfo: this.getShiftPatternInfo(),
        generatedBy: 'SSAB Schedule Generator Service',
        version: '1.0.0'
      }
    };

    if (format === 'json') {
      return exportData;
    } else if (format === 'csv') {
      return this.convertToCSV(schedule.schedule);
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Convert schedule to CSV format
   */
  convertToCSV(schedule) {
    const headers = ['Date', 'Team', 'Shift Type', 'Shift Name', 'Time', 'Working Day', 'Cycle Day'];
    const rows = schedule.map(shift => [
      shift.date,
      shift.team,
      shift.shiftType,
      shift.shiftName,
      shift.shiftTime || '',
      shift.isWorkingDay ? 'Yes' : 'No',
      shift.cycleDay
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Find specific shift occurrences
   */
  findShiftOccurrences(teamNumber, shiftType, startDate, endDate) {
    const schedule = this.generateTeamSchedule(teamNumber, startDate, endDate);
    
    return schedule.schedule
      .filter(shift => shift.shiftType === shiftType)
      .map(shift => ({
        date: shift.date,
        dayOfWeek: new Date(shift.date).toLocaleString('sv-SE', { weekday: 'long' }),
        cycleDay: shift.cycleDay
      }));
  }

  /**
   * Get next working day for a team
   */
  getNextWorkingDay(teamNumber, fromDate) {
    const current = new Date(fromDate);
    const maxDays = 30; // Safety limit
    
    for (let i = 0; i < maxDays; i++) {
      current.setDate(current.getDate() + 1);
      const shift = this.getShiftForDate(teamNumber, current);
      
      if (shift.isWorkingDay) {
        return shift;
      }
    }
    
    return null;
  }

  /**
   * Get team workload comparison for a period
   */
  compareTeamWorkloads(startDate, endDate) {
    const comparison = {};
    
    Object.keys(this.ssabTeams).forEach(teamNumber => {
      const teamNum = parseInt(teamNumber);
      const schedule = this.generateTeamSchedule(teamNum, startDate, endDate);
      comparison[teamNum] = {
        team: teamNum,
        teamName: schedule.teamName,
        teamColor: schedule.teamColor,
        statistics: schedule.statistics
      };
    });

    return {
      dateRange: { startDate, endDate },
      teams: comparison,
      summary: {
        totalTeams: Object.keys(comparison).length,
        avgWorkingDays: Object.values(comparison).reduce((sum, team) => sum + team.statistics.workingDays, 0) / Object.keys(comparison).length,
        avgTotalHours: Object.values(comparison).reduce((sum, team) => sum + team.statistics.totalHours, 0) / Object.keys(comparison).length
      }
    };
  }
}

module.exports = ScheduleGeneratorService;