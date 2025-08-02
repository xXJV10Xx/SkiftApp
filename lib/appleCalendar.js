import { writeFileSync } from 'fs';
import { format } from 'date-fns';

export function generateICS(events) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'PRODID:-//SkiftApp//EN',
  ];

  events.forEach((event, i) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:event-${i}@skiftapp`);
    lines.push(`SUMMARY:${event.title}`);
    lines.push(`DTSTART:${format(new Date(event.start), "yyyyMMdd'T'HHmmss")}`);
    lines.push(`DTEND:${format(new Date(event.end), "yyyyMMdd'T'HHmmss")}`);
    lines.push(`DESCRIPTION:${event.description || ''}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  const content = lines.join('\r\n');
  writeFileSync('shifts.ics', content);
  console.log('✅ shifts.ics generated');
}