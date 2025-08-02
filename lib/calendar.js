const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createEvent(userId, eventData) {
  const { data: tokenRow, error } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokenRow) throw new Error('Token not found');

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: tokenRow.access_token,
    refresh_token: tokenRow.refresh_token,
    expiry_date: tokenRow.expires_at,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: eventData.title,
    description: eventData.description,
    start: {
      dateTime: eventData.start,
      timeZone: 'Europe/Stockholm',
    },
    end: {
      dateTime: eventData.end,
      timeZone: 'Europe/Stockholm',
    },
  };

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return res.data;
}

module.exports = { createEvent };