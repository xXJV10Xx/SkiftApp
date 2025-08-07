// 🚀 SSAB Skiftschema Premium API Server with Long-term Calendar (2022-2040)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import our SSAB system, calendar routes, universal system, and AI helper
const SSABSystem = require('./ssab-system');
const calendarRoutes = require('./routes/calendarRoutes');
const externalShiftsRoutes = require('./routes/externalShiftsRoutes');
const universalCalendarRoutes = require('./routes/universalCalendarRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 3003;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, '../frontend/dist'))); // Disabled for development

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
});

app.use('/api', limiter);

// Enhanced health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      shifts: 'active',
      calendar: 'active',
      externalShifts: 'active',
      universalCalendar: 'active'
    },
    features: {
      ssabCalculations: true,
      longTermScheduling: true,
      calendarGeneration: true,
      externalCompanies: true,
      teamComparison: true,
      multiCompanySupport: true,
      universalScheduleGenerator: true,
      instantGeneration: true,
      dateRange: '2022-2040',
      supportedCompanies: '30+'
    }
  });
});

// New calendar, external shifts, universal, and AI routes
app.use('/api/calendar', calendarRoutes);
app.use('/api/external-shifts', externalShiftsRoutes);
app.use('/api/universal', universalCalendarRoutes);
app.use('/api/ai', aiRoutes);

// Get shifts for specific team and date range
app.get('/api/shifts/:team', async (req, res) => {
  try {
    const { team } = req.params;
    const { startDate, endDate } = req.query;
    
    const teamNumber = parseInt(team);
    if (![31, 32, 33, 34, 35].includes(teamNumber)) {
      return res.status(400).json({ error: 'Invalid team. Must be 31-35' });
    }
    
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const shifts = SSABSystem.getTeamSchedule(teamNumber, start, end);
    
    res.json({
      team: teamNumber,
      period: { start, end },
      shifts,
      total: shifts.length
    });
  } catch (error) {
    console.error('Error fetching team shifts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get shifts for all teams for a specific date
app.get('/api/shifts/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const dayShifts = SSABSystem.getDayShifts(date);
    
    res.json({
      date,
      shifts: dayShifts,
      working_teams: dayShifts.filter(s => s.type !== 'L').length,
      coverage: {
        hasF: dayShifts.some(s => s.type === 'F'),
        hasE: dayShifts.some(s => s.type === 'E'),
        hasN: dayShifts.some(s => s.type === 'N')
      }
    });
  } catch (error) {
    console.error('Error fetching day shifts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get month schedule for all teams
app.get('/api/shifts/month/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (yearNum < 2023 || yearNum > 2040) {
      return res.status(400).json({ error: 'Year must be between 2023-2040' });
    }
    
    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Month must be between 1-12' });
    }
    
    const monthShifts = SSABSystem.getMonthSchedule(yearNum, monthNum);
    const validation = SSABSystem.validateMonth(yearNum, monthNum);
    
    res.json({
      year: yearNum,
      month: monthNum,
      shifts: monthShifts,
      validation,
      statistics: SSABSystem.getMonthStatistics(monthShifts)
    });
  } catch (error) {
    console.error('Error fetching month schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get next shift for a team
app.get('/api/next-shift/:team', async (req, res) => {
  try {
    const { team } = req.params;
    const teamNumber = parseInt(team);
    
    if (![31, 32, 33, 34, 35].includes(teamNumber)) {
      return res.status(400).json({ error: 'Invalid team. Must be 31-35' });
    }
    
    const nextShift = SSABSystem.getNextShift(teamNumber);
    
    if (!nextShift) {
      return res.status(404).json({ error: 'No upcoming shifts found' });
    }
    
    res.json({
      team: teamNumber,
      next_shift: nextShift,
      countdown: SSABSystem.getCountdownToShift(nextShift)
    });
  } catch (error) {
    console.error('Error fetching next shift:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current shift status for all teams
app.get('/api/current-status', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    
    const status = SSABSystem.getCurrentStatus(today, currentHour);
    
    res.json({
      date: today,
      time: new Date().toLocaleTimeString('sv-SE'),
      current_shift_time: SSABSystem.getCurrentShiftTime(currentHour),
      teams_status: status
    });
  } catch (error) {
    console.error('Error fetching current status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get team statistics
app.get('/api/statistics/:team', async (req, res) => {
  try {
    const { team } = req.params;
    const { year, month } = req.query;
    
    const teamNumber = parseInt(team);
    if (![31, 32, 33, 34, 35].includes(teamNumber)) {
      return res.status(400).json({ error: 'Invalid team. Must be 31-35' });
    }
    
    const yearNum = year ? parseInt(year) : new Date().getFullYear();
    const monthNum = month ? parseInt(month) : new Date().getMonth() + 1;
    
    const statistics = SSABSystem.getTeamStatistics(teamNumber, yearNum, monthNum);
    
    res.json({
      team: teamNumber,
      period: { year: yearNum, month: monthNum },
      statistics
    });
  } catch (error) {
    console.error('Error fetching team statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export schedule as CSV
app.get('/api/export/csv/:team', async (req, res) => {
  try {
    const { team } = req.params;
    const { startDate, endDate } = req.query;
    
    const teamNumber = parseInt(team);
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const csvData = SSABSystem.exportTeamCSV(teamNumber, start, end);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="ssab-lag-${teamNumber}-${start}-${end}.csv"`);
    res.send(csvData);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve React app for all other routes (disabled for development - frontend runs on separate port)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
// });

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SSAB Skiftschema Premium Server running on port ${PORT}`);
  console.log(`📅 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗓️  Calendar API: http://localhost:${PORT}/api/calendar`);
  console.log(`🏭 External Shifts: http://localhost:${PORT}/api/external-shifts`);
  console.log(`🌍 Universal Calendar: http://localhost:${PORT}/api/universal`);
  console.log(`🤖 AI Helper: http://localhost:${PORT}/api/ai`);
  console.log(`🔗 Frontend: http://localhost:${PORT}`);
  console.log(`📊 Date Range: 2022-2040 (18 years of scheduling)`);
  console.log(`🏢 Companies: 30+ Swedish companies supported`);
  console.log(`👥 Teams: All company teams and departments`);
});

module.exports = app;