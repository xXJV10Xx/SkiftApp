import { ShiftEvent } from './types';

export const exportToGoogleCalendar = (events: ShiftEvent[]): void => {
  const baseUrl = 'https://calendar.google.com/calendar/u/0/r/eventedit';

  if (!events || events.length === 0) {
    alert('Inga skift att exportera.');
    return;
  }

  events.forEach((event) => {
    const { title, date, startTime, endTime } = event;

    const start = `${date}T${startTime.replace(':', '')}00Z`;
    const end = `${date}T${endTime.replace(':', '')}00Z`;

    const params = new URLSearchParams({
      text: title,
      dates: `${start}/${end}`,
      details: 'Importerat från Skiftappen',
    });

    const url = `${baseUrl}?${params.toString()}`;
    window.open(url, '_blank');
  });
};