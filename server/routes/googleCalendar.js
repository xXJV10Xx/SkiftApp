const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

const calendar = google.calendar('v3');

// Synka skift till Google Calendar
router.post('/sync-to-calendar', async (req, res) => {
  const { access_token, shift_id, title, date, time, duration } = req.body;

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token });

    const event = {
      summary: title,
      start: {
        dateTime: `${date}T${time}:00`,
        timeZone: 'Europe/Stockholm',
      },
      end: {
        dateTime: new Date(new Date(`${date}T${time}:00`).getTime() + duration * 60 * 60 * 1000).toISOString(),
        timeZone: 'Europe/Stockholm',
      },
      description: `Skift ID: ${shift_id}`,
    };

    const response = await calendar.events.insert({
      auth,
      calendarId: 'primary',
      resource: event,
    });

    console.log('Event created:', response.data.id);
    res.json({ success: true, eventId: response.data.id });
  } catch (err) {
    console.error('Calendar sync error:', err);
    res.status(500).json({ error: 'Failed to sync to calendar' });
  }
});

// Hämta händelser från Google Calendar
router.get('/events', async (req, res) => {
  const { access_token, timeMin, timeMax } = req.query;

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token });

    const response = await calendar.events.list({
      auth,
      calendarId: 'primary',
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dagar framåt
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items.map(event => ({
      id: event.id,
      title: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      description: event.description,
    }));

    res.json({ events });
  } catch (err) {
    console.error('Calendar fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

module.exports = router;