/**
 * Shift Data Service - Integration of scraped schedule data
 * Maps external shift schedules to SSAB app format
 */

const fs = require('fs').promises;
const path = require('path');

class ShiftDataService {
  constructor() {
    this.companyData = new Map();
    this.shiftPatterns = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    console.log('🔄 Initializing Shift Data Service...');
    
    // Load known shift patterns from investigation
    await this.loadKnownPatterns();
    
    this.initialized = true;
    console.log('✅ Shift Data Service initialized');
  }

  async loadKnownPatterns() {
    // Based on skiftschema.se investigation findings
    const knownCompanies = [
      {
        name: 'SSAB Borlänge 5-skift',
        identifier: 'ssab_5skift',
        teams: ['A-lag', 'B-lag', 'C-lag', 'D-lag', 'E-lag'],
        shiftTypes: ['F', 'E', 'N', 'L'],
        pattern: ['F', 'F', 'F', 'E', 'E', 'E', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L', 'L'], // 15-day cycle
        description: 'SSAB Borlänge 5-team shift system',
        schedule: {
          'F': { name: 'Förmiddag', time: '06:00-14:00', color: '#4CAF50' },
          'E': { name: 'Eftermiddag', time: '14:00-22:00', color: '#FF9800' },
          'N': { name: 'Natt', time: '22:00-06:00', color: '#3F51B5' },
          'L': { name: 'Ledigt', time: null, color: '#9E9E9E' }
        }
      },
      {
        name: 'SSAB 4+7 skift',
        identifier: 'ssab_4_7skift',
        teams: ['A-lag', 'B-lag', 'C-lag', 'D-lag'],
        shiftTypes: ['D', 'N', 'L'],
        pattern: ['D', 'D', 'D', 'D', 'N', 'N', 'N', 'N', 'L', 'L', 'L'], // 11-day cycle
        description: 'SSAB 4+7 continuous shift system',
        schedule: {
          'D': { name: 'Dag', time: '06:00-18:00', color: '#4CAF50' },
          'N': { name: 'Natt', time: '18:00-06:00', color: '#3F51B5' },
          'L': { name: 'Ledigt', time: null, color: '#9E9E9E' }
        }
      },
      {
        name: 'Boliden Aitik Gruva K3',
        identifier: 'boliden_aitik_gruva_k3',
        teams: ['Lag 1', 'Lag 2', 'Lag 3', 'Lag 4', 'Lag 5'],
        shiftTypes: ['D', 'K', 'N', 'L'],
        pattern: ['D', 'D', 'K', 'K', 'N', 'N', 'L'], // 7-day cycle
        description: 'Boliden Aitik mine K3 shift system',
        schedule: {
          'D': { name: 'Dag', time: '06:00-14:00', color: '#4CAF50' },
          'K': { name: 'Kväll', time: '14:00-22:00', color: '#FF9800' },
          'N': { name: 'Natt', time: '22:00-06:00', color: '#3F51B5' },
          'L': { name: 'Ledigt', time: null, color: '#9E9E9E' }
        }
      },
      {
        name: 'Boliden Garpenberg Anrikningsverk',
        identifier: 'boliden_garpenberg_anrikningverk',
        teams: ['A-Lag', 'B-Lag', 'C-Lag', 'D-Lag', 'E-Lag'],
        shiftTypes: ['F', 'E', 'N', 'L'],
        pattern: ['F', 'F', 'F', 'E', 'E', 'E', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L', 'L'],
        description: 'Boliden Garpenberg processing plant 5-team system',
        schedule: {
          'F': { name: 'Förmiddag', time: '06:00-14:00', color: '#4CAF50' },
          'E': { name: 'Eftermiddag', time: '14:00-22:00', color: '#FF9800' },
          'N': { name: 'Natt', time: '22:00-06:00', color: '#3F51B5' },
          'L': { name: 'Ledigt', time: null, color: '#9E9E9E' }
        }
      },
      {
        name: 'Sandvik Mining 2-skift',
        identifier: 'sandvik_mining_2skift',
        teams: ['Lag 1', 'Lag 2'],
        shiftTypes: ['D', 'K', 'L'],
        pattern: ['D', 'D', 'K', 'K', 'L', 'L'], // 6-day cycle
        description: 'Sandvik Mining 2-shift system',
        schedule: {
          'D': { name: 'Dag', time: '06:00-14:00', color: '#4CAF50' },
          'K': { name: 'Kväll', time: '14:00-22:00', color: '#FF9800' },
          'L': { name: 'Ledigt', time: null, color: '#9E9E9E' }
        }
      },
      {
        name: 'Ovako Hofors Stålverk',
        identifier: 'ovako_hofors_stalverk_4skift',
        teams: ['Lag 1', 'Lag 2', 'Lag 3', 'Lag 4'],
        shiftTypes: ['F', 'E', 'N', 'L'],
        pattern: ['F', 'F', 'E', 'E', 'N', 'N', 'L', 'L'], // 8-day cycle
        description: 'Ovako Hofors steel works 4-team system',
        schedule: {
          'F': { name: 'Förmiddag', time: '06:00-14:00', color: '#4CAF50' },
          'E': { name: 'Eftermiddag', time: '14:00-22:00', color: '#FF9800' },
          'N': { name: 'Natt', time: '22:00-06:00', color: '#3F51B5' },
          'L': { name: 'Ledigt', time: null, color: '#9E9E9E' }
        }
      }
    ];

    // Store company data
    knownCompanies.forEach(company => {
      this.companyData.set(company.identifier, company);
      
      // Create pattern variations for each team
      company.teams.forEach((team, teamIndex) => {
        const patternKey = `${company.identifier}_${team.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        
        // Rotate pattern based on team index
        const rotatedPattern = this.rotatePattern(company.pattern, teamIndex);
        
        this.shiftPatterns.set(patternKey, {
          company: company.name,
          team: team,
          pattern: rotatedPattern,
          schedule: company.schedule,
          cycleLength: company.pattern.length
        });
      });
    });

    console.log(`📊 Loaded ${this.companyData.size} companies with ${this.shiftPatterns.size} team patterns`);
  }

  rotatePattern(pattern, offset) {
    const rotated = [...pattern];
    for (let i = 0; i < offset; i++) {
      rotated.push(rotated.shift());
    }
    return rotated;
  }

  getAllCompanies() {
    return Array.from(this.companyData.values());
  }

  getCompany(identifier) {
    return this.companyData.get(identifier);
  }

  getTeamPattern(companyId, team) {
    const patternKey = `${companyId}_${team.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    return this.shiftPatterns.get(patternKey);
  }

  generateSchedule(companyId, team, startDate, endDate) {
    const pattern = this.getTeamPattern(companyId, team);
    if (!pattern) {
      throw new Error(`Pattern not found for ${companyId} ${team}`);
    }

    const schedule = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);

    let patternIndex = 0;

    while (current <= end) {
      const shiftType = pattern.pattern[patternIndex % pattern.pattern.length];
      const shiftInfo = pattern.schedule[shiftType];

      schedule.push({
        date: current.toISOString().split('T')[0],
        type: shiftType,
        shift_name: shiftInfo.name,
        start_time: shiftInfo.time?.split('-')[0] || null,
        end_time: shiftInfo.time?.split('-')[1] || null,
        color: shiftInfo.color,
        is_working_day: shiftType !== 'L'
      });

      current.setDate(current.getDate() + 1);
      patternIndex++;
    }

    return {
      company: pattern.company,
      team: pattern.team,
      schedule: schedule,
      metadata: {
        startDate: startDate,
        endDate: endDate,
        totalDays: schedule.length,
        workingDays: schedule.filter(s => s.is_working_day).length,
        cycleLength: pattern.cycleLength
      }
    };
  }

  getAvailableTeams(companyId) {
    const company = this.getCompany(companyId);
    return company ? company.teams : [];
  }

  searchCompanies(query) {
    const results = [];
    const searchTerm = query.toLowerCase();

    for (const company of this.companyData.values()) {
      if (company.name.toLowerCase().includes(searchTerm) || 
          company.identifier.toLowerCase().includes(searchTerm) ||
          company.description.toLowerCase().includes(searchTerm)) {
        results.push(company);
      }
    }

    return results;
  }

  getShiftStatistics(companyId, team, startDate, endDate) {
    const scheduleData = this.generateSchedule(companyId, team, startDate, endDate);
    const statistics = {
      totalDays: scheduleData.schedule.length,
      workingDays: 0,
      restDays: 0,
      shiftBreakdown: {}
    };

    scheduleData.schedule.forEach(shift => {
      if (shift.is_working_day) {
        statistics.workingDays++;
      } else {
        statistics.restDays++;
      }

      if (!statistics.shiftBreakdown[shift.type]) {
        statistics.shiftBreakdown[shift.type] = {
          count: 0,
          name: shift.shift_name,
          hours: 0
        };
      }

      statistics.shiftBreakdown[shift.type].count++;

      // Calculate hours (if time range available)
      if (shift.start_time && shift.end_time) {
        const startHour = parseInt(shift.start_time.split(':')[0]);
        const endHour = parseInt(shift.end_time.split(':')[0]);
        const hours = endHour > startHour ? endHour - startHour : (24 - startHour) + endHour;
        statistics.shiftBreakdown[shift.type].hours += hours;
      }
    });

    return statistics;
  }

  exportCompanyData(companyId) {
    const company = this.getCompany(companyId);
    if (!company) return null;

    const exportData = {
      company: company,
      teams: company.teams.map(team => {
        const pattern = this.getTeamPattern(companyId, team);
        return {
          name: team,
          pattern: pattern?.pattern || [],
          schedule: pattern?.schedule || {}
        };
      }),
      exportedAt: new Date().toISOString()
    };

    return exportData;
  }

  async saveCompanyData(companyId, outputPath) {
    const data = this.exportCompanyData(companyId);
    if (!data) {
      throw new Error(`Company ${companyId} not found`);
    }

    const filename = path.join(outputPath, `${companyId}-shift-data.json`);
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    
    return filename;
  }

  // Integration with existing SSAB system
  convertToSSABFormat(companyId, team, startDate, endDate) {
    const scheduleData = this.generateSchedule(companyId, team, startDate, endDate);
    
    // Convert to SSAB system format (matching existing API)
    const ssabFormat = {
      team: team,
      company: scheduleData.company,
      shifts: scheduleData.schedule.map(shift => ({
        date: shift.date,
        type: shift.type,
        shift_name: shift.shift_name,
        start_time: shift.start_time,
        end_time: shift.end_time,
        is_working: shift.is_working_day
      })),
      metadata: {
        ...scheduleData.metadata,
        ssab_compatible: true,
        converted_at: new Date().toISOString()
      }
    };

    return ssabFormat;
  }
}

module.exports = ShiftDataService;