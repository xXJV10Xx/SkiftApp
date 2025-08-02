import { ShiftEvent } from './types';

export const exportToAppleCalendar = (events: ShiftEvent[]): void => {
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
  ];

  events.forEach((event, i) => {
    const { title, date, startTime, endTime } = event;
    const uid = `skift-${i}@skiftappen.se`;

    const dtStart = `${date.replace(/-/g, '')}T${startTime.replace(':', '')}00Z`;
    const dtEnd = `${date.replace(/-/g, '')}T${endTime.replace(':', '')}00Z`;

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${title}`,
      'DESCRIPTION:Skift importerat från Skiftappen',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\n')], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'skiftappen.ics';
  link.click();
};