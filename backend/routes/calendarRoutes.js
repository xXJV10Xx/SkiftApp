/**
 * Calendar Routes - Long-term schedule and calendar view endpoints
 */

const express = require('express');
const { param, query } = require('express-validator');
const CalendarController = require('../controllers/calendarController');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

// Get pattern information
router.get('/pattern', CalendarController.getPatternInfo);

// Get monthly calendar view
router.get('/monthly/:team/:year/:month', [
  param('team')
    .isInt({ min: 31, max: 35 })
    .withMessage('Team must be between 31 and 35'),
  param('year')
    .isInt({ min: 2022, max: 2040 })
    .withMessage('Year must be between 2022 and 2040'),
  param('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  ValidationMiddleware.handleValidationErrors
], CalendarController.getMonthlyCalendar);

// Get yearly calendar overview
router.get('/yearly/:team/:year', [
  param('team')
    .isInt({ min: 31, max: 35 })
    .withMessage('Team must be between 31 and 35'),
  param('year')
    .isInt({ min: 2022, max: 2040 })
    .withMessage('Year must be between 2022 and 2040'),
  ValidationMiddleware.handleValidationErrors
], CalendarController.getYearlyCalendar);

// Compare all teams for a specific month
router.get('/compare/:year/:month', [
  param('year')
    .isInt({ min: 2022, max: 2040 })
    .withMessage('Year must be between 2022 and 2040'),
  param('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  ValidationMiddleware.handleValidationErrors
], CalendarController.getAllTeamsComparison);

// Get schedule for a specific date range
router.get('/schedule/:team', [
  param('team')
    .isInt({ min: 31, max: 35 })
    .withMessage('Team must be between 31 and 35'),
  query('startDate')
    .isISO8601()
    .withMessage('Start date must be in YYYY-MM-DD format'),
  query('endDate')
    .isISO8601()
    .withMessage('End date must be in YYYY-MM-DD format'),
  ValidationMiddleware.handleValidationErrors
], CalendarController.getScheduleRange);

// Get shift for a specific date
router.get('/shift/:team/:date', [
  param('team')
    .isInt({ min: 31, max: 35 })
    .withMessage('Team must be between 31 and 35'),
  param('date')
    .isISO8601()
    .withMessage('Date must be in YYYY-MM-DD format'),
  ValidationMiddleware.handleValidationErrors
], CalendarController.getShiftForDate);

// Export schedule data
router.get('/export/:team', [
  param('team')
    .isInt({ min: 31, max: 35 })
    .withMessage('Team must be between 31 and 35'),
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
], CalendarController.exportSchedule);

// Find specific shift occurrences
router.get('/find/:team/:shiftType', [
  param('team')
    .isInt({ min: 31, max: 35 })
    .withMessage('Team must be between 31 and 35'),
  param('shiftType')
    .isIn(['F', 'E', 'N', 'L'])
    .withMessage('Shift type must be F, E, N, or L'),
  query('startDate')
    .isISO8601()
    .withMessage('Start date must be in YYYY-MM-DD format'),
  query('endDate')
    .isISO8601()
    .withMessage('End date must be in YYYY-MM-DD format'),
  ValidationMiddleware.handleValidationErrors
], CalendarController.findShiftOccurrences);

// Get next working day
router.get('/next-working/:team', [
  param('team')
    .isInt({ min: 31, max: 35 })
    .withMessage('Team must be between 31 and 35'),
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('From date must be in YYYY-MM-DD format'),
  ValidationMiddleware.handleValidationErrors
], CalendarController.getNextWorkingDay);

// Compare team workloads
router.get('/workload-comparison', [
  query('startDate')
    .isISO8601()
    .withMessage('Start date must be in YYYY-MM-DD format'),
  query('endDate')
    .isISO8601()
    .withMessage('End date must be in YYYY-MM-DD format'),
  ValidationMiddleware.handleValidationErrors
], CalendarController.compareTeamWorkloads);

module.exports = router;