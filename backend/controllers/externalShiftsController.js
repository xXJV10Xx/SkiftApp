/**
 * External Shifts Controller
 * Handles API endpoints for external company shift schedules
 */

const ShiftDataService = require('../services/shiftDataService');

class ExternalShiftsController {
  constructor() {
    this.shiftDataService = new ShiftDataService();
    this.initialized = false;
  }

  async init() {
    if (!this.initialized) {
      await this.shiftDataService.initialize();
      this.initialized = true;
    }
  }

  // Get all available companies
  static async getCompanies(req, res) {
    try {
      const controller = new ExternalShiftsController();
      await controller.init();

      const companies = controller.shiftDataService.getAllCompanies();
      
      res.json({
        success: true,
        companies: companies.map(company => ({
          id: company.identifier,
          name: company.name,
          description: company.description,
          teams: company.teams,
          shiftTypes: company.shiftTypes,
          cycleLength: company.pattern.length
        })),
        total: companies.length
      });

    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({
        error: 'Failed to fetch companies',
        code: 'EXTERNAL_COMPANIES_ERROR'
      });
    }
  }

  // Get specific company details
  static async getCompany(req, res) {
    try {
      const { companyId } = req.params;
      const controller = new ExternalShiftsController();
      await controller.init();

      const company = controller.shiftDataService.getCompany(companyId);
      
      if (!company) {
        return res.status(404).json({
          error: 'Company not found',
          code: 'COMPANY_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        company: {
          id: company.identifier,
          name: company.name,
          description: company.description,
          teams: company.teams,
          shiftTypes: company.shiftTypes,
          schedule: company.schedule,
          pattern: company.pattern,
          cycleLength: company.pattern.length
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

  // Get team schedule
  static async getTeamSchedule(req, res) {
    try {
      const { companyId, team } = req.params;
      const { startDate, endDate, limit = 30 } = req.query;

      const controller = new ExternalShiftsController();
      await controller.init();

      // Validate company exists
      const company = controller.shiftDataService.getCompany(companyId);
      if (!company) {
        return res.status(404).json({
          error: 'Company not found',
          code: 'COMPANY_NOT_FOUND'
        });
      }

      // Validate team exists
      if (!company.teams.includes(team)) {
        return res.status(404).json({
          error: 'Team not found for this company',
          code: 'TEAM_NOT_FOUND',
          availableTeams: company.teams
        });
      }

      // Set default date range if not provided
      const start = startDate || new Date().toISOString().split('T')[0];
      const end = endDate || new Date(Date.now() + parseInt(limit) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const scheduleData = controller.shiftDataService.generateSchedule(companyId, team, start, end);

      res.json({
        success: true,
        company: scheduleData.company,
        team: scheduleData.team,
        shifts: scheduleData.schedule,
        metadata: {
          ...scheduleData.metadata,
          requestedRange: { startDate: start, endDate: end },
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error generating team schedule:', error);
      res.status(500).json({
        error: 'Failed to generate team schedule',
        code: 'SCHEDULE_GENERATION_ERROR'
      });
    }
  }

  // Get shift statistics
  static async getShiftStatistics(req, res) {
    try {
      const { companyId, team } = req.params;
      const { startDate, endDate, period = '30' } = req.query;

      const controller = new ExternalShiftsController();
      await controller.init();

      // Set date range
      const start = startDate || new Date().toISOString().split('T')[0];
      const end = endDate || new Date(Date.now() + parseInt(period) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const statistics = controller.shiftDataService.getShiftStatistics(companyId, team, start, end);

      res.json({
        success: true,
        company: companyId,
        team: team,
        period: { startDate: start, endDate: end },
        statistics: statistics,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error generating statistics:', error);
      res.status(500).json({
        error: 'Failed to generate shift statistics',
        code: 'STATISTICS_ERROR'
      });
    }
  }

  // Search companies
  static async searchCompanies(req, res) {
    try {
      const { q: query } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          error: 'Search query must be at least 2 characters',
          code: 'INVALID_SEARCH_QUERY'
        });
      }

      const controller = new ExternalShiftsController();
      await controller.init();

      const results = controller.shiftDataService.searchCompanies(query.trim());

      res.json({
        success: true,
        query: query.trim(),
        results: results.map(company => ({
          id: company.identifier,
          name: company.name,
          description: company.description,
          teams: company.teams.length,
          shiftTypes: company.shiftTypes
        })),
        total: results.length
      });

    } catch (error) {
      console.error('Error searching companies:', error);
      res.status(500).json({
        error: 'Failed to search companies',
        code: 'SEARCH_ERROR'
      });
    }
  }

  // Convert to SSAB format for integration
  static async convertToSSABFormat(req, res) {
    try {
      const { companyId, team } = req.params;
      const { startDate, endDate } = req.query;

      const controller = new ExternalShiftsController();
      await controller.init();

      // Set default date range
      const start = startDate || new Date().toISOString().split('T')[0];
      const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const ssabFormat = controller.shiftDataService.convertToSSABFormat(companyId, team, start, end);

      res.json({
        success: true,
        message: 'Schedule converted to SSAB format',
        data: ssabFormat,
        integration: {
          compatible: true,
          format: 'SSAB',
          notes: 'This data can be integrated into the existing SSAB shift calculation system'
        }
      });

    } catch (error) {
      console.error('Error converting to SSAB format:', error);
      res.status(500).json({
        error: 'Failed to convert to SSAB format',
        code: 'CONVERSION_ERROR'
      });
    }
  }

  // Export company data
  static async exportCompanyData(req, res) {
    try {
      const { companyId } = req.params;
      const { format = 'json' } = req.query;

      const controller = new ExternalShiftsController();
      await controller.init();

      const exportData = controller.shiftDataService.exportCompanyData(companyId);
      
      if (!exportData) {
        return res.status(404).json({
          error: 'Company not found',
          code: 'COMPANY_NOT_FOUND'
        });
      }

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${companyId}-shift-data.json"`);
        res.json(exportData);
      } else {
        res.status(400).json({
          error: 'Unsupported export format',
          code: 'INVALID_FORMAT',
          supportedFormats: ['json']
        });
      }

    } catch (error) {
      console.error('Error exporting company data:', error);
      res.status(500).json({
        error: 'Failed to export company data',
        code: 'EXPORT_ERROR'
      });
    }
  }

  // Health check for external shifts service
  static async healthCheck(req, res) {
    try {
      const controller = new ExternalShiftsController();
      await controller.init();

      const companies = controller.shiftDataService.getAllCompanies();

      res.json({
        success: true,
        service: 'External Shifts',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        statistics: {
          companiesLoaded: companies.length,
          patternsAvailable: companies.reduce((sum, c) => sum + c.teams.length, 0),
          shiftTypesSupported: [...new Set(companies.flatMap(c => c.shiftTypes))].length
        }
      });

    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        success: false,
        service: 'External Shifts',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = ExternalShiftsController;