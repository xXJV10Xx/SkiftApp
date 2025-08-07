// Unit Tests for Shift Data Service
const ShiftDataService = require('../../services/shiftDataService');

describe('ShiftDataService', () => {
  let shiftDataService;

  beforeAll(async () => {
    shiftDataService = new ShiftDataService();
    await shiftDataService.initialize();
  });

  describe('Initialization', () => {
    test('should initialize successfully', () => {
      expect(shiftDataService.initialized).toBe(true);
    });

    test('should load company data', () => {
      const companies = shiftDataService.getAllCompanies();
      expect(companies).toHaveLength(6);
      expect(companies[0]).toHaveProperty('name');
      expect(companies[0]).toHaveProperty('identifier');
      expect(companies[0]).toHaveProperty('teams');
    });
  });

  describe('Company Management', () => {
    test('should get specific company', () => {
      const ssab = shiftDataService.getCompany('ssab_5skift');
      expect(ssab).toBeDefined();
      expect(ssab.name).toBe('SSAB Borlänge 5-skift');
      expect(ssab.teams).toHaveLength(5);
      expect(ssab.shiftTypes).toContain('F');
      expect(ssab.shiftTypes).toContain('E');
      expect(ssab.shiftTypes).toContain('N');
      expect(ssab.shiftTypes).toContain('L');
    });

    test('should return null for non-existent company', () => {
      const nonExistent = shiftDataService.getCompany('non_existent');
      expect(nonExistent).toBeUndefined();
    });

    test('should search companies', () => {
      const results = shiftDataService.searchCompanies('ssab');
      expect(results).toHaveLength(2); // SSAB 5-skift and SSAB 4+7
      expect(results[0].name).toContain('SSAB');
    });
  });

  describe('Team Pattern Management', () => {
    test('should get team pattern', () => {
      const pattern = shiftDataService.getTeamPattern('ssab_5skift', 'A-lag');
      expect(pattern).toBeDefined();
      expect(pattern.pattern).toBeInstanceOf(Array);
      expect(pattern.pattern.length).toBe(15); // 15-day cycle
      expect(pattern.schedule).toHaveProperty('F');
      expect(pattern.schedule).toHaveProperty('E');
      expect(pattern.schedule).toHaveProperty('N');
      expect(pattern.schedule).toHaveProperty('L');
    });

    test('should return different patterns for different teams', () => {
      const aLag = shiftDataService.getTeamPattern('ssab_5skift', 'A-lag');
      const bLag = shiftDataService.getTeamPattern('ssab_5skift', 'B-lag');
      
      expect(aLag.pattern).not.toEqual(bLag.pattern);
      expect(aLag.pattern.length).toBe(bLag.pattern.length);
    });

    test('should get available teams', () => {
      const teams = shiftDataService.getAvailableTeams('ssab_5skift');
      expect(teams).toHaveLength(5);
      expect(teams).toContain('A-lag');
      expect(teams).toContain('E-lag');
    });
  });

  describe('Schedule Generation', () => {
    test('should generate schedule for valid inputs', () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-15';
      
      const schedule = shiftDataService.generateSchedule('ssab_5skift', 'A-lag', startDate, endDate);
      
      expect(schedule).toHaveProperty('company');
      expect(schedule).toHaveProperty('team');
      expect(schedule).toHaveProperty('schedule');
      expect(schedule).toHaveProperty('metadata');
      
      expect(schedule.schedule).toHaveLength(15);
      expect(schedule.schedule[0]).toHaveProperty('date');
      expect(schedule.schedule[0]).toHaveProperty('type');
      expect(schedule.schedule[0]).toHaveProperty('shift_name');
      expect(schedule.schedule[0]).toHaveProperty('is_working_day');
    });

    test('should include correct shift information', () => {
      const schedule = shiftDataService.generateSchedule('ssab_5skift', 'A-lag', '2024-01-01', '2024-01-07');
      
      const fShift = schedule.schedule.find(s => s.type === 'F');
      expect(fShift).toBeDefined();
      expect(fShift.shift_name).toBe('Förmiddag');
      expect(fShift.start_time).toBe('06:00');
      expect(fShift.end_time).toBe('14:00');
      expect(fShift.is_working_day).toBe(true);
      
      const lShift = schedule.schedule.find(s => s.type === 'L');
      if (lShift) {
        expect(lShift.shift_name).toBe('Ledigt');
        expect(lShift.is_working_day).toBe(false);
      }
    });

    test('should throw error for invalid company', () => {
      expect(() => {
        shiftDataService.generateSchedule('invalid_company', 'A-lag', '2024-01-01', '2024-01-07');
      }).toThrow('Pattern not found');
    });
  });

  describe('Shift Statistics', () => {
    test('should calculate correct statistics', () => {
      const stats = shiftDataService.getShiftStatistics('ssab_5skift', 'A-lag', '2024-01-01', '2024-01-15');
      
      expect(stats).toHaveProperty('totalDays');
      expect(stats).toHaveProperty('workingDays');
      expect(stats).toHaveProperty('restDays');
      expect(stats).toHaveProperty('shiftBreakdown');
      
      expect(stats.totalDays).toBe(15);
      expect(stats.workingDays + stats.restDays).toBe(stats.totalDays);
      
      expect(stats.shiftBreakdown).toHaveProperty('F');
      expect(stats.shiftBreakdown).toHaveProperty('E');
      expect(stats.shiftBreakdown).toHaveProperty('N');
      expect(stats.shiftBreakdown).toHaveProperty('L');
    });

    test('should calculate hours correctly', () => {
      const stats = shiftDataService.getShiftStatistics('ssab_5skift', 'A-lag', '2024-01-01', '2024-01-15');
      
      if (stats.shiftBreakdown.F && stats.shiftBreakdown.F.count > 0) {
        expect(stats.shiftBreakdown.F.hours).toBe(stats.shiftBreakdown.F.count * 8); // 8 hours per F shift
      }
      
      if (stats.shiftBreakdown.E && stats.shiftBreakdown.E.count > 0) {
        expect(stats.shiftBreakdown.E.hours).toBe(stats.shiftBreakdown.E.count * 8); // 8 hours per E shift
      }
    });
  });

  describe('SSAB Format Conversion', () => {
    test('should convert to SSAB format', () => {
      const ssabFormat = shiftDataService.convertToSSABFormat('ssab_5skift', 'A-lag', '2024-01-01', '2024-01-07');
      
      expect(ssabFormat).toHaveProperty('team');
      expect(ssabFormat).toHaveProperty('company');
      expect(ssabFormat).toHaveProperty('shifts');
      expect(ssabFormat).toHaveProperty('metadata');
      
      expect(ssabFormat.metadata.ssab_compatible).toBe(true);
      expect(ssabFormat.shifts[0]).toHaveProperty('date');
      expect(ssabFormat.shifts[0]).toHaveProperty('type');
      expect(ssabFormat.shifts[0]).toHaveProperty('is_working');
    });
  });

  describe('Export Functionality', () => {
    test('should export company data', () => {
      const exportData = shiftDataService.exportCompanyData('ssab_5skift');
      
      expect(exportData).toHaveProperty('company');
      expect(exportData).toHaveProperty('teams');
      expect(exportData).toHaveProperty('exportedAt');
      
      expect(exportData.teams).toHaveLength(5);
      expect(exportData.teams[0]).toHaveProperty('name');
      expect(exportData.teams[0]).toHaveProperty('pattern');
      expect(exportData.teams[0]).toHaveProperty('schedule');
    });

    test('should return null for non-existent company export', () => {
      const exportData = shiftDataService.exportCompanyData('non_existent');
      expect(exportData).toBeNull();
    });
  });

  describe('Pattern Rotation', () => {
    test('should rotate patterns correctly', () => {
      const basePattern = ['F', 'E', 'N', 'L'];
      
      const rotated1 = shiftDataService.rotatePattern(basePattern, 1);
      expect(rotated1).toEqual(['E', 'N', 'L', 'F']);
      
      const rotated2 = shiftDataService.rotatePattern(basePattern, 2);
      expect(rotated2).toEqual(['N', 'L', 'F', 'E']);
      
      const rotated0 = shiftDataService.rotatePattern(basePattern, 0);
      expect(rotated0).toEqual(basePattern);
    });
  });

  describe('Different Company Types', () => {
    test('should handle Boliden patterns', () => {
      const boliden = shiftDataService.getCompany('boliden_aitik_gruva_k3');
      expect(boliden).toBeDefined();
      expect(boliden.shiftTypes).toContain('D');
      expect(boliden.shiftTypes).toContain('K');
      expect(boliden.shiftTypes).toContain('N');
      
      const schedule = shiftDataService.generateSchedule('boliden_aitik_gruva_k3', 'Lag 1', '2024-01-01', '2024-01-07');
      expect(schedule.schedule).toHaveLength(7);
    });

    test('should handle Sandvik 2-shift patterns', () => {
      const sandvik = shiftDataService.getCompany('sandvik_mining_2skift');
      expect(sandvik).toBeDefined();
      expect(sandvik.teams).toHaveLength(2);
      
      const schedule = shiftDataService.generateSchedule('sandvik_mining_2skift', 'Lag 1', '2024-01-01', '2024-01-06');
      expect(schedule.schedule).toHaveLength(6);
    });
  });
});