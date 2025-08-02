const { createEvent } = require('./calendar');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Webhook handler for new shifts
 * This function is triggered when a new shift is inserted into the shifts table
 */
async function handleNewShift(payload) {
  try {
    const { record } = payload;
    
    // Get employee information
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email')
      .eq('id', record.employee_id)
      .single();

    if (employeeError || !employee) {
      console.error('Employee not found:', employeeError);
      return;
    }

    // Get shift type information
    const { data: shiftType, error: shiftTypeError } = await supabase
      .from('shift_types')
      .select('name, color')
      .eq('id', record.shift_type_id)
      .single();

    if (shiftTypeError || !shiftType) {
      console.error('Shift type not found:', shiftTypeError);
      return;
    }

    // Check if employee has Google Calendar integration enabled
    const { data: tokenRow, error: tokenError } = await supabase
      .from('google_tokens')
      .select('*')
      .eq('user_id', employee.id)
      .single();

    if (tokenError || !tokenRow) {
      console.log(`Employee ${employee.email} does not have Google Calendar integration enabled`);
      return;
    }

    // Create calendar event data
    const eventData = {
      title: `${shiftType.name} - Skiftappen`,
      description: `Skift för ${employee.first_name} ${employee.last_name}\n\nSkifttyp: ${shiftType.name}\nSkapad via Skiftappen`,
      start: record.start_time,
      end: record.end_time,
    };

    // Create the calendar event
    const calendarEvent = await createEvent(employee.id, eventData);
    
    // Update the shift record with the calendar event ID
    await supabase
      .from('shifts')
      .update({ 
        calendar_event_id: calendarEvent.id,
        synced_to_calendar: true,
        calendar_sync_at: new Date().toISOString()
      })
      .eq('id', record.id);

    console.log(`Calendar event created for shift ${record.id}: ${calendarEvent.id}`);
    
  } catch (error) {
    console.error('Error handling new shift webhook:', error);
    
    // Update shift record to indicate sync failure
    if (payload.record?.id) {
      await supabase
        .from('shifts')
        .update({ 
          calendar_sync_error: error.message,
          calendar_sync_at: new Date().toISOString()
        })
        .eq('id', payload.record.id);
    }
  }
}

/**
 * Webhook handler for updated shifts
 * This function is triggered when a shift is updated
 */
async function handleUpdatedShift(payload) {
  try {
    const { record, old_record } = payload;
    
    // Only sync if the shift times have changed or if it wasn't synced before
    const timesChanged = 
      record.start_time !== old_record.start_time || 
      record.end_time !== old_record.end_time;
    
    if (!timesChanged && record.synced_to_calendar) {
      return; // No need to update calendar
    }

    // Get employee information
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email')
      .eq('id', record.employee_id)
      .single();

    if (employeeError || !employee) {
      console.error('Employee not found:', employeeError);
      return;
    }

    // Check if employee has Google Calendar integration
    const { data: tokenRow, error: tokenError } = await supabase
      .from('google_tokens')
      .select('*')
      .eq('user_id', employee.id)
      .single();

    if (tokenError || !tokenRow) {
      console.log(`Employee ${employee.email} does not have Google Calendar integration enabled`);
      return;
    }

    // If there's an existing calendar event, we need to update or delete it
    if (record.calendar_event_id) {
      // For now, we'll delete the old event and create a new one
      // In a production app, you might want to update the existing event instead
      await deleteCalendarEvent(employee.id, record.calendar_event_id);
    }

    // Get shift type information
    const { data: shiftType, error: shiftTypeError } = await supabase
      .from('shift_types')
      .select('name, color')
      .eq('id', record.shift_type_id)
      .single();

    if (shiftTypeError || !shiftType) {
      console.error('Shift type not found:', shiftTypeError);
      return;
    }

    // Create new calendar event
    const eventData = {
      title: `${shiftType.name} - Skiftappen`,
      description: `Skift för ${employee.first_name} ${employee.last_name}\n\nSkifttyp: ${shiftType.name}\nUppdaterad via Skiftappen`,
      start: record.start_time,
      end: record.end_time,
    };

    const calendarEvent = await createEvent(employee.id, eventData);
    
    // Update the shift record
    await supabase
      .from('shifts')
      .update({ 
        calendar_event_id: calendarEvent.id,
        synced_to_calendar: true,
        calendar_sync_at: new Date().toISOString(),
        calendar_sync_error: null
      })
      .eq('id', record.id);

    console.log(`Calendar event updated for shift ${record.id}: ${calendarEvent.id}`);
    
  } catch (error) {
    console.error('Error handling updated shift webhook:', error);
    
    if (payload.record?.id) {
      await supabase
        .from('shifts')
        .update({ 
          calendar_sync_error: error.message,
          calendar_sync_at: new Date().toISOString()
        })
        .eq('id', payload.record.id);
    }
  }
}

/**
 * Helper function to delete a calendar event
 */
async function deleteCalendarEvent(userId, eventId) {
  try {
    const { google } = require('googleapis');
    
    const { data: tokenRow, error } = await supabase
      .from('google_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !tokenRow) {
      console.error('Token not found for deleting calendar event');
      return;
    }

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
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    console.log(`Calendar event ${eventId} deleted`);
  } catch (error) {
    console.error('Error deleting calendar event:', error);
  }
}

/**
 * Main webhook handler
 * This function routes webhook events to the appropriate handler
 */
async function handleWebhook(req, res) {
  try {
    const { type, table, record, old_record } = req.body;
    
    if (table !== 'shifts') {
      return res.status(200).json({ message: 'Webhook received but not for shifts table' });
    }

    switch (type) {
      case 'INSERT':
        await handleNewShift({ record });
        break;
      
      case 'UPDATE':
        await handleUpdatedShift({ record, old_record });
        break;
      
      case 'DELETE':
        // Handle shift deletion if needed
        if (record.calendar_event_id) {
          const { data: employee } = await supabase
            .from('employees')
            .select('id')
            .eq('id', record.employee_id)
            .single();
          
          if (employee) {
            await deleteCalendarEvent(employee.id, record.calendar_event_id);
          }
        }
        break;
      
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  handleWebhook,
  handleNewShift,
  handleUpdatedShift,
  deleteCalendarEvent
};