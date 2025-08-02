const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const googleOAuthRoutes = require('./routes/googleOAuth');
const importICSRoutes = require('./routes/importICS');
const exportICSRoutes = require('./routes/exportICS');
const notifyRoutes = require('./routes/notify');
const googleCalendarRoutes = require('./routes/googleCalendar');
const emailNotificationRoutes = require('./routes/emailNotifications');

// API endpoints
app.use('/api/google', googleOAuthRoutes);
app.use('/api', importICSRoutes);
app.use('/api', exportICSRoutes);
app.use('/api', notifyRoutes);
app.use('/api/calendar', googleCalendarRoutes);
app.use('/api/email', emailNotificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📅 Calendar API ready`);
  console.log(`📧 Email notifications configured`);
  console.log(`🔗 Google OAuth integration active`);
});

module.exports = app;