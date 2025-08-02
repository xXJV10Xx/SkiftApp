const express = require('express');
const cors = require('cors');
const { handleWebhook } = require('../lib/webhooks');
require('dotenv').config();

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Webhook endpoint for Supabase
app.post('/webhook/shifts', async (req, res) => {
  console.log('Received webhook:', req.body);
  await handleWebhook(req, res);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook/shifts`);
});

module.exports = app;