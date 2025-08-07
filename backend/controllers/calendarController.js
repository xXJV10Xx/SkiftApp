/**
 * Calendar Controller - Long-term schedule generation and calendar views
 */

const ScheduleGeneratorService = require('../services/scheduleGeneratorService');

class CalendarController {
  constructor() {
    this.scheduleGenerator = new ScheduleGeneratorService();
  }

  // Get monthly calendar view
  static async getMonthlyCalendar(req, res) {
    try {
      const { team, year, month } = req.params;
      const teamNumber = parseInt(team);
      const yearNumber = parseInt(year);
      const monthNumber = parseInt(month);

      // Validate inputs
      if (teamNumber < 31 || teamNumber > 35) {
        return res.status(400).json({
          error: 'Invalid team number. Must be between 31-35',
          code: 'INVALID_TEAM'
        });
      }

      if (yearNumber < 2022 || yearNumber > 2040) {
        return res.status(400).json({
          error: 'Invalid year. Must be between 2022-2040',
          code: 'INVALID_YEAR'
        });
      }

      if (monthNumber < 1 || monthNumber > 12) {
        return res.status(400).json({
          error: 'Invalid month. Must be between 1-12',
          code: 'INVALID_MONTH'
        });
      }

      const controller = new CalendarController();
      const calendar = controller.scheduleGenerator.generateMonthlyCalendar(
        teamNumber, 
        yearNumber, 
        monthNumber
      );

      res.json({
        success: true,
        calendar: calendar,
        metadata: {
          generatedAt: new Date().toISOString(),
          patternInfo: controller.scheduleGenerator.getShiftPatternInfo()
        }
      });

    } catch (error) {
      console.error('Error generating monthly calendar:', error);
      res.status(500).json({
        error: 'Failed to generate monthly calendar',
        code: 'CALENDAR_GENERATION_ERROR'
      });
    }
  }

  // Get yearly calendar overview
  static async getYearlyCalendar(req, res) {
    try {
      const { team, year } = req.params;
      const teamNumber = parseInt(team);
      const yearNumber = parseInt(year);

      // Validate inputs
      if (teamNumber < 31 || teamNumber > 35) {
        return res.status(400).json({
          error: 'Invalid team number. Must be between 31-35',
          code: 'INVALID_TEAM'
        });
      }

      if (yearNumber < 2022 || yearNumber > 2040) {
        return res.status(400).json({
          error: 'Invalid year. Must be between 2022-2040',
          code: 'INVALID_YEAR'
        });
      }

      const controller = new CalendarController();
      const yearlyCalendar = controller.scheduleGenerator.generateYearlyCalendar(
        teamNumber, 
        yearNumber
      );

      res.json({
        success: true,
        calendar: yearlyCalendar,
        metadata: {
          generatedAt: new Date().toISOString(),
          patternInfo: controller.scheduleGenerator.getShiftPatternInfo()
        }
      });

    } catch (error) {
      console.error('Error generating yearly calendar:', error);
      res.status(500).json({
        error: 'Failed to generate yearly calendar',
        code: 'YEARLY_CALENDAR_ERROR'
      });
    }
  }

  // Compare all teams for a specific month
  static async getAllTeamsComparison(req, res) {
    try {
      const { year, month } = req.params;
      const yearNumber = parseInt(year);
      const monthNumber = parseInt(month);

      // Validate inputs
      if (yearNumber < 2022 || yearNumber > 2040) {
        return res.status(400).json({
          error: 'Invalid year. Must be between 2022-2040',
          code: 'INVALID_YEAR'
        });
      }

      if (monthNumber < 1 || monthNumber > 12) {
        return res.status(400).json({
          error: 'Invalid month. Must be between 1-12',
          code: 'INVALID_MONTH'
        });
      }

      const controller = new CalendarController();
      const comparison = controller.scheduleGenerator.generateAllTeamsComparison(
        yearNumber, 
        monthNumber
      );

      res.json({
        success: true,
        comparison: comparison,
        metadata: {
          generatedAt: new Date().toISOString(),
          totalTeams: Object.keys(comparison.teams).length
        }
      });

    } catch (error) {
      console.error('Error generating team comparison:', error);
      res.status(500).json({
        error: 'Failed to generate team comparison',
        code: 'TEAM_COMPARISON_ERROR'
      });
    }
  }

  // Get schedule for a specific date range
  static async getScheduleRange(req, res) {
    try {
      const { team } = req.params;
      const { startDate, endDate } = req.query;
      const teamNumber = parseInt(team);

      // Validate team
      if (teamNumber < 31 || teamNumber > 35) {
        return res.status(400).json({
          error: 'Invalid team number. Must be between 31-35',
          code: 'INVALID_TEAM'
        });
      }

      // Validate dates
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Start date and end date are required',
          code: 'MISSING_DATES'
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format. Use YYYY-MM-DD',
          code: 'INVALID_DATE_FORMAT'
        });
      }

      if (start > end) {
        return res.status(400).json({
          error: 'Start date must be before end date',
          code: 'INVALID_DATE_RANGE'
        });
      }

      // Check date range limits
      const minDate = new Date('2022-01-01');
      const maxDate = new Date('2040-12-31');
      
      if (start < minDate || end > maxDate) {
        return res.status(400).json({
          error: 'Date range must be between 2022-01-01 and 2040-12-31',
          code: 'DATE_OUT_OF_RANGE'
        });
      }

      const controller = new CalendarController();
      const schedule = controller.scheduleGenerator.generateTeamSchedule(
        teamNumber, 
        startDate, 
        endDate
      );

      res.json({
        success: true,
        schedule: schedule,
        metadata: {
          generatedAt: new Date().toISOString(),
          requestedRange: { startDate, endDate },
          totalDays: schedule.schedule.length
        }
      });

    } catch (error) {
      console.error('Error generating schedule range:', error);
      res.status(500).json({
        error: 'Failed to generate schedule range',
        code: 'SCHEDULE_RANGE_ERROR'
      });
    }
  }

  // Get shift for a specific date
  static async getShiftForDate(req, res) {
    try {
      const { team, date } = req.params;
      const teamNumber = parseInt(team);

      // Validate team
      if (teamNumber < 31 || teamNumber > 35) {
        return res.status(400).json({
          error: 'Invalid team number. Must be between 31-35',
          code: 'INVALID_TEAM'
        });
      }

      // Validate date
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format. Use YYYY-MM-DD',
          code: 'INVALID_DATE_FORMAT'
        });
      }

      const controller = new CalendarController();
      const shift = controller.scheduleGenerator.getShiftForDate(teamNumber, date);

      res.json({
        success: true,
        shift: shift,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error getting shift for date:', error);
      res.status(500).json({
        error: 'Failed to get shift for date',
        code: 'SHIFT_DATE_ERROR'
      });
    }
  }

  // Get pattern information
  static async getPatternInfo(req, res) {
    try {
      const controller = new CalendarController();
      const patternInfo = controller.scheduleGenerator.getShiftPatternInfo();

      res.json({
        success: true,
        pattern: patternInfo,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error getting pattern info:', error);
      res.status(500).json({
        error: 'Failed to get pattern information',
        code: 'PATTERN_INFO_ERROR'
      });
    }
  }

  // Export schedule data
  static async exportSchedule(req, res) {
    try {
      const { team } = req.params;
      const { startDate, endDate, format = 'json' } = req.query;
      const teamNumber = parseInt(team);

      // Validate inputs
      if (teamNumber < 31 || teamNumber > 35) {
        return res.status(400).json({
          error: 'Invalid team number. Must be between 31-35',
          code: 'INVALID_TEAM'
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Start date and end date are required',
          code: 'MISSING_DATES'
        });
      }

      if (!['json', 'csv'].includes(format)) {
        return res.status(400).json({
          error: 'Invalid format. Supported formats: json, csv',
          code: 'INVALID_FORMAT'
        });
      }

      const controller = new CalendarController();
      const exportData = await controller.scheduleGenerator.exportSchedule(
        teamNumber, 
        startDate, 
        endDate, 
        format
      );

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="team-${teamNumber}-schedule-${startDate}-to-${endDate}.csv"`);
        res.send(exportData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="team-${teamNumber}-schedule-${startDate}-to-${endDate}.json"`);
        res.json(exportData);
      }

    } catch (error) {
      console.error('Error exporting schedule:', error);
      res.status(500).json({
        error: 'Failed to export schedule',
        code: 'EXPORT_ERROR'
      });
    }
  }

  // Find specific shift occurrences
  static async findShiftOccurrences(req, res) {
    try {
      const { team, shiftType } = req.params;
      const { startDate, endDate } = req.query;
      const teamNumber = parseInt(team);

      // Validate inputs
      if (teamNumber < 31 || teamNumber > 35) {
        return res.status(400).json({
          error: 'Invalid team number. Must be between 31-35',
          code: 'INVALID_TEAM'
        });
      }

      if (!['F', 'E', 'N', 'L'].includes(shiftType)) {
        return res.status(400).json({
          error: 'Invalid shift type. Must be F, E, N, or L',
          code: 'INVALID_SHIFT_TYPE'
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Start date and end date are required',
          code: 'MISSING_DATES'
        });
      }

      const controller = new CalendarController();
      const occurrences = controller.scheduleGenerator.findShiftOccurrences(
        teamNumber, 
        shiftType, 
        startDate, 
        endDate
      );

      res.json({
        success: true,
        team: teamNumber,
        shiftType: shiftType,
        dateRange: { startDate, endDate },
        occurrences: occurrences,
        total: occurrences.length,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error finding shift occurrences:', error);
      res.status(500).json({
        error: 'Failed to find shift occurrences',
        code: 'SHIFT_SEARCH_ERROR'
      });
    }
  }

  // Get next working day
  static async getNextWorkingDay(req, res) {
    try {
      const { team } = req.params;
      const { fromDate } = req.query;
      const teamNumber = parseInt(team);

      // Validate team
      if (teamNumber < 31 || teamNumber > 35) {
        return res.status(400).json({
          error: 'Invalid team number. Must be between 31-35',
          code: 'INVALID_TEAM'
        });
      }

      const baseDate = fromDate || new Date().toISOString().split('T')[0];
      
      const controller = new CalendarController();
      const nextWorkingDay = controller.scheduleGenerator.getNextWorkingDay(teamNumber, baseDate);

      if (!nextWorkingDay) {
        return res.status(404).json({
          error: 'No working day found within 30 days',
          code: 'NO_WORKING_DAY_FOUND'
        });
      }

      res.json({
        success: true,
        team: teamNumber,
        fromDate: baseDate,
        nextWorkingDay: nextWorkingDay,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error getting next working day:', error);
      res.status(500).json({
        error: 'Failed to get next working day',
        code: 'NEXT_WORKING_DAY_ERROR'
      });
    }
  }

  // Compare team workloads
  static async compareTeamWorkloads(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Start date and end date are required',
          code: 'MISSING_DATES'
        });
      }

      const controller = new CalendarController();
      const comparison = controller.scheduleGenerator.compareTeamWorkloads(startDate, endDate);

      res.json({
        success: true,
        comparison: comparison,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error comparing team workloads:', error);
      res.status(500).json({
        error: 'Failed to compare team workloads',
        code: 'WORKLOAD_COMPARISON_ERROR'
      });
    }
  }
}

module.exports = CalendarController;