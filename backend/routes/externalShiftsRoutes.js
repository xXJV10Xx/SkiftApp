/**
 * External Shifts Routes
 * API routes for external company shift schedules
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const ExternalShiftsController = require('../controllers/externalShiftsController');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

// Health check for external shifts service
router.get('/health', ExternalShiftsController.healthCheck);

// Get all available companies
router.get('/companies', ExternalShiftsController.getCompanies);

// Search companies
router.get('/companies/search', [
  query('q')
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters')
    .trim()
    .escape(),
  ValidationMiddleware.handleValidationErrors
], ExternalShiftsController.searchCompanies);

// Get specific company details
router.get('/companies/:companyId', [
  param('companyId')
    .isAlphanumeric('en-US', { ignore: '_-' })
    .withMessage('Company ID must be alphanumeric')
    .isLength({ min: 3, max: 50 })
    .withMessage('Company ID must be between 3 and 50 characters'),
  ValidationMiddleware.handleValidationErrors
], ExternalShiftsController.getCompany);

// Export company data
router.get('/companies/:companyId/export', [
  param('companyId')
    .isAlphanumeric('en-US', { ignore: '_-' })
    .withMessage('Company ID must be alphanumeric'),
  query('format')
    .optional()
    .isIn(['json'])
    .withMessage('Format must be json'),
  ValidationMiddleware.handleValidationErrors
], ExternalShiftsController.exportCompanyData);

// Get team schedule
router.get('/companies/:companyId/teams/:team/schedule', [
  param('companyId')
    .isAlphanumeric('en-US', { ignore: '_-' })
    .withMessage('Company ID must be alphanumeric'),
  param('team')
    .isLength({ min: 1, max: 20 })
    .withMessage('Team name must be between 1 and 20 characters')
    .trim(),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format (YYYY-MM-DD)'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format (YYYY-MM-DD)'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Limit must be between 1 and 365 days'),
  ValidationMiddleware.handleValidationErrors
], ExternalShiftsController.getTeamSchedule);

// Get shift statistics
router.get('/companies/:companyId/teams/:team/statistics', [
  param('companyId')
    .isAlphanumeric('en-US', { ignore: '_-' })
    .withMessage('Company ID must be alphanumeric'),
  param('team')
    .isLength({ min: 1, max: 20 })
    .withMessage('Team name must be between 1 and 20 characters')
    .trim(),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format (YYYY-MM-DD)'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format (YYYY-MM-DD)'),
  query('period')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Period must be between 1 and 365 days'),
  ValidationMiddleware.handleValidationErrors
], ExternalShiftsController.getShiftStatistics);

// Convert to SSAB format
router.get('/companies/:companyId/teams/:team/ssab-format', [
  param('companyId')
    .isAlphanumeric('en-US', { ignore: '_-' })
    .withMessage('Company ID must be alphanumeric'),
  param('team')
    .isLength({ min: 1, max: 20 })
    .withMessage('Team name must be between 1 and 20 characters')
    .trim(),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in ISO 8601 format (YYYY-MM-DD)'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be in ISO 8601 format (YYYY-MM-DD)'),
  ValidationMiddleware.handleValidationErrors
], ExternalShiftsController.convertToSSABFormat);

module.exports = router;