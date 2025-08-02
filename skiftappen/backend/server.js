import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Skiftappen API Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// API routes for shifts
app.get('/api/shifts', (req, res) => {
  // TODO: Implement shift data retrieval
  res.json({
    message: 'Shifts endpoint - implement shift data retrieval',
    shifts: []
  });
});

app.post('/api/shifts', (req, res) => {
  // TODO: Implement shift creation
  res.json({
    message: 'Create shift endpoint - implement shift creation',
    data: req.body
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Skiftappen server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
});

export default app;