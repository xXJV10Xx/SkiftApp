/**
 * Universal Calendar Controller - Multi-company calendar API endpoints
 * Handles all 30+ companies with instant schedule generation
 */

const UniversalScheduleGenerator = require('../services/universalScheduleGenerator');
const CompanyRegistryService = require('../services/companyRegistryService');

class UniversalCalendarController {
  constructor() {
    this.scheduleGenerator = new UniversalScheduleGenerator();
    this.companyRegistry = new CompanyRegistryService();
  }

  // Get all supported companies
  static async getAllCompanies(req, res) {
    try {
      const controller = new UniversalCalendarController();
      const companies = controller.companyRegistry.getAllCompanies();

      res.json({
        success: true,
        companies: companies.map(company => ({
          id: company.id,
          name: company.name,
          industry: company.industry,
          location: company.location,
          description: company.description,
          teams: company.teams,
          departments: company.departments,
          colors: company.colors,
          teamCount: company.teams.length
        })),
        total: companies.length,
        metadata: {
          industries: controller.companyRegistry.getIndustries(),
          locations: controller.companyRegistry.getLocations(),
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({
        error: 'Failed to fetch companies',
        code: 'COMPANIES_FETCH_ERROR'
      });
    }
  }

  // Get specific company details
  static async getCompany(req, res) {
    try {
      const { companyId } = req.params;
      const controller = new UniversalCalendarController();
      
      const company = controller.companyRegistry.getCompany(companyId);
      if (!company) {
        return res.status(404).json({
          error: 'Company not found',
          code: 'COMPANY_NOT_FOUND'
        });
      }

      const pattern = controller.companyRegistry.getShiftPattern(company.shiftSystem);
      const validation = controller.companyRegistry.validateCompanyConfiguration(companyId);

      res.json({
        success: true,
        company: {
          ...company,
          shiftPattern: pattern ? {
            name: pattern.name,
            cycleLength: pattern.cycleLength,
            workingDaysPerCycle: pattern.workingDaysPerCycle,
            restDaysPerCycle: pattern.restDaysPerCycle,
            pattern: pattern.pattern,
            shiftTimes: pattern.shiftTimes
          } : null,
          validation
        },
        metadata: {
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).json({
        error: 'Failed to fetch company details',
        code: 'COMPANY_FETCH_ERROR'
      });
    }
  }

  // Search companies
  static async searchCompanies(req, res) {
    try {
      const { q: query, industry, location } = req.query;
      const controller = new UniversalCalendarController();

      let results = [];

      if (query) {
        results = controller.companyRegistry.searchCompanies(query);
      } else if (industry) {
        results = controller.companyRegistry.getCompaniesByIndustry(industry);
      } else {
        results = controller.companyRegistry.getAllCompanies();
      }

      // Apply location filter if specified
      if (location) {
        results = results.filter(company => 
          company.location.toLowerCase().includes(location.toLowerCase())
        );
      }

      res.json({
        success: true,
        query: { q: query, industry, location },
        results: results.map(company => ({
          id: company.id,
          name: company.name,
          industry: company.industry,
          location: company.location,
          description: company.description,
          teamCount: company.teams.length
        })),
        total: results.length,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error searching companies:', error);
      res.status(500).json({
        error: 'Failed to search companies',
        code: 'SEARCH_ERROR'
      });
    }
  }

  // Generate schedule for any company team
  static async generateSchedule(req, res) {
    try {
      const { companyId, teamId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Start date and end date are required',
          code: 'MISSING_DATES'
        });
      }

      const controller = new UniversalCalendarController();
      const schedule = controller.scheduleGenerator.generateSchedule(
        companyId, teamId, startDate, endDate
      );

      res.json({
        success: true,
        schedule,
        metadata: {
          generatedAt: new Date().toISOString(),
          cached: schedule.metadata.cacheKey ? true : false
        }
      });

    } catch (error) {
      console.error('Error generating schedule:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: error.message,
          code: 'NOT_FOUND'
        });
      } else {
        res.status(500).json({
          error: 'Failed to generate schedule',
          code: 'SCHEDULE_GENERATION_ERROR'
        });
      }
    }
  }

  // Generate monthly calendar
  static async generateMonthlyCalendar(req, res) {
    try {
      const { companyId, teamId, year, month } = req.params;
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);

      // Validate year and month
      if (yearNum < 2022 || yearNum > 2040) {
        return res.status(400).json({
          error: 'Year must be between 2022 and 2040',
          code: 'INVALID_YEAR'
        });
      }

      if (monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          error: 'Month must be between 1 and 12',
          code: 'INVALID_MONTH'
        });
      }

      const controller = new UniversalCalendarController();
      const calendar = controller.scheduleGenerator.generateMonthlyCalendar(
        companyId, teamId, yearNum, monthNum
      );

      res.json({
        success: true,
        calendar,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error generating monthly calendar:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: error.message,
          code: 'NOT_FOUND'
        });
      } else {
        res.status(500).json({
          error: 'Failed to generate monthly calendar',
          code: 'MONTHLY_CALENDAR_ERROR'
        });
      }
    }
  }

  // Generate yearly calendar
  static async generateYearlyCalendar(req, res) {
    try {
      const { companyId, teamId, year } = req.params;
      const yearNum = parseInt(year);

      // Validate year
      if (yearNum < 2022 || yearNum > 2040) {
        return res.status(400).json({
          error: 'Year must be between 2022 and 2040',
          code: 'INVALID_YEAR'
        });
      }

      const controller = new UniversalCalendarController();
      const calendar = controller.scheduleGenerator.generateYearlyCalendar(
        companyId, teamId, yearNum
      );

      res.json({
        success: true,
        calendar,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error generating yearly calendar:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: error.message,
          code: 'NOT_FOUND'
        });
      } else {
        res.status(500).json({
          error: 'Failed to generate yearly calendar',
          code: 'YEARLY_CALENDAR_ERROR'
        });
      }
    }
  }

  // Get shift for specific date
  static async getShiftForDate(req, res) {
    try {
      const { companyId, teamId, date } = req.params;

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          error: 'Invalid date format. Use YYYY-MM-DD',
          code: 'INVALID_DATE_FORMAT'
        });
      }

      const controller = new UniversalCalendarController();
      const shift = controller.scheduleGenerator.getShiftForDate(
        companyId, teamId, date
      );

      res.json({
        success: true,
        shift,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error getting shift for date:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: error.message,
          code: 'NOT_FOUND'
        });
      } else {
        res.status(500).json({
          error: 'Failed to get shift for date',
          code: 'SHIFT_DATE_ERROR'
        });
      }
    }
  }

  // Multi-company comparison
  static async compareCompanies(req, res) {
    try {
      const { year, month } = req.params;
      const { companies: companiesParam, teams: teamsParam } = req.query;

      if (!companiesParam) {
        return res.status(400).json({
          error: 'Companies parameter is required',
          code: 'MISSING_COMPANIES'
        });
      }

      const companyIds = companiesParam.split(',');
      const teamMappings = teamsParam ? 
        JSON.parse(teamsParam) : 
        companyIds.reduce((acc, id) => {
          acc[id] = 'default';
          return acc;
        }, {});

      const yearNum = parseInt(year);
      const monthNum = parseInt(month);

      const controller = new UniversalCalendarController();
      const comparison = controller.scheduleGenerator.generateMultiCompanyComparison(
        companyIds, teamMappings, yearNum, monthNum
      );

      res.json({
        success: true,
        comparison,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error comparing companies:', error);
      res.status(500).json({
        error: 'Failed to compare companies',
        code: 'COMPARISON_ERROR'
      });
    }
  }

  // Batch generate schedules
  static async batchGenerate(req, res) {
    try {
      const { requests } = req.body;

      if (!Array.isArray(requests) || requests.length === 0) {
        return res.status(400).json({
          error: 'Requests array is required and must not be empty',
          code: 'INVALID_REQUESTS'
        });
      }

      if (requests.length > 50) {
        return res.status(400).json({
          error: 'Maximum 50 requests allowed per batch',
          code: 'TOO_MANY_REQUESTS'
        });
      }

      const controller = new UniversalCalendarController();
      const results = controller.scheduleGenerator.batchGenerate(requests);

      res.json({
        success: true,
        results,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error batch generating:', error);
      res.status(500).json({
        error: 'Failed to batch generate schedules',
        code: 'BATCH_GENERATION_ERROR'
      });
    }
  }

  // Export schedule
  static async exportSchedule(req, res) {
    try {
      const { companyId, teamId } = req.params;
      const { startDate, endDate, format = 'json' } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Start date and end date are required',
          code: 'MISSING_DATES'
        });
      }

      if (!['json', 'csv'].includes(format.toLowerCase())) {
        return res.status(400).json({
          error: 'Invalid format. Supported formats: json, csv',
          code: 'INVALID_FORMAT'
        });
      }

      const controller = new UniversalCalendarController();
      const exportData = await controller.scheduleGenerator.exportSchedule(
        companyId, teamId, startDate, endDate, format
      );

      if (format.toLowerCase() === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
        res.send(exportData.data);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
        res.json(exportData.data);
      }

    } catch (error) {
      console.error('Error exporting schedule:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          error: error.message,
          code: 'NOT_FOUND'
        });
      } else {
        res.status(500).json({
          error: 'Failed to export schedule',
          code: 'EXPORT_ERROR'
        });
      }
    }
  }

  // Get system statistics
  static async getSystemStats(req, res) {
    try {
      const controller = new UniversalCalendarController();
      const companyStats = controller.companyRegistry.getStatistics();
      const cacheStats = controller.scheduleGenerator.getCacheStats();

      res.json({
        success: true,
        statistics: {
          companies: companyStats,
          cache: cacheStats,
          performance: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version
          }
        },
        metadata: {
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error getting system stats:', error);
      res.status(500).json({
        error: 'Failed to get system statistics',
        code: 'STATS_ERROR'
      });
    }
  }

  // Health check
  static async healthCheck(req, res) {
    try {
      const controller = new UniversalCalendarController();
      const companies = controller.companyRegistry.getAllCompanies();
      const patterns = controller.companyRegistry.getAllShiftPatterns();

      // Test a quick schedule generation
      const testStart = Date.now();
      const testSchedule = controller.scheduleGenerator.generateSchedule(
        'ssab_oxelosund', '31', '2024-01-01', '2024-01-07'
      );
      const testTime = Date.now() - testStart;

      res.json({
        success: true,
        service: 'Universal Calendar Service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        statistics: {
          companiesLoaded: companies.length,
          patternsLoaded: patterns.length,
          cacheSize: controller.scheduleGenerator.getCacheSize(),
          testGenerationTime: `${testTime}ms`,
          testScheduleDays: testSchedule.schedule.length
        },
        features: {
          multiCompanySupport: true,
          instantGeneration: testTime < 100,
          caching: true,
          batchProcessing: true,
          multipleFormats: true,
          dateRange: '2022-2040'
        }
      });

    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        success: false,
        service: 'Universal Calendar Service',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Clear cache
  static async clearCache(req, res) {
    try {
      const controller = new UniversalCalendarController();
      const oldSize = controller.scheduleGenerator.getCacheSize();
      controller.scheduleGenerator.clearCache();
      const newSize = controller.scheduleGenerator.getCacheSize();

      res.json({
        success: true,
        message: 'Cache cleared successfully',
        cache: {
          previousSize: oldSize,
          currentSize: newSize,
          cleared: oldSize - newSize
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({
        error: 'Failed to clear cache',
        code: 'CACHE_CLEAR_ERROR'
      });
    }
  }
}

module.exports = UniversalCalendarController;