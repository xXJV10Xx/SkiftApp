/**
 * Export shift to Google Calendar
 * @param {Object} shift - Shift object to export
 */
export function exportToGoogleCalendar(shift) {
  // Convert shift type to time ranges
  const timeRanges = {
    F: { start: '06:00', end: '14:00' },
    E: { start: '14:00', end: '22:00' },
    N: { start: '22:00', end: '06:00' }
  };

  const timeRange = timeRanges[shift.type];
  if (!timeRange) {
    alert('Okänd skifttyp');
    return;
  }

  // Format date and time for Google Calendar
  const date = new Date(shift.date);
  const startDateTime = new Date(date);
  const endDateTime = new Date(date);

  // Set start time
  const [startHour, startMinute] = timeRange.start.split(':');
  startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

  // Set end time (handle night shift crossing midnight)
  const [endHour, endMinute] = timeRange.end.split(':');
  endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
  
  if (shift.type === 'N') {
    // Night shift ends next day
    endDateTime.setDate(endDateTime.getDate() + 1);
  }

  // Format dates for Google Calendar URL
  const formatDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startTime = formatDate(startDateTime);
  const endTime = formatDate(endDateTime);

  // Create event details
  const title = encodeURIComponent(`${shift.type}-skift - Lag ${shift.team}`);
  const details = encodeURIComponent(
    `Skift: ${shift.type} (${timeRange.start}–${timeRange.end})\n` +
    `Företag: ${shift.company}\n` +
    `Avdelning: ${shift.department}\n` +
    `Lag: ${shift.team}`
  );
  const location = encodeURIComponent(`${shift.company} - ${shift.department}`);

  // Construct Google Calendar URL
  const googleCalendarUrl = 
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${title}` +
    `&dates=${startTime}/${endTime}` +
    `&details=${details}` +
    `&location=${location}` +
    `&sf=true&output=xml`;

  // Open Google Calendar in new window
  window.open(googleCalendarUrl, '_blank');
}