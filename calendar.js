const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to get valid tokens for a user
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
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

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
    
    oauth2Client.setCredentials(credentials);
    return oauth2Client;
  }
  
  oauth2Client.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token
  });
  
  return oauth2Client;
}

// 📅 Skapa kalenderhändelse
router.post('/calendar/create-event', async (req, res) => {
  try {
    const { 
      userEmail, 
      title, 
      description, 
      startTime, 
      endTime, 
      location,
      attendees = [] 
    } = req.body;

    if (!userEmail || !title || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'Missing required fields: userEmail, title, startTime, endTime' 
      });
    }

    // Get authenticated client
    const auth = await getValidTokens(userEmail);
    const calendar = google.calendar({ version: 'v3', auth });

    // Create event
    const event = {
      summary: title,
      description: description,
      location: location,
      start: {
        dateTime: startTime,
        timeZone: 'Europe/Stockholm',
      },
      end: {
        dateTime: endTime,
        timeZone: 'Europe/Stockholm',
      },
      attendees: attendees.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    // 💾 Spara händelse i Supabase
    const { data: eventData, error: dbError } = await supabase
      .from('calendar_events')
      .insert([
        {
          google_event_id: response.data.id,
          user_email: userEmail,
          title: title,
          description: description,
          start_time: startTime,
          end_time: endTime,
          location: location,
          attendees: attendees,
          google_calendar_link: response.data.htmlLink
        }
      ])
      .select();

    if (dbError) {
      console.error('Database error:', dbError);
    }

    // 🔔 Skicka push-notifikation
    await sendPushNotification(userEmail, {
      title: '📅 Ny händelse skapad',
      body: `${title} har lagts till i din kalender`,
      data: {
        eventId: response.data.id,
        type: 'calendar_event_created'
      }
    });

    res.json({
      success: true,
      event: response.data,
      eventData: eventData?.[0]
    });

  } catch (error) {
    console.error('Calendar error:', error);
    res.status(500).json({ 
      error: 'Failed to create calendar event',
      details: error.message 
    });
  }
});

// 📋 Hämta användarens kalenderhändelser
router.get('/calendar/events/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { timeMin, timeMax } = req.query;

    const auth = await getValidTokens(userEmail);
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json({
      success: true,
      events: response.data.items
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ 
      error: 'Failed to get calendar events',
      details: error.message 
    });
  }
});

// ✏️ Uppdatera kalenderhändelse
router.put('/calendar/update-event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { 
      userEmail, 
      title, 
      description, 
      startTime, 
      endTime, 
      location 
    } = req.body;

    const auth = await getValidTokens(userEmail);
    const calendar = google.calendar({ version: 'v3', auth });

    // Get existing event
    const existingEvent = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId,
    });

    // Update event
    const updatedEvent = {
      ...existingEvent.data,
      summary: title || existingEvent.data.summary,
      description: description || existingEvent.data.description,
      location: location || existingEvent.data.location,
      start: startTime ? {
        dateTime: startTime,
        timeZone: 'Europe/Stockholm',
      } : existingEvent.data.start,
      end: endTime ? {
        dateTime: endTime,
        timeZone: 'Europe/Stockholm',
      } : existingEvent.data.end,
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: updatedEvent,
    });

    // 💾 Uppdatera i Supabase
    await supabase
      .from('calendar_events')
      .update({
        title: title,
        description: description,
        start_time: startTime,
        end_time: endTime,
        location: location,
        updated_at: new Date().toISOString()
      })
      .eq('google_event_id', eventId);

    // 🔔 Push-notifikation
    await sendPushNotification(userEmail, {
      title: '📅 Händelse uppdaterad',
      body: `${title || existingEvent.data.summary} har uppdaterats`,
      data: {
        eventId: eventId,
        type: 'calendar_event_updated'
      }
    });

    res.json({
      success: true,
      event: response.data
    });

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ 
      error: 'Failed to update calendar event',
      details: error.message 
    });
  }
});

// 🗑️ Ta bort kalenderhändelse
router.delete('/calendar/delete-event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userEmail } = req.body;

    const auth = await getValidTokens(userEmail);
    const calendar = google.calendar({ version: 'v3', auth });

    // Get event title before deletion
    const existingEvent = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId,
    });

    // Delete from Google Calendar
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    // 💾 Ta bort från Supabase
    await supabase
      .from('calendar_events')
      .delete()
      .eq('google_event_id', eventId);

    // 🔔 Push-notifikation
    await sendPushNotification(userEmail, {
      title: '📅 Händelse borttagen',
      body: `${existingEvent.data.summary} har tagits bort från din kalender`,
      data: {
        eventId: eventId,
        type: 'calendar_event_deleted'
      }
    });

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ 
      error: 'Failed to delete calendar event',
      details: error.message 
    });
  }
});

// 🔔 Skicka push-notifikation via Supabase
async function sendPushNotification(userEmail, notification) {
  try {
    // Spara notifikation i Supabase
    const { error } = await supabase
      .from('notifications')
      .insert([
        {
          user_email: userEmail,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sent_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Notification save error:', error);
    }

    // Här kan du integrera med push-tjänster som Firebase, OneSignal etc.
    console.log(`📱 Push notification sent to ${userEmail}:`, notification);

  } catch (error) {
    console.error('Push notification error:', error);
  }
}

// 📊 Hämta användarens skiftschema från Supabase
router.get('/calendar/shifts/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('shifts')
      .select('*')
      .eq('user_email', userEmail)
      .order('start_time', { ascending: true });

    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('end_time', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      shifts: data
    });

  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ 
      error: 'Failed to get shifts',
      details: error.message 
    });
  }
});

// 🔄 Synka skift till Google Calendar
router.post('/calendar/sync-shifts', async (req, res) => {
  try {
    const { userEmail } = req.body;

    // Hämta alla kommande skift
    const { data: shifts, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_email', userEmail)
      .gte('start_time', new Date().toISOString())
      .is('google_event_id', null); // Endast skift som inte redan är synkade

    if (error) throw error;

    const auth = await getValidTokens(userEmail);
    const calendar = google.calendar({ version: 'v3', auth });

    const syncedShifts = [];

    for (const shift of shifts) {
      try {
        const event = {
          summary: `🏢 ${shift.title || 'Arbetspass'}`,
          description: `Arbetspass: ${shift.description || 'Inget beskrivning'}`,
          location: shift.location,
          start: {
            dateTime: shift.start_time,
            timeZone: 'Europe/Stockholm',
          },
          end: {
            dateTime: shift.end_time,
            timeZone: 'Europe/Stockholm',
          },
          colorId: '9', // Blå färg för arbetspass
        };

        const response = await calendar.events.insert({
          calendarId: 'primary',
          resource: event,
        });

        // Uppdatera skift med Google event ID
        await supabase
          .from('shifts')
          .update({ google_event_id: response.data.id })
          .eq('id', shift.id);

        syncedShifts.push({
          shiftId: shift.id,
          googleEventId: response.data.id
        });

      } catch (eventError) {
        console.error(`Failed to sync shift ${shift.id}:`, eventError);
      }
    }

    res.json({
      success: true,
      message: `Synced ${syncedShifts.length} shifts to Google Calendar`,
      syncedShifts
    });

  } catch (error) {
    console.error('Sync shifts error:', error);
    res.status(500).json({ 
      error: 'Failed to sync shifts',
      details: error.message 
    });
  }
});

module.exports = router;