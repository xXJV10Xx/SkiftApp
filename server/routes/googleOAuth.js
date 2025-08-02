const express = require('express');
const axios = require('axios');
const router = express.Router();

const CLIENT_ID = 'DIN_GOOGLE_CLIENT_ID';
const CLIENT_SECRET = 'DIN_GOOGLE_CLIENT_SECRET';

router.post('/oauth', async (req, res) => {
  const { code, redirect_uri } = req.body;

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token } = response.data;

    // 💾 SPARA I SUPABASE / DB PER ANVÄNDARE
    console.log('Tokens:', access_token, refresh_token);

    res.json({ success: true });
  } catch (err) {
    console.error('OAuth error:', err.response.data);
    res.status(400).json({ error: 'Token exchange failed' });
  }
});

module.exports = router;