/**
 * Universal Schedule Generator - Multi-company schedule generation service
 * Supports 30+ companies with instant, accurate schedule generation
 */

const CompanyRegistryService = require('./companyRegistryService');

class UniversalScheduleGenerator {
  constructor() {
    this.companyRegistry = new CompanyRegistryService();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.baseDate = new Date('2022-01-01'); // Universal base date
  }

  /**
   * Generate schedule for any company team within date range
   */
  generateSchedule(companyId, teamId, startDate, endDate) {
    const cacheKey = `${companyId}_${teamId}_${startDate}_${endDate}`;
    
    // Check cache first for instant response
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    // Validate date range (2022-2040)
    this._validateDateRange(startDate, endDate);

    // Get company and pattern configuration
    const company = this.companyRegistry.getCompany(companyId);
    if (!company) {
      throw new Error(`Company ${companyId} not found`);
    }

    const pattern = this.companyRegistry.getShiftPattern(company.shiftSystem);
    if (!pattern) {
      throw new Error(`Shift pattern ${company.shiftSystem} not found`);
    }

    // Validate team exists
    if (!company.teams.includes(teamId)) {
      throw new Error(`Team ${teamId} not found in company ${company.name}`);
    }

    // Generate schedule
    const schedule = this._calculateScheduleForDateRange(
      company, pattern, teamId, startDate, endDate
    );

    const result = {
      company: {
        id: company.id,
        name: company.name,
        industry: company.industry,
        location: company.location
      },
      team: {
        id: teamId,
        name: teamId,
        color: company.colors[teamId] || '#808080'
      },
      pattern: {
        name: pattern.name,
        cycleLength: pattern.cycleLength,
        workingDaysPerCycle: pattern.workingDaysPerCycle
      },
      schedule: schedule.shifts,
      statistics: schedule.statistics,
      metadata: {
        dateRange: { startDate, endDate },
        totalDays: schedule.shifts.length,
        generatedAt: new Date().toISOString(),
        cacheKey
      }
    };

    // Cache result
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * Generate monthly calendar for any company team
   */
  generateMonthlyCalendar(companyId, teamId, year, month) {
    const company = this.companyRegistry.getCompany(companyId);
    if (!company) {
      throw new Error(`Company ${companyId} not found`);
    }

    const pattern = this.companyRegistry.getShiftPattern(company.shiftSystem);
    if (!pattern) {
      throw new Error(`Shift pattern ${company.shiftSystem} not found`);
    }

    // Calculate month boundaries
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Generate calendar grid (6 weeks)
    const weeks = [];
    const firstDay = new Date(startDate);
    firstDay.setDate(firstDay.getDate() - firstDay.getDay()); // Start from Sunday

    for (let week = 0; week < 6; week++) {
      const weekData = {
        weekNumber: this._getWeekNumber(new Date(firstDay.getTime() + week * 7 * 24 * 60 * 60 * 1000)),
        days: []
      };

      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(firstDay);
        currentDate.setDate(firstDay.getDate() + week * 7 + day);
        
        const isCurrentMonth = currentDate.getMonth() === month - 1;
        const shift = isCurrentMonth ? 
          this._calculateShiftForDate(pattern, teamId, currentDate) : 
          null;

        weekData.days.push({
          date: currentDate.toISOString().split('T')[0],
          day: currentDate.getDate(),
          dayOfWeek: currentDate.getDay(),
          isCurrentMonth,
          shift: shift ? {
            type: shift.shiftType,
            name: shift.shiftName,
            time: shift.shiftTime,
            isWorkingDay: shift.isWorkingDay,
            cycleDay: shift.cycleDay
          } : null
        });
      }
      weeks.push(weekData);
    }

    // Calculate month statistics
    const monthSchedule = this.generateSchedule(
      companyId, teamId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    return {
      company: monthSchedule.company,
      team: monthSchedule.team,
      year,
      month,
      monthName: startDate.toLocaleDateString('sv-SE', { month: 'long' }),
      weeks,
      statistics: monthSchedule.statistics,
      metadata: {
        generatedAt: new Date().toISOString(),
        daysInMonth: endDate.getDate()
      }
    };
  }

  /**
   * Generate yearly overview for any company team
   */
  generateYearlyCalendar(companyId, teamId, year) {
    const company = this.companyRegistry.getCompany(companyId);
    if (!company) {
      throw new Error(`Company ${companyId} not found`);
    }

    const months = [];
    let yearlyStats = {
      totalWorkingDays: 0,
      totalRestDays: 0,
      totalHours: 0,
      shiftBreakdown: {}
    };

    // Generate each month
    for (let month = 1; month <= 12; month++) {
      const monthData = this.generateMonthlyCalendar(companyId, teamId, year, month);
      
      months.push({
        month,
        monthName: monthData.monthName,
        statistics: monthData.statistics,
        days: monthData.weeks.flatMap(week => 
          week.days.filter(day => day.isCurrentMonth && day.shift)
            .map(day => ({
              date: day.date,
              shift: day.shift
            }))
        )
      });

      // Accumulate yearly statistics
      yearlyStats.totalWorkingDays += monthData.statistics.workingDays;
      yearlyStats.totalRestDays += monthData.statistics.restDays;
      yearlyStats.totalHours += monthData.statistics.totalHours;

      // Merge shift breakdowns
      Object.entries(monthData.statistics.shiftBreakdown).forEach(([type, count]) => {
        yearlyStats.shiftBreakdown[type] = (yearlyStats.shiftBreakdown[type] || 0) + count;
      });
    }

    return {
      company: months[0].company,
      team: months[0].team,
      year,
      months,
      statistics: yearlyStats,
      metadata: {
        generatedAt: new Date().toISOString(),
        isLeapYear: this._isLeapYear(year)
      }
    };
  }

  /**
   * Generate multi-company comparison
   */
  generateMultiCompanyComparison(companyIds, teamMappings, year, month) {
    const comparisons = {};
    
    companyIds.forEach(companyId => {
      const teamId = teamMappings[companyId] || 'default';
      try {
        const monthlyData = this.generateMonthlyCalendar(companyId, teamId, year, month);
        comparisons[companyId] = {
          company: monthlyData.company,
          team: monthlyData.team,
          statistics: monthlyData.statistics,
          pattern: this.companyRegistry.getShiftPattern(
            this.companyRegistry.getCompany(companyId).shiftSystem
          )
        };
      } catch (error) {
        comparisons[companyId] = {
          error: error.message
        };
      }
    });

    return {
      year,
      month,
      monthName: new Date(year, month - 1).toLocaleDateString('sv-SE', { month: 'long' }),
      companies: comparisons,
      summary: this._calculateComparisonSummary(comparisons),
      metadata: {
        generatedAt: new Date().toISOString(),
        companiesCompared: companyIds.length
      }
    };
  }

  /**
   * Get shift for specific date
   */
  getShiftForDate(companyId, teamId, date) {
    // Validate single date
    this._validateDateRange(date, date);
    
    const company = this.companyRegistry.getCompany(companyId);
    if (!company) {
      throw new Error(`Company ${companyId} not found`);
    }

    const pattern = this.companyRegistry.getShiftPattern(company.shiftSystem);
    if (!pattern) {
      throw new Error(`Shift pattern ${company.shiftSystem} not found`);
    }

    const targetDate = new Date(date);
    const shift = this._calculateShiftForDate(pattern, teamId, targetDate);

    return {
      company: {
        id: company.id,
        name: company.name
      },
      team: {
        id: teamId,
        name: teamId,
        color: company.colors[teamId] || '#808080'
      },
      date,
      shift,
      metadata: {
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Batch generate schedules for multiple teams/companies
   */
  batchGenerate(requests) {
    const results = [];
    
    requests.forEach((request, index) => {
      try {
        const result = this.generateSchedule(
          request.companyId,
          request.teamId,
          request.startDate,
          request.endDate
        );
        results.push({ index, success: true, data: result });
      } catch (error) {
        results.push({ 
          index, 
          success: false, 
          error: error.message,
          request 
        });
      }
    });

    return {
      results,
      summary: {
        total: requests.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime: Date.now()
      }
    };
  }

  /**
   * Export schedule in various formats
   */
  async exportSchedule(companyId, teamId, startDate, endDate, format = 'json') {
    const scheduleData = this.generateSchedule(companyId, teamId, startDate, endDate);
    
    switch (format.toLowerCase()) {
      case 'json':
        return {
          format: 'json',
          filename: `${companyId}_${teamId}_${startDate}_${endDate}.json`,
          data: scheduleData,
          exportedAt: new Date().toISOString()
        };
        
      case 'csv':
        const csvData = this._convertToCSV(scheduleData);
        return {
          format: 'csv',
          filename: `${companyId}_${teamId}_${startDate}_${endDate}.csv`,
          data: csvData,
          exportedAt: new Date().toISOString()
        };
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Private helper methods
  _calculateScheduleForDateRange(company, pattern, teamId, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const shifts = [];
    const statistics = {
      totalDays: 0,
      workingDays: 0,
      restDays: 0,
      totalHours: 0,
      shiftBreakdown: {},
      longestWorkStreak: 0,
      longestRestStreak: 0
    };

    let currentWorkStreak = 0;
    let currentRestStreak = 0;
    let maxWorkStreak = 0;
    let maxRestStreak = 0;

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const shift = this._calculateShiftForDate(pattern, teamId, date);
      shifts.push(shift);
      
      statistics.totalDays++;
      
      if (shift.isWorkingDay) {
        statistics.workingDays++;
        statistics.totalHours += shift.hours;
        currentWorkStreak++;
        currentRestStreak = 0;
        maxWorkStreak = Math.max(maxWorkStreak, currentWorkStreak);
      } else {
        statistics.restDays++;
        currentRestStreak++;
        currentWorkStreak = 0;
        maxRestStreak = Math.max(maxRestStreak, currentRestStreak);
      }

      // Count shift types
      statistics.shiftBreakdown[shift.shiftType] = 
        (statistics.shiftBreakdown[shift.shiftType] || 0) + 1;
    }

    statistics.longestWorkStreak = maxWorkStreak;
    statistics.longestRestStreak = maxRestStreak;
    statistics.averageHoursPerWeek = Math.round((statistics.totalHours / statistics.totalDays) * 7);

    return { shifts, statistics };
  }

  _calculateShiftForDate(pattern, teamId, date) {
    const daysSinceBase = Math.floor((date - this.baseDate) / (1000 * 60 * 60 * 24));
    const teamOffset = pattern.teamOffsets[teamId] || 0;
    const adjustedDays = daysSinceBase + teamOffset;
    const cyclePosition = ((adjustedDays % pattern.cycleLength) + pattern.cycleLength) % pattern.cycleLength;
    const shiftType = pattern.pattern[cyclePosition];
    const shiftInfo = pattern.shiftTimes[shiftType];

    return {
      date: date.toISOString().split('T')[0],
      dayOfWeek: date.toLocaleDateString('sv-SE', { weekday: 'long' }),
      shiftType,
      shiftName: shiftInfo.name,
      shiftTime: shiftInfo.start && shiftInfo.end ? `${shiftInfo.start}-${shiftInfo.end}` : null,
      hours: shiftInfo.hours,
      isWorkingDay: shiftType !== 'L',
      cycleDay: cyclePosition + 1,
      teamOffset
    };
  }

  _getWeekNumber(date) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
  }

  _isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  _calculateComparisonSummary(comparisons) {
    const validComparisons = Object.values(comparisons).filter(c => !c.error);
    
    if (validComparisons.length === 0) {
      return { error: 'No valid comparisons available' };
    }

    const summary = {
      averageWorkingDays: 0,
      averageRestDays: 0,
      averageHours: 0,
      mostWorkingDays: { company: '', days: 0 },
      leastWorkingDays: { company: '', days: Infinity },
      patternVariety: new Set()
    };

    validComparisons.forEach(comp => {
      const stats = comp.statistics;
      summary.averageWorkingDays += stats.workingDays;
      summary.averageRestDays += stats.restDays;
      summary.averageHours += stats.totalHours;
      
      if (stats.workingDays > summary.mostWorkingDays.days) {
        summary.mostWorkingDays = { company: comp.company.name, days: stats.workingDays };
      }
      
      if (stats.workingDays < summary.leastWorkingDays.days) {
        summary.leastWorkingDays = { company: comp.company.name, days: stats.workingDays };
      }

      if (comp.pattern) {
        summary.patternVariety.add(comp.pattern.name);
      }
    });

    const count = validComparisons.length;
    summary.averageWorkingDays = Math.round(summary.averageWorkingDays / count);
    summary.averageRestDays = Math.round(summary.averageRestDays / count);
    summary.averageHours = Math.round(summary.averageHours / count);
    summary.patternVariety = Array.from(summary.patternVariety);

    return summary;
  }

  _convertToCSV(scheduleData) {
    const headers = ['Date', 'Day of Week', 'Shift Type', 'Shift Name', 'Shift Time', 'Hours', 'Working Day', 'Cycle Day'];
    const rows = [headers.join(',')];

    scheduleData.schedule.forEach(shift => {
      const row = [
        shift.date,
        `"${shift.dayOfWeek}"`,
        shift.shiftType,
        `"${shift.shiftName}"`,
        shift.shiftTime || '',
        shift.hours,
        shift.isWorkingDay ? 'Yes' : 'No',
        shift.cycleDay
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  // Performance and cache management
  clearCache() {
    this.cache.clear();
  }

  getCacheSize() {
    return this.cache.size;
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }

  // Private helper methods
  _validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const minDate = new Date('2022-01-01');
    const maxDate = new Date('2040-12-31');

    // Check date format
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    // Check date range
    if (start < minDate || end > maxDate) {
      throw new Error('Date range must be between 2022-01-01 and 2040-12-31');
    }

    // Check start <= end
    if (start > end) {
      throw new Error('Start date must be before or equal to end date');
    }

    // Check maximum range (2 years)
    const maxRange = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years in milliseconds
    if (end - start > maxRange) {
      throw new Error('Date range cannot exceed 2 years');
    }
  }
}

module.exports = UniversalScheduleGenerator;