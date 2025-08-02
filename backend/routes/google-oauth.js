const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

router.post('/oauth', async (req, res) => {
  const { code, redirect_uri } = req.body;

  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenRes.json();

  if (tokens.access_token) {
    // Spara tokens till Supabase
    const supabase = require('../utils/supabaseClient');
    await supabase
      .from('user_tokens')
      .upsert({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: Date.now() + tokens.expires_in * 1000,
      });

    return res.status(200).json({ success: true });
  }

  res.status(500).json({ error: tokens });
});

module.exports = router;