/**
 * Export shift to Apple Calendar (iCal format)
 * @param {Object} shift - Shift object to export
 */
export function exportToAppleCalendar(shift) {
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

  // Format date and time for iCal
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

  // Format dates for iCal (YYYYMMDDTHHMMSSZ)
  const formatICalDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startTime = formatICalDate(startDateTime);
  const endTime = formatICalDate(endDateTime);
  const now = formatICalDate(new Date());

  // Generate unique ID for the event
  const uid = `shift-${shift.date}-${shift.team}-${shift.type}@skiftschema.se`;

  // Create iCal content
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Skiftschema//Shift Calendar//SV',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `SUMMARY:${shift.type}-skift - Lag ${shift.team}`,
    `DESCRIPTION:Skift: ${shift.type} (${timeRange.start}–${timeRange.end})\\n` +
    `Företag: ${shift.company}\\n` +
    `Avdelning: ${shift.department}\\n` +
    `Lag: ${shift.team}`,
    `LOCATION:${shift.company} - ${shift.department}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  // Create and download .ics file
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `skift-${shift.date}-lag${shift.team}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  window.URL.revokeObjectURL(url);
}