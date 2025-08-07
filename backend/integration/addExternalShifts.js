/**
 * Integration script to add external shifts to the main server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import routes
const externalShiftsRoutes = require('../routes/externalShiftsRoutes');

function addExternalShiftsToApp(app) {
  console.log('🔗 Integrating external shifts functionality...');
  
  // Add external shifts routes
  app.use('/api/external-shifts', externalShiftsRoutes);
  
  console.log('✅ External shifts routes added to /api/external-shifts');
  
  // Log available endpoints
  console.log('\n📋 Available External Shifts Endpoints:');
  console.log('   GET  /api/external-shifts/health');
  console.log('   GET  /api/external-shifts/companies');
  console.log('   GET  /api/external-shifts/companies/search?q=query');
  console.log('   GET  /api/external-shifts/companies/:companyId');
  console.log('   GET  /api/external-shifts/companies/:companyId/export');
  console.log('   GET  /api/external-shifts/companies/:companyId/teams/:team/schedule');
  console.log('   GET  /api/external-shifts/companies/:companyId/teams/:team/statistics');
  console.log('   GET  /api/external-shifts/companies/:companyId/teams/:team/ssab-format');
  
  return app;
}

// Standalone server for testing external shifts
function createExternalShiftsServer() {
  const app = express();
  
  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(morgan('combined'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use(limiter);
  
  // Add external shifts functionality
  addExternalShiftsToApp(app);
  
  // Health check for the standalone server
  app.get('/health', (req, res) => {
    res.json({
      service: 'External Shifts Server',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      endpoints: [
        '/api/external-shifts/health',
        '/api/external-shifts/companies',
        '/api/external-shifts/companies/search',
        '/api/external-shifts/companies/:companyId',
        '/api/external-shifts/companies/:companyId/teams/:team/schedule'
      ]
    });
  });
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Endpoint not found',
      availableEndpoints: ['/health', '/api/external-shifts/health']
    });
  });
  
  return app;
}

// CLI execution for standalone server
if (require.main === module) {
  const app = createExternalShiftsServer();
  const PORT = process.env.PORT || 3003;
  
  app.listen(PORT, () => {
    console.log(`🚀 External Shifts Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 Companies API: http://localhost:${PORT}/api/external-shifts/companies`);
    console.log(`🎯 Example schedule: http://localhost:${PORT}/api/external-shifts/companies/ssab_5skift/teams/A-lag/schedule`);
  });
}

module.exports = {
  addExternalShiftsToApp,
  createExternalShiftsServer
};