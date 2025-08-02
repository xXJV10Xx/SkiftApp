const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BACKEND_URL}/auth/google/callback`
);

// Routes

// Web OAuth flow - redirect till Google
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'profile', 
      'email', 
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ],
  });
  res.redirect(url);
});

// Web OAuth callback
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    
    // Hämta användarinfo
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Spara tokens i Supabase
    await saveUserTokens(userInfo, tokens);
    
    console.log('Web OAuth success for user:', userInfo.email);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?auth=success`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
});

// Mobile OAuth - ta emot access_token från mobilapp
app.post('/google-token', async (req, res) => {
  try {
    const { access_token, refresh_token, user_info } = req.body;

    if (!access_token || !user_info) {
      return res.status(400).json({ error: 'Missing access_token or user_info' });
    }

    // Spara tokens i Supabase
    await saveUserTokens(user_info, {
      access_token,
      refresh_token,
      scope: 'profile email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
      token_type: 'Bearer'
    });

    res.json({ success: true, message: 'Tokens saved successfully' });
  } catch (error) {
    console.error('Token save error:', error);
    res.status(500).json({ error: 'Failed to save tokens' });
  }
});

// Funktion för att spara användarens tokens
async function saveUserTokens(userInfo, tokens) {
  // Först, kolla om användaren redan finns
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('email', userInfo.email)
    .single();

  let userId;
  
  if (existingUser) {
    userId = existingUser.id;
  } else {
    // Skapa ny användare
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: userInfo.email,
        full_name: userInfo.name,
        avatar_url: userInfo.picture,
        google_id: userInfo.id
      })
      .select('id')
      .single();

    if (createError) throw createError;
    userId = newUser.id;
  }

  // Spara eller uppdatera Google tokens
  const { error: tokenError } = await supabase
    .from('google_tokens')
    .upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type || 'Bearer',
      scope: tokens.scope,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (tokenError) throw tokenError;
}

// Test API för att exportera kalenderhändelse
app.post('/calendar/export', async (req, res) => {
  try {
    const { user_email, event_data } = req.body;

    if (!user_email || !event_data) {
      return res.status(400).json({ error: 'Missing user_email or event_data' });
    }

    // Hämta användarens tokens
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        google_tokens (
          access_token,
          refresh_token,
          expires_at
        )
      `)
      .eq('email', user_email)
      .single();

    if (userError || !user.google_tokens) {
      return res.status(404).json({ error: 'User or tokens not found' });
    }

    const tokens = user.google_tokens;

    // Kontrollera om token har gått ut och förnya om nödvändigt
    if (tokens.expires_at && new Date(tokens.expires_at) <= new Date()) {
      if (!tokens.refresh_token) {
        return res.status(401).json({ error: 'Token expired and no refresh token available' });
      }

      oauth2Client.setCredentials({
        refresh_token: tokens.refresh_token
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Uppdatera tokens i databasen
      await supabase
        .from('google_tokens')
        .update({
          access_token: credentials.access_token,
          expires_at: new Date(credentials.expiry_date).toISOString()
        })
        .eq('user_id', user.id);

      oauth2Client.setCredentials(credentials);
    } else {
      oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token
      });
    }

    // Skapa kalenderhändelse
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: event_data.title || 'Skift',
      description: event_data.description || 'Exporterat från Skiftappen',
      start: {
        dateTime: event_data.start_time,
        timeZone: event_data.timezone || 'Europe/Stockholm',
      },
      end: {
        dateTime: event_data.end_time,
        timeZone: event_data.timezone || 'Europe/Stockholm',
      },
      location: event_data.location,
    };

    const result = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    res.json({
      success: true,
      event_id: result.data.id,
      event_link: result.data.htmlLink,
      message: 'Event created successfully'
    });

  } catch (error) {
    console.error('Calendar export error:', error);
    res.status(500).json({ 
      error: 'Failed to export event to calendar',
      details: error.message 
    });
  }
});

// Hälsokontroll
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Starta server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📅 Google OAuth ready`);
  console.log(`🔗 Callback URL: ${process.env.BACKEND_URL}/auth/google/callback`);
});

module.exports = app;