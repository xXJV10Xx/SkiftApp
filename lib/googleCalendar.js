import { google } from 'googleapis';

export async function exportToGoogleCalendar(events, oauth2Client) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  for (const event of events) {
    try {
      await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: event.title,
          description: event.description,
          start: {
            dateTime: event.start,
            timeZone: 'Europe/Stockholm',
          },
          end: {
            dateTime: event.end,
            timeZone: 'Europe/Stockholm',
          },
        },
      });
      console.log(`✅ Exported: ${event.title}`);
    } catch (err) {
      console.error(`❌ Failed to export ${event.title}`, err);
    }
  }
}