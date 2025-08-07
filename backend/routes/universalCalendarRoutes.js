/**
 * Universal Calendar Routes - Multi-company calendar API endpoints
 * Supports all 30+ companies with comprehensive routing
 */

const express = require('express');
const { param, query, body } = require('express-validator');
const UniversalCalendarController = require('../controllers/universalCalendarController');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

// Company management routes
router.get('/companies', UniversalCalendarController.getAllCompanies);

router.get('/companies/search', [
  query('q')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
  query('industry')
    .optional()
    .isString()
    .withMessage('Industry must be a string'),
  query('location')
    .optional()
    .isString()
    .withMessage('Location must be a string'),
  ValidationMiddleware.handleValidationErrors
], UniversalCalendarController.searchCompanies);

router.get('/companies/:companyId', [
  param('companyId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Company ID is required'),
  ValidationMiddleware.handleValidationErrors
], UniversalCalendarController.getCompany);

// Schedule generation routes
router.get('/schedule/:companyId/:teamId', [
  param('companyId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Company ID is required'),
  param('teamId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Team ID is required'),
  query('startDate')
    .isISO8601()
    .withMessage('Start date must be in YYYY-MM-DD format'),
  query('endDate')
    .isISO8601()
    .withMessage('End date must be in YYYY-MM-DD format')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end <= start) {
          throw new Error('End date must be after start date');
        }
        // Limit to reasonable date ranges (max 2 years)
        const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
        if (daysDiff > 730) {
          throw new Error('Date range cannot exceed 2 years');
        }
        // Ensure dates are within supported range
        if (start.getFullYear() < 2022 || end.getFullYear() > 2040) {
          throw new Error('Dates must be between 2022 and 2040');
        }
      }
      return true;
    }),
  ValidationMiddleware.handleValidationErrors
], UniversalCalendarController.generateSchedule);

// Monthly calendar routes
router.get('/monthly/:companyId/:teamId/:year/:month', [
  param('companyId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Company ID is required'),
  param('teamId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Team ID is required'),
  param('year')
    .isInt({ min: 2022, max: 2040 })
    .withMessage('Year must be between 2022 and 2040'),
  param('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  ValidationMiddleware.handleValidationErrors
], UniversalCalendarController.generateMonthlyCalendar);

// Yearly calendar routes
router.get('/yearly/:companyId/:teamId/:year', [
  param('companyId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Company ID is required'),
  param('teamId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Team ID is required'),
  param('year')
    .isInt({ min: 2022, max: 2040 })
    .withMessage('Year must be between 2022 and 2040'),
  ValidationMiddleware.handleValidationErrors
], UniversalCalendarController.generateYearlyCalendar);

// Single shift lookup
router.get('/shift/:companyId/:teamId/:date', [
  param('companyId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Company ID is required'),
  param('teamId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Team ID is required'),
  param('date')
    .isISO8601()
    .withMessage('Date must be in YYYY-MM-DD format')
    .custom((date) => {
      const targetDate = new Date(date);
      if (targetDate.getFullYear() < 2022 || targetDate.getFullYear() > 2040) {
        throw new Error('Date must be between 2022 and 2040');
      }
      return true;
    }),
  ValidationMiddleware.handleValidationErrors
], UniversalCalendarController.getShiftForDate);

// Multi-company comparison
router.get('/compare/:year/:month', [
  param('year')
    .isInt({ min: 2022, max: 2040 })
    .withMessage('Year must be between 2022 and 2040'),
  param('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  query('companies')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Companies parameter is required')
    .custom((companies) => {
      const companyIds = companies.split(',');
      if (companyIds.length < 2) {
        throw new Error('At least 2 companies required for comparison');
      }
      if (companyIds.length > 10) {
        throw new Error('Maximum 10 companies allowed for comparison');
      }
      return true;
    }),
  query('teams')
    .optional()
    .isString()
    .withMessage('Teams parameter must be a valid JSON string')
    .custom((teams) => {
      if (teams) {
        try {
          JSON.parse(teams);
        } catch (error) {
          throw new Error('Teams parameter must be valid JSON');
        }
      }
      return true;
    }),
  ValidationMiddleware.handleValidationErrors
], UniversalCalendarController.compareCompanies);

// Batch processing
router.post('/batch', [
  body('requests')
    .isArray({ min: 1, max: 50 })
    .withMessage('Requests must be an array with 1-50 items'),
  body('requests.*.companyId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Each request must have a valid company ID'),
  body('requests.*.teamId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Each request must have a valid team ID'),
  body('requests.*.startDate')
    .isISO8601()
    .withMessage('Start date must be in YYYY-MM-DD format'),
  body('requests.*.endDate')
    .isISO8601()
    .withMessage('End date must be in YYYY-MM-DD format'),
  ValidationMiddleware.handleValidationErrors
], UniversalCalendarController.batchGenerate);

// Export routes
router.get('/export/:companyId/:teamId', [
  param('companyId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Company ID is required'),
  param('teamId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Team ID is required'),
  query('startDate')
    .isISO8601()
    .withMessage('Start date must be in YYYY-MM-DD format'),
  query('endDate')
    .isISO8601()
    .withMessage('End date must be in YYYY-MM-DD format'),
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv'),
  ValidationMiddleware.handleValidationErrors
], UniversalCalendarController.exportSchedule);

// System management routes
router.get('/system/stats', UniversalCalendarController.getSystemStats);
router.get('/system/health', UniversalCalendarController.healthCheck);
router.delete('/system/cache', UniversalCalendarController.clearCache);

// Legacy SSAB compatibility routes (redirect to universal system)
router.get('/pattern', (req, res) => {
  res.redirect('/api/universal/companies/ssab_oxelosund');
});

router.get('/monthly/:team/:year/:month', [
  param('team')
    .isIn(['31', '32', '33', '34', '35'])
    .withMessage('Team must be 31, 32, 33, 34, or 35'),
  param('year')
    .isInt({ min: 2022, max: 2040 })
    .withMessage('Year must be between 2022 and 2040'),
  param('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  ValidationMiddleware.handleValidationErrors
], (req, res) => {
  const { team, year, month } = req.params;
  res.redirect(`/api/universal/monthly/ssab_oxelosund/${team}/${year}/${month}`);
});

router.get('/yearly/:team/:year', [
  param('team')
    .isIn(['31', '32', '33', '34', '35'])
    .withMessage('Team must be 31, 32, 33, 34, or 35'),
  param('year')
    .isInt({ min: 2022, max: 2040 })
    .withMessage('Year must be between 2022 and 2040'),
  ValidationMiddleware.handleValidationErrors
], (req, res) => {
  const { team, year } = req.params;
  res.redirect(`/api/universal/yearly/ssab_oxelosund/${team}/${year}`);
});

// Industry-specific routes
router.get('/industries', (req, res) => {
  try {
    const controller = new UniversalCalendarController();
    const industries = controller.companyRegistry.getIndustries();
    
    res.json({
      success: true,
      industries: industries.map(industry => ({
        name: industry,
        companies: controller.companyRegistry.getCompaniesByIndustry(industry).map(c => ({
          id: c.id,
          name: c.name,
          location: c.location
        }))
      })),
      total: industries.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get industries',
      code: 'INDUSTRIES_ERROR'
    });
  }
});

router.get('/locations', (req, res) => {
  try {
    const controller = new UniversalCalendarController();
    const locations = controller.companyRegistry.getLocations();
    
    res.json({
      success: true,
      locations: locations.map(location => ({
        name: location,
        companies: controller.companyRegistry.getAllCompanies()
          .filter(c => c.location === location)
          .map(c => ({
            id: c.id,
            name: c.name,
            industry: c.industry
          }))
      })),
      total: locations.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get locations',
      code: 'LOCATIONS_ERROR'
    });
  }
});

// Performance monitoring route
router.get('/performance', async (req, res) => {
  try {
    const controller = new UniversalCalendarController();
    const testResults = [];

    // Test different company types for performance
    const testCompanies = [
      { id: 'ssab_oxelosund', team: '31' },
      { id: 'volvo_trucks', team: 'A' },
      { id: 'aga_avesta', team: 'A' },
      { id: 'skanska', team: 'Lag 1' }
    ];

    for (const test of testCompanies) {
      const start = Date.now();
      try {
        await controller.scheduleGenerator.generateSchedule(
          test.id, test.team, '2024-01-01', '2024-01-31'
        );
        testResults.push({
          company: test.id,
          team: test.team,
          success: true,
          responseTime: Date.now() - start
        });
      } catch (error) {
        testResults.push({
          company: test.id,
          team: test.team,
          success: false,
          error: error.message,
          responseTime: Date.now() - start
        });
      }
    }

    const avgResponseTime = testResults
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.responseTime, 0) / testResults.filter(r => r.success).length;

    res.json({
      success: true,
      performance: {
        averageResponseTime: Math.round(avgResponseTime),
        testResults,
        cacheSize: controller.scheduleGenerator.getCacheSize(),
        fastGeneration: avgResponseTime < 100
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Performance test failed',
      code: 'PERFORMANCE_TEST_ERROR'
    });
  }
});

module.exports = router;