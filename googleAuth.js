const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events'],
  });
  res.redirect(url);
});

router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // 🔐 Spara tokens i Supabase
    const { data, error } = await supabase.from('google_tokens').insert([
      {
        user_email: userInfo.data.email,
        user_name: userInfo.data.name,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date,
      },
    ]);

    if (error) throw error;

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error('OAuth Error:', err);
    res.status(500).send('OAuth failed');
  }
});

// Helper function to get valid tokens
async function getValidTokens(userEmail) {
  const { data, error } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data.length) {
    throw new Error('No tokens found for user');
  }

  const tokenData = data[0];
  
  // Check if token needs refresh
  if (Date.now() > tokenData.expires_at) {
    oauth2Client.setCredentials({
      refresh_token: tokenData.refresh_token
    });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update tokens in database
    await supabase
      .from('google_tokens')
      .update({
        access_token: credentials.access_token,
        expires_at: credentials.expiry_date
      })
      .eq('id', tokenData.id);
    
    return credentials;
  }
  
  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token
  };
}

module.exports = router;