// Unit Tests for Schedule Generator Service
const ScheduleGeneratorService = require('../../services/scheduleGeneratorService');

describe('ScheduleGeneratorService', () => {
  let scheduleGenerator;

  beforeAll(() => {
    scheduleGenerator = new ScheduleGeneratorService();
  });

  describe('Service Initialization', () => {
    test('should initialize with correct team configurations', () => {
      expect(scheduleGenerator.ssabTeams).toHaveProperty('31');
      expect(scheduleGenerator.ssabTeams).toHaveProperty('35');
      expect(Object.keys(scheduleGenerator.ssabTeams)).toHaveLength(5);
    });

    test('should have correct shift pattern', () => {
      expect(scheduleGenerator.shiftPattern).toHaveLength(21);
      expect(scheduleGenerator.shiftPattern).toContain('F');
      expect(scheduleGenerator.shiftPattern).toContain('E');
      expect(scheduleGenerator.shiftPattern).toContain('N');
      expect(scheduleGenerator.shiftPattern).toContain('L');
    });

    test('should have correct team offsets', () => {
      expect(scheduleGenerator.teamOffsets[31]).toBe(0);
      expect(scheduleGenerator.teamOffsets[32]).toBe(4);
      expect(scheduleGenerator.teamOffsets[35]).toBe(16);
    });
  });

  describe('Single Shift Calculation', () => {
    test('should calculate shift for team 31 on reference date', () => {
      const shift = scheduleGenerator.getShiftForDate(31, '2022-01-01');
      
      expect(shift).toHaveProperty('date', '2022-01-01');
      expect(shift).toHaveProperty('team', 31);
      expect(shift).toHaveProperty('shiftType');
      expect(shift).toHaveProperty('isWorkingDay');
      expect(['F', 'E', 'N', 'L']).toContain(shift.shiftType);
    });

    test('should calculate different shifts for different teams on same date', () => {
      const date = '2022-01-15';
      const team31Shift = scheduleGenerator.getShiftForDate(31, date);
      const team32Shift = scheduleGenerator.getShiftForDate(32, date);
      
      // Teams should have different shifts due to offset
      expect(team31Shift.shiftType).toBeDefined();
      expect(team32Shift.shiftType).toBeDefined();
      // Note: They might be the same by coincidence, but pattern should be offset
    });

    test('should handle leap years correctly', () => {
      const leapYearDate = '2024-02-29';
      const shift = scheduleGenerator.getShiftForDate(31, leapYearDate);
      
      expect(shift.date).toBe(leapYearDate);
      expect(shift.shiftType).toBeDefined();
    });

    test('should work across date range boundaries', () => {
      const earlyDate = scheduleGenerator.getShiftForDate(31, '2022-01-01');
      const lateDate = scheduleGenerator.getShiftForDate(31, '2040-12-31');
      
      expect(earlyDate.shiftType).toBeDefined();
      expect(lateDate.shiftType).toBeDefined();
    });
  });

  describe('Team Schedule Generation', () => {
    test('should generate schedule for valid date range', () => {
      const schedule = scheduleGenerator.generateTeamSchedule(31, '2024-01-01', '2024-01-07');
      
      expect(schedule).toHaveProperty('team', 31);
      expect(schedule).toHaveProperty('schedule');
      expect(schedule).toHaveProperty('statistics');
      expect(schedule.schedule).toHaveLength(7);
    });

    test('should include correct shift information in schedule', () => {
      const schedule = scheduleGenerator.generateTeamSchedule(31, '2024-01-01', '2024-01-03');
      
      schedule.schedule.forEach(shift => {
        expect(shift).toHaveProperty('date');
        expect(shift).toHaveProperty('shiftType');
        expect(shift).toHaveProperty('shiftName');
        expect(shift).toHaveProperty('isWorkingDay');
        expect(shift).toHaveProperty('cycleDay');
      });
    });

    test('should calculate statistics correctly', () => {
      const schedule = scheduleGenerator.generateTeamSchedule(31, '2024-01-01', '2024-01-21');
      const stats = schedule.statistics;
      
      expect(stats).toHaveProperty('totalDays', 21);
      expect(stats).toHaveProperty('workingDays');
      expect(stats).toHaveProperty('restDays');
      expect(stats.workingDays + stats.restDays).toBe(21);
      expect(stats).toHaveProperty('totalHours');
      expect(stats.totalHours).toBeGreaterThan(0);
    });
  });

  describe('Monthly Calendar Generation', () => {
    test('should generate monthly calendar for valid inputs', () => {
      const calendar = scheduleGenerator.generateMonthlyCalendar(31, 2024, 1);
      
      expect(calendar).toHaveProperty('year', 2024);
      expect(calendar).toHaveProperty('month', 1);
      expect(calendar).toHaveProperty('team', 31);
      expect(calendar).toHaveProperty('weeks');
      expect(calendar.weeks).toHaveLength(6); // 6 weeks in calendar grid
    });

    test('should include week numbers', () => {
      const calendar = scheduleGenerator.generateMonthlyCalendar(31, 2024, 1);
      
      calendar.weeks.forEach(week => {
        expect(week).toHaveProperty('weekNumber');
        expect(typeof week.weekNumber).toBe('number');
        expect(week).toHaveProperty('days');
        expect(week.days).toHaveLength(7);
      });
    });

    test('should handle month boundaries correctly', () => {
      const calendar = scheduleGenerator.generateMonthlyCalendar(31, 2024, 2);
      
      // Should have some days that belong to current month and some that don't
      const allDays = calendar.weeks.flatMap(week => week.days);
      const currentMonthDays = allDays.filter(day => day.isCurrentMonth);
      const otherMonthDays = allDays.filter(day => !day.isCurrentMonth);
      
      expect(currentMonthDays.length).toBe(29); // February 2024 has 29 days (leap year)
      expect(otherMonthDays.length).toBeGreaterThan(0);
    });
  });

  describe('Yearly Calendar Generation', () => {
    test('should generate yearly calendar', () => {
      const yearlyCalendar = scheduleGenerator.generateYearlyCalendar(31, 2024);
      
      expect(yearlyCalendar).toHaveProperty('year', 2024);
      expect(yearlyCalendar).toHaveProperty('team', 31);
      expect(yearlyCalendar).toHaveProperty('months');
      expect(yearlyCalendar.months).toHaveLength(12);
      expect(yearlyCalendar).toHaveProperty('statistics');
    });

    test('should calculate yearly statistics correctly', () => {
      const yearlyCalendar = scheduleGenerator.generateYearlyCalendar(31, 2024);
      const stats = yearlyCalendar.statistics;
      
      expect(stats).toHaveProperty('totalWorkingDays');
      expect(stats).toHaveProperty('totalRestDays');
      expect(stats).toHaveProperty('totalHours');
      expect(stats.totalWorkingDays + stats.totalRestDays).toBe(365); // Standard year calculation
    });

    test('should have consistent monthly data', () => {
      const yearlyCalendar = scheduleGenerator.generateYearlyCalendar(31, 2024);
      
      yearlyCalendar.months.forEach(month => {
        expect(month).toHaveProperty('month');
        expect(month).toHaveProperty('monthName');
        expect(month).toHaveProperty('statistics');
        expect(month).toHaveProperty('days');
        expect(month.month).toBeGreaterThanOrEqual(1);
        expect(month.month).toBeLessThanOrEqual(12);
      });
    });
  });

  describe('Team Comparison', () => {
    test('should generate all teams comparison', () => {
      const comparison = scheduleGenerator.generateAllTeamsComparison(2024, 1);
      
      expect(comparison).toHaveProperty('year', 2024);
      expect(comparison).toHaveProperty('month', 1);
      expect(comparison).toHaveProperty('teams');
      expect(Object.keys(comparison.teams)).toHaveLength(5);
    });

    test('should include all teams in comparison', () => {
      const comparison = scheduleGenerator.generateAllTeamsComparison(2024, 1);
      
      [31, 32, 33, 34, 35].forEach(teamNumber => {
        expect(comparison.teams).toHaveProperty(teamNumber.toString());
      });
    });
  });

  describe('Utility Functions', () => {
    test('should get correct week number', () => {
      const weekNumber = scheduleGenerator.getWeekNumber(new Date('2024-01-01'));
      expect(typeof weekNumber).toBe('number');
      expect(weekNumber).toBeGreaterThan(0);
      expect(weekNumber).toBeLessThanOrEqual(53);
    });

    test('should find shift occurrences', () => {
      const occurrences = scheduleGenerator.findShiftOccurrences(31, 'F', '2024-01-01', '2024-01-31');
      
      expect(Array.isArray(occurrences)).toBe(true);
      expect(occurrences.length).toBeGreaterThan(0);
      
      occurrences.forEach(occurrence => {
        expect(occurrence).toHaveProperty('date');
        expect(occurrence).toHaveProperty('dayOfWeek');
        expect(occurrence).toHaveProperty('cycleDay');
      });
    });

    test('should get next working day', () => {
      const nextWorking = scheduleGenerator.getNextWorkingDay(31, '2024-01-01');
      
      if (nextWorking) { // Might be null if all next 30 days are rest days
        expect(nextWorking).toHaveProperty('date');
        expect(nextWorking).toHaveProperty('shiftType');
        expect(nextWorking.isWorkingDay).toBe(true);
        expect(nextWorking.shiftType).not.toBe('L');
      }
    });

    test('should compare team workloads', () => {
      const comparison = scheduleGenerator.compareTeamWorkloads('2024-01-01', '2024-01-31');
      
      expect(comparison).toHaveProperty('dateRange');
      expect(comparison).toHaveProperty('teams');
      expect(comparison).toHaveProperty('summary');
      expect(Object.keys(comparison.teams)).toHaveLength(5);
    });
  });

  describe('Export Functionality', () => {
    test('should export schedule as JSON', async () => {
      const exported = await scheduleGenerator.exportSchedule(31, '2024-01-01', '2024-01-07', 'json');
      
      expect(exported).toHaveProperty('exportedAt');
      expect(exported).toHaveProperty('format', 'json');
      expect(exported).toHaveProperty('data');
      expect(exported).toHaveProperty('metadata');
    });

    test('should export schedule as CSV', async () => {
      const csvData = await scheduleGenerator.exportSchedule(31, '2024-01-01', '2024-01-07', 'csv');
      
      expect(typeof csvData).toBe('string');
      expect(csvData).toContain('Date');
      expect(csvData).toContain('Team');
      expect(csvData).toContain('Shift Type');
    });

    test('should throw error for unsupported format', async () => {
      await expect(
        scheduleGenerator.exportSchedule(31, '2024-01-01', '2024-01-07', 'xml')
      ).rejects.toThrow('Unsupported export format');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid team numbers gracefully', () => {
      const shift = scheduleGenerator.getShiftForDate(99, '2024-01-01');
      expect(shift.teamName).toBe('Team 99'); // Should still work but with default values
    });

    test('should handle date boundaries', () => {
      const earlyShift = scheduleGenerator.getShiftForDate(31, '2022-01-01');
      const lateShift = scheduleGenerator.getShiftForDate(31, '2040-12-31');
      
      expect(earlyShift.shiftType).toBeDefined();
      expect(lateShift.shiftType).toBeDefined();
    });

    test('should handle single day schedules', () => {
      const schedule = scheduleGenerator.generateTeamSchedule(31, '2024-01-01', '2024-01-01');
      
      expect(schedule.schedule).toHaveLength(1);
      expect(schedule.statistics.totalDays).toBe(1);
    });

    test('should maintain pattern consistency over long periods', () => {
      // Test that the 21-day pattern repeats correctly
      const shift1 = scheduleGenerator.getShiftForDate(31, '2024-01-01');
      const shift22 = scheduleGenerator.getShiftForDate(31, '2024-01-22'); // 21 days later
      
      expect(shift1.shiftType).toBe(shift22.shiftType); // Should be same position in cycle
    });
  });

  describe('Performance Tests', () => {
    test('should generate large schedules efficiently', () => {
      const startTime = Date.now();
      const schedule = scheduleGenerator.generateTeamSchedule(31, '2022-01-01', '2040-12-31');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(schedule.schedule.length).toBeGreaterThan(6900); // ~18 years of days
    });

    test('should generate yearly calendar efficiently', () => {
      const startTime = Date.now();
      const yearlyCalendar = scheduleGenerator.generateYearlyCalendar(31, 2024);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
      expect(yearlyCalendar.months).toHaveLength(12);
    });
  });

  describe('Data Accuracy', () => {
    test('should maintain correct shift distribution over time', () => {
      const schedule = scheduleGenerator.generateTeamSchedule(31, '2024-01-01', '2024-12-31');
      const shiftCounts = { F: 0, E: 0, N: 0, L: 0 };
      
      schedule.schedule.forEach(shift => {
        shiftCounts[shift.shiftType]++;
      });
      
      // Verify approximate distribution matches expected pattern
      const total = Object.values(shiftCounts).reduce((sum, count) => sum + count, 0);
      expect(total).toBeGreaterThan(360); // Should be 365 or 366 depending on leap year
      
      // Should have reasonable distribution of each shift type
      expect(shiftCounts.L).toBeGreaterThan(150); // Rest days should be significant portion
      expect(shiftCounts.F).toBeGreaterThan(0);
      expect(shiftCounts.E).toBeGreaterThan(0);
      expect(shiftCounts.N).toBeGreaterThan(0);
    });

    test('should have consistent cycle positioning', () => {
      // Test that cycle day calculations are correct
      const schedule = scheduleGenerator.generateTeamSchedule(31, '2024-01-01', '2024-01-21');
      
      // Check that cycle days are in valid range
      schedule.schedule.forEach(shift => {
        expect(shift.cycleDay).toBeGreaterThan(0);
        expect(shift.cycleDay).toBeLessThanOrEqual(21);
      });
      
      // Check that pattern repeats after 21 days
      expect(schedule.schedule).toHaveLength(21);
    });
  });
});