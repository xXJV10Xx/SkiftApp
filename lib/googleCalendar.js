import { google } from 'googleapis';
import { formatISO } from 'date-fns';

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function exportToGoogleCalendar(events, tokens) {
  oAuth2Client.setCredentials(tokens);

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  for (const event of events) {
    const gEvent = {
      summary: event.title,
      description: event.description || '',
      start: { dateTime: formatISO(new Date(event.start)) },
      end: { dateTime: formatISO(new Date(event.end)) },
    };

    await calendar.events.insert({
      calendarId: 'primary',
      resource: gEvent,
    });
  }
}

// Funktion för att generera OAuth URL
export function getAuthUrl() {
  const scopes = ['https://www.googleapis.com/auth/calendar'];
  
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
}

// Funktion för att hämta tokens från authorization code
export async function getTokensFromCode(code) {
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
}

// Funktion för att uppdatera tokens
export async function refreshTokens(refreshToken) {
  oAuth2Client.setCredentials({
    refresh_token: refreshToken
  });
  
  const { credentials } = await oAuth2Client.refreshAccessToken();
  return credentials;
}