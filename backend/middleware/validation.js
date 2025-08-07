// Validation Middleware
const { body, param, query, validationResult } = require('express-validator');

class ValidationMiddleware {
  // Handle validation errors
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    
    next();
  }

  // Team validation
  static validateTeam() {
    return [
      param('team')
        .isInt({ min: 31, max: 35 })
        .withMessage('Team must be a number between 31 and 35'),
      this.handleValidationErrors
    ];
  }

  // Date validation
  static validateDate() {
    return [
      param('date')
        .isISO8601()
        .withMessage('Date must be in YYYY-MM-DD format')
        .custom((value) => {
          const date = new Date(value);
          const year = date.getFullYear();
          if (year < 2023 || year > 2040) {
            throw new Error('Date must be between 2023 and 2040');
          }
          return true;
        }),
      this.handleValidationErrors
    ];
  }

  // Year/Month validation
  static validateYearMonth() {
    return [
      param('year')
        .isInt({ min: 2023, max: 2040 })
        .withMessage('Year must be between 2023 and 2040'),
      param('month')
        .isInt({ min: 1, max: 12 })
        .withMessage('Month must be between 1 and 12'),
      this.handleValidationErrors
    ];
  }

  // Query pagination validation
  static validatePagination() {
    return [
      query('limit')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Limit must be between 1 and 1000'),
      query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be 0 or greater'),
      this.handleValidationErrors
    ];
  }

  // Date range validation
  static validateDateRange() {
    return [
      query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be in YYYY-MM-DD format'),
      query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be in YYYY-MM-DD format')
        .custom((endDate, { req }) => {
          if (req.query.startDate && endDate) {
            const start = new Date(req.query.startDate);
            const end = new Date(endDate);
            if (end <= start) {
              throw new Error('End date must be after start date');
            }
            const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
            if (daysDiff > 365) {
              throw new Error('Date range cannot exceed 365 days');
            }
          }
          return true;
        }),
      this.handleValidationErrors
    ];
  }

  // Profile update validation
  static validateProfileUpdate() {
    return [
      body('full_name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Full name must be between 1 and 100 characters'),
      body('company_name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Company name must be between 1 and 100 characters'),
      body('company_type')
        .optional()
        .isIn(['ssab', 'other'])
        .withMessage('Company type must be ssab or other'),
      body('selected_team')
        .optional()
        .isInt({ min: 31, max: 35 })
        .withMessage('Selected team must be between 31 and 35'),
      body('phone_number')
        .optional()
        .isMobilePhone(['sv-SE'])
        .withMessage('Phone number must be a valid Swedish mobile number'),
      this.handleValidationErrors
    ];
  }

  // User preferences validation
  static validatePreferences() {
    return [
      body('notifications_enabled')
        .optional()
        .isBoolean()
        .withMessage('Notifications enabled must be a boolean'),
      body('email_notifications')
        .optional()
        .isBoolean()
        .withMessage('Email notifications must be a boolean'),
      body('push_notifications')
        .optional()
        .isBoolean()
        .withMessage('Push notifications must be a boolean'),
      body('shift_reminders')
        .optional()
        .isBoolean()
        .withMessage('Shift reminders must be a boolean'),
      body('reminder_hours')
        .optional()
        .isInt({ min: 1, max: 48 })
        .withMessage('Reminder hours must be between 1 and 48'),
      body('theme')
        .optional()
        .isIn(['light', 'dark', 'auto'])
        .withMessage('Theme must be light, dark, or auto'),
      body('calendar_sync_enabled')
        .optional()
        .isBoolean()
        .withMessage('Calendar sync enabled must be a boolean'),
      body('calendar_sync_provider')
        .optional()
        .isIn(['google', 'apple', 'outlook'])
        .withMessage('Calendar sync provider must be google, apple, or outlook'),
      this.handleValidationErrors
    ];
  }

  // Chat message validation
  static validateChatMessage() {
    return [
      body('content')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Message content must be between 1 and 1000 characters'),
      body('message_type')
        .optional()
        .isIn(['text', 'image', 'file'])
        .withMessage('Message type must be text, image, or file'),
      body('reply_to')
        .optional()
        .isUUID()
        .withMessage('Reply to must be a valid UUID'),
      this.handleValidationErrors
    ];
  }

  // Chat room validation
  static validateChatRoom() {
    return [
      body('name')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Room name must be between 1 and 50 characters'),
      body('description')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Description must be 200 characters or less'),
      body('team_number')
        .optional()
        .isInt({ min: 31, max: 35 })
        .withMessage('Team number must be between 31 and 35'),
      body('is_public')
        .optional()
        .isBoolean()
        .withMessage('Is public must be a boolean'),
      this.handleValidationErrors
    ];
  }

  // Subscription validation
  static validateSubscriptionPlan() {
    return [
      body('plan')
        .isIn(['basic', 'premium'])
        .withMessage('Plan must be basic or premium'),
      body('success_url')
        .optional()
        .isURL()
        .withMessage('Success URL must be a valid URL'),
      body('cancel_url')
        .optional()
        .isURL()
        .withMessage('Cancel URL must be a valid URL'),
      this.handleValidationErrors
    ];
  }

  // Export format validation
  static validateExportFormat() {
    return [
      query('format')
        .optional()
        .isIn(['csv', 'json', 'ics'])
        .withMessage('Format must be csv, json, or ics'),
      this.handleValidationErrors
    ];
  }

  // UUID parameter validation
  static validateUUIDParam(paramName) {
    return [
      param(paramName)
        .isUUID()
        .withMessage(`${paramName} must be a valid UUID`),
      this.handleValidationErrors
    ];
  }

  // Search validation
  static validateSearch() {
    return [
      query('q')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
      this.handleValidationErrors
    ];
  }

  // Custom validation for Swedish formats
  static validateSwedishDate() {
    return [
      param('date')
        .custom((value) => {
          // Accept both YYYY-MM-DD and Swedish format
          const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
          const swedishDate = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value);
          
          if (!isoDate && !swedishDate) {
            throw new Error('Date must be in YYYY-MM-DD or DD/MM/YYYY format');
          }
          
          let date;
          if (isoDate) {
            date = new Date(value);
          } else {
            const [day, month, year] = value.split('/');
            date = new Date(year, month - 1, day);
          }
          
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
          }
          
          return true;
        }),
      this.handleValidationErrors
    ];
  }

  // Rate limiting validation helper
  static validateRateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
    const requests = new Map();
    
    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean old entries
      for (const [ip, timestamps] of requests.entries()) {
        requests.set(ip, timestamps.filter(time => time > windowStart));
        if (requests.get(ip).length === 0) {
          requests.delete(ip);
        }
      }
      
      // Check current requests
      const userRequests = requests.get(key) || [];
      
      if (userRequests.length >= maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retry_after: Math.ceil(windowMs / 1000)
        });
      }
      
      // Add current request
      userRequests.push(now);
      requests.set(key, userRequests);
      
      next();
    };
  }
}

module.exports = ValidationMiddleware;