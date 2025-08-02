import * as Calendar from 'expo-calendar';
import * as Permissions from 'expo-permissions';

async function getCalendarId() {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') throw new Error('Ingen kalenderbehörighet');

  const calendars = await Calendar.getCalendarsAsync();
  const defaultCalendar = calendars.find(c => c.allowsModifications);
  return defaultCalendar.id;
}

export async function exportToGoogleCalendar(events) {
  try {
    const calendarId = await getCalendarId();
    for (let ev of events) {
      await Calendar.createEventAsync(calendarId, {
        title: ev.summary,
        startDate: new Date(ev.start),
        endDate: new Date(ev.end),
        notes: ev.description,
        timeZone: 'Europe/Stockholm',
      });
    }
    alert('Skift exporterat till kalender');
  } catch (e) {
    alert('Fel vid export: ' + e.message);
  }
}

export async function exportToAppleCalendar(events) {
  return exportToGoogleCalendar(events); // fungerar likadant i Expo
}