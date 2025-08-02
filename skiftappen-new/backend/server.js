const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.API_PORT || 3001;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all shifts
app.get('/api/shifts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get shifts by team
app.get('/api/shifts/team/:team', async (req, res) => {
  try {
    const { team } = req.params;
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('team', team)
      .order('date', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get shifts by date range
app.get('/api/shifts/range', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = supabase.from('shifts').select('*');
    
    if (start_date) {
      query = query.gte('date', start_date);
    }
    
    if (end_date) {
      query = query.lte('date', end_date);
    }
    
    const { data, error } = await query.order('date', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get unique teams
app.get('/api/teams', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('team')
      .order('team');

    if (error) throw error;

    const uniqueTeams = [...new Set(data.map(item => item.team))];

    res.json({
      success: true,
      data: uniqueTeams,
      count: uniqueTeams.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API endpoints: http://localhost:${PORT}/api/shifts`);
});