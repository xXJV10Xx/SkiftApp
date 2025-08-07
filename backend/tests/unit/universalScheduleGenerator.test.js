/**
 * Universal Schedule Generator Tests
 * Comprehensive testing for multi-company schedule generation
 */

const UniversalScheduleGenerator = require('../../services/universalScheduleGenerator');

describe('UniversalScheduleGenerator', () => {
  let generator;

  beforeAll(() => {
    generator = new UniversalScheduleGenerator();
  });

  describe('Service Initialization', () => {
    test('should initialize with company registry', () => {
      expect(generator.companyRegistry).toBeDefined();
      expect(generator.cache).toBeDefined();
      expect(generator.baseDate).toEqual(new Date('2022-01-01'));
    });

    test('should have companies loaded', () => {
      const companies = generator.companyRegistry.getAllCompanies();
      expect(companies.length).toBeGreaterThan(25); // At least 25 companies
      expect(companies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'ssab_oxelosund' }),
          expect.objectContaining({ id: 'volvo_trucks' }),
          expect.objectContaining({ id: 'scania' }),
          expect.objectContaining({ id: 'boliden_aitik' })
        ])
      );
    });

    test('should have shift patterns loaded', () => {
      const patterns = generator.companyRegistry.getAllShiftPatterns();
      expect(patterns.length).toBeGreaterThan(15); // At least 15 patterns
      expect(patterns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'ssab_5team_21day' }),
          expect.objectContaining({ id: 'volvo_3shift_8day' }),
          expect.objectContaining({ id: 'aga_6shift_18day' })
        ])
      );
    });
  });

  describe('Schedule Generation', () => {
    test('should generate schedule for SSAB Oxelösund', () => {
      const schedule = generator.generateSchedule(
        'ssab_oxelosund', '31', '2024-01-01', '2024-01-07'
      );

      expect(schedule).toHaveProperty('company');
      expect(schedule).toHaveProperty('team');
      expect(schedule).toHaveProperty('schedule');
      expect(schedule).toHaveProperty('statistics');
      expect(schedule.company.id).toBe('ssab_oxelosund');
      expect(schedule.team.id).toBe('31');
      expect(schedule.schedule).toHaveLength(7);
    });

    test('should generate schedule for Volvo Trucks', () => {
      const schedule = generator.generateSchedule(
        'volvo_trucks', 'A', '2024-01-01', '2024-01-14'
      );

      expect(schedule.company.id).toBe('volvo_trucks');
      expect(schedule.team.id).toBe('A');
      expect(schedule.schedule).toHaveLength(14);
      expect(schedule.statistics.totalDays).toBe(14);
    });

    test('should generate schedule for complex AGA pattern', () => {
      const schedule = generator.generateSchedule(
        'aga_avesta', 'A', '2024-01-01', '2024-01-18'
      );

      expect(schedule.company.id).toBe('aga_avesta');
      expect(schedule.team.id).toBe('A');
      expect(schedule.schedule).toHaveLength(18);
      
      // Should contain complex shift types
      const shiftTypes = schedule.schedule.map(s => s.shiftType);
      expect(new Set(shiftTypes).size).toBeGreaterThan(3); // Multiple shift types
    });

    test('should handle invalid company gracefully', () => {
      expect(() => {
        generator.generateSchedule('invalid_company', 'A', '2024-01-01', '2024-01-07');
      }).toThrow('Company invalid_company not found');
    });

    test('should handle invalid team gracefully', () => {
      expect(() => {
        generator.generateSchedule('ssab_oxelosund', 'invalid_team', '2024-01-01', '2024-01-07');
      }).toThrow('Team invalid_team not found');
    });
  });

  describe('Monthly Calendar Generation', () => {
    test('should generate monthly calendar for any company', () => {
      const calendar = generator.generateMonthlyCalendar('ssab_oxelosund', '31', 2024, 1);

      expect(calendar).toHaveProperty('company');
      expect(calendar).toHaveProperty('team');
      expect(calendar).toHaveProperty('year', 2024);
      expect(calendar).toHaveProperty('month', 1);
      expect(calendar).toHaveProperty('weeks');
      expect(calendar.weeks).toHaveLength(6);
    });

    test('should generate calendar for different company types', () => {
      const companies = [
        { id: 'volvo_trucks', team: 'A' },
        { id: 'scania', team: 'Röd' },
        { id: 'skf_goteborg', team: '1' },
        { id: 'skanska', team: 'Lag 1' }
      ];

      companies.forEach(({ id, team }) => {
        const calendar = generator.generateMonthlyCalendar(id, team, 2024, 3);
        expect(calendar.company.id).toBe(id);
        expect(calendar.team.id).toBe(team);
        expect(calendar.weeks).toHaveLength(6);
      });
    });

    test('should include correct week structure', () => {
      const calendar = generator.generateMonthlyCalendar('ssab_oxelosund', '31', 2024, 2);
      
      calendar.weeks.forEach(week => {
        expect(week).toHaveProperty('weekNumber');
        expect(week).toHaveProperty('days');
        expect(week.days).toHaveLength(7);
        
        week.days.forEach(day => {
          expect(day).toHaveProperty('date');
          expect(day).toHaveProperty('day');
          expect(day).toHaveProperty('isCurrentMonth');
        });
      });
    });
  });

  describe('Yearly Calendar Generation', () => {
    test('should generate yearly calendar', () => {
      const yearly = generator.generateYearlyCalendar('ssab_oxelosund', '31', 2024);

      expect(yearly).toHaveProperty('company');
      expect(yearly).toHaveProperty('team');
      expect(yearly).toHaveProperty('year', 2024);
      expect(yearly).toHaveProperty('months');
      expect(yearly).toHaveProperty('statistics');
      expect(yearly.months).toHaveLength(12);
    });

    test('should calculate yearly statistics correctly', () => {
      const yearly = generator.generateYearlyCalendar('ssab_oxelosund', '31', 2024);
      const stats = yearly.statistics;

      expect(stats).toHaveProperty('totalWorkingDays');
      expect(stats).toHaveProperty('totalRestDays');
      expect(stats).toHaveProperty('totalHours');
      expect(stats).toHaveProperty('shiftBreakdown');
      expect(stats.totalWorkingDays + stats.totalRestDays).toBeGreaterThan(360);
    });

    test('should work for different company patterns', () => {
      const testCases = [
        { company: 'volvo_trucks', team: 'A' },
        { company: 'boliden_aitik', team: 'Lag 1' },
        { company: 'sca_ostrand', team: 'Röd' }
      ];

      testCases.forEach(({ company, team }) => {
        const yearly = generator.generateYearlyCalendar(company, team, 2024);
        expect(yearly.months).toHaveLength(12);
        expect(yearly.statistics.totalWorkingDays).toBeGreaterThan(0);
      });
    });
  });

  describe('Multi-Company Comparison', () => {
    test('should compare multiple companies', () => {
      const companyIds = ['ssab_oxelosund', 'volvo_trucks', 'scania'];
      const teamMappings = {
        'ssab_oxelosund': '31',
        'volvo_trucks': 'A',
        'scania': 'Röd'
      };

      const comparison = generator.generateMultiCompanyComparison(
        companyIds, teamMappings, 2024, 1
      );

      expect(comparison).toHaveProperty('companies');
      expect(comparison).toHaveProperty('summary');
      expect(Object.keys(comparison.companies)).toHaveLength(3);
      
      Object.values(comparison.companies).forEach(comp => {
        expect(comp).toHaveProperty('company');
        expect(comp).toHaveProperty('statistics');
      });
    });

    test('should handle comparison errors gracefully', () => {
      const companyIds = ['ssab_oxelosund', 'invalid_company'];
      const teamMappings = {
        'ssab_oxelosund': '31',
        'invalid_company': 'A'
      };

      const comparison = generator.generateMultiCompanyComparison(
        companyIds, teamMappings, 2024, 1
      );

      expect(comparison.companies['ssab_oxelosund']).not.toHaveProperty('error');
      expect(comparison.companies['invalid_company']).toHaveProperty('error');
    });
  });

  describe('Single Shift Lookup', () => {
    test('should get shift for specific date', () => {
      const shift = generator.getShiftForDate('ssab_oxelosund', '31', '2024-01-01');

      expect(shift).toHaveProperty('company');
      expect(shift).toHaveProperty('team');
      expect(shift).toHaveProperty('date', '2024-01-01');
      expect(shift).toHaveProperty('shift');
      expect(shift.shift).toHaveProperty('shiftType');
      expect(shift.shift).toHaveProperty('shiftName');
    });

    test('should work across different companies', () => {
      const companies = [
        { id: 'volvo_trucks', team: 'A' },
        { id: 'scania', team: 'Blå' },
        { id: 'aga_avesta', team: 'B' }
      ];

      companies.forEach(({ id, team }) => {
        const shift = generator.getShiftForDate(id, team, '2024-06-15');
        expect(shift.company.id).toBe(id);
        expect(shift.team.id).toBe(team);
        expect(shift.shift.shiftType).toBeDefined();
      });
    });
  });

  describe('Batch Processing', () => {
    test('should process multiple requests', () => {
      const requests = [
        { companyId: 'ssab_oxelosund', teamId: '31', startDate: '2024-01-01', endDate: '2024-01-07' },
        { companyId: 'volvo_trucks', teamId: 'A', startDate: '2024-01-01', endDate: '2024-01-07' },
        { companyId: 'scania', teamId: 'Röd', startDate: '2024-01-01', endDate: '2024-01-07' }
      ];

      const results = generator.batchGenerate(requests);

      expect(results).toHaveProperty('results');
      expect(results).toHaveProperty('summary');
      expect(results.results).toHaveLength(3);
      expect(results.summary.total).toBe(3);
      expect(results.summary.successful).toBeGreaterThan(0);
    });

    test('should handle mixed success/failure in batch', () => {
      const requests = [
        { companyId: 'ssab_oxelosund', teamId: '31', startDate: '2024-01-01', endDate: '2024-01-07' },
        { companyId: 'invalid_company', teamId: 'A', startDate: '2024-01-01', endDate: '2024-01-07' }
      ];

      const results = generator.batchGenerate(requests);

      expect(results.summary.successful).toBe(1);
      expect(results.summary.failed).toBe(1);
      expect(results.results[0].success).toBe(true);
      expect(results.results[1].success).toBe(false);
    });
  });

  describe('Export Functionality', () => {
    test('should export schedule as JSON', async () => {
      const exported = await generator.exportSchedule(
        'ssab_oxelosund', '31', '2024-01-01', '2024-01-07', 'json'
      );

      expect(exported).toHaveProperty('format', 'json');
      expect(exported).toHaveProperty('filename');
      expect(exported).toHaveProperty('data');
      expect(exported.data).toHaveProperty('schedule');
    });

    test('should export schedule as CSV', async () => {
      const exported = await generator.exportSchedule(
        'ssab_oxelosund', '31', '2024-01-01', '2024-01-07', 'csv'
      );

      expect(exported).toHaveProperty('format', 'csv');
      expect(exported).toHaveProperty('filename');
      expect(exported).toHaveProperty('data');
      expect(typeof exported.data).toBe('string');
      expect(exported.data).toContain('Date,Day of Week');
    });

    test('should handle invalid export format', async () => {
      await expect(
        generator.exportSchedule('ssab_oxelosund', '31', '2024-01-01', '2024-01-07', 'xml')
      ).rejects.toThrow('Unsupported export format');
    });
  });

  describe('Pattern Accuracy', () => {
    test('should maintain SSAB 21-day pattern consistency', () => {
      // Test pattern repeats correctly
      const shift1 = generator.getShiftForDate('ssab_oxelosund', '31', '2024-01-01');
      const shift22 = generator.getShiftForDate('ssab_oxelosund', '31', '2024-01-22'); // 21 days later

      expect(shift1.shift.shiftType).toBe(shift22.shift.shiftType);
    });

    test('should maintain team offsets correctly', () => {
      const date = '2024-01-01';
      const team31 = generator.getShiftForDate('ssab_oxelosund', '31', date);
      const team32 = generator.getShiftForDate('ssab_oxelosund', '32', date);

      // Teams should have different shifts due to offset
      expect(team31.shift.teamOffset).toBe(0);
      expect(team32.shift.teamOffset).toBe(4);
    });

    test('should handle leap years correctly', () => {
      const leapYear = generator.generateYearlyCalendar('ssab_oxelosund', '31', 2024);
      const normalYear = generator.generateYearlyCalendar('ssab_oxelosund', '31', 2023);

      // 2024 is leap year, 2023 is not
      expect(leapYear.metadata.isLeapYear).toBe(true);
      expect(normalYear.metadata.isLeapYear).toBe(false);
    });
  });

  describe('Performance and Caching', () => {
    test('should cache schedule results', () => {
      const startTime = Date.now();
      
      // First call - should be slower
      generator.generateSchedule('ssab_oxelosund', '31', '2024-01-01', '2024-01-07');
      const firstCallTime = Date.now() - startTime;

      const cacheStartTime = Date.now();
      
      // Second call - should be from cache
      generator.generateSchedule('ssab_oxelosund', '31', '2024-01-01', '2024-01-07');
      const secondCallTime = Date.now() - cacheStartTime;

      expect(generator.getCacheSize()).toBeGreaterThan(0);
      // Second call should generally be faster (from cache)
      // Note: This might not always be true in test environment
    });

    test('should clear cache', () => {
      // Generate some cached data
      generator.generateSchedule('ssab_oxelosund', '31', '2024-01-01', '2024-01-07');
      expect(generator.getCacheSize()).toBeGreaterThan(0);

      // Clear cache
      generator.clearCache();
      expect(generator.getCacheSize()).toBe(0);
    });

    test('should provide cache statistics', () => {
      generator.generateSchedule('ssab_oxelosund', '31', '2024-01-01', '2024-01-07');
      
      const stats = generator.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('timeout');
      expect(stats).toHaveProperty('memoryUsage');
    });
  });

  describe('Error Handling', () => {
    test('should handle date range validation', () => {
      // Test with dates outside supported range
      expect(() => {
        generator.generateSchedule('ssab_oxelosund', '31', '2021-01-01', '2021-01-07');
      }).toThrow();
    });

    test('should handle malformed dates gracefully', () => {
      expect(() => {
        generator.getShiftForDate('ssab_oxelosund', '31', 'invalid-date');
      }).toThrow();
    });
  });

  describe('Industry Coverage', () => {
    test('should support steel industry companies', () => {
      const steelCompanies = ['ssab_oxelosund', 'ssab_borlange', 'ovako_hofors'];
      
      steelCompanies.forEach(companyId => {
        const company = generator.companyRegistry.getCompany(companyId);
        expect(company).toBeDefined();
        expect(company.industry).toBe('Stålindustri');
      });
    });

    test('should support automotive industry companies', () => {
      const autoCompanies = ['volvo_trucks', 'volvo_cars', 'scania'];
      
      autoCompanies.forEach(companyId => {
        const company = generator.companyRegistry.getCompany(companyId);
        expect(company).toBeDefined();
        expect(company.industry).toBe('Fordonsindustri');
      });
    });

    test('should support mining industry companies', () => {
      const miningCompanies = ['boliden_aitik', 'boliden_garpenberg', 'lkab_kiruna'];
      
      miningCompanies.forEach(companyId => {
        const company = generator.companyRegistry.getCompany(companyId);
        expect(company).toBeDefined();
        expect(company.industry).toBe('Gruvindustri');
      });
    });

    test('should support forest industry companies', () => {
      const forestCompanies = ['sca_ostrand', 'stora_enso_kvarnsveden', 'holmen_hallsta'];
      
      forestCompanies.forEach(companyId => {
        const company = generator.companyRegistry.getCompany(companyId);
        expect(company).toBeDefined();
        expect(company.industry).toBe('Skogsindustri');
      });
    });
  });
});