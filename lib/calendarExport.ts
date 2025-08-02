import { generateICS } from './appleCalendar.js';
import { exportToGoogleCalendar } from './googleCalendar.js';

export interface CalendarEvent {
  title: string;
  description: string;
  start: string; // ISO string
  end: string; // ISO string
}

export interface ShiftData {
  date: Date;
  shiftCode: string;
  shiftName: string;
  startTime?: string;
  endTime?: string;
  team: string;
  company: string;
}

// Convert shift data to calendar events
export function convertShiftsToEvents(shifts: ShiftData[]): CalendarEvent[] {
  return shifts
    .filter(shift => shift.shiftCode !== 'L') // Skip "Ledig" (free days)
    .map(shift => {
      const date = shift.date;
      const dateStr = date.toISOString().split('T')[0];
      
      // Default times if not provided
      const startTime = shift.startTime || getDefaultStartTime(shift.shiftCode);
      const endTime = shift.endTime || getDefaultEndTime(shift.shiftCode);
      
      const start = new Date(`${dateStr}T${startTime}:00`).toISOString();
      const end = new Date(`${dateStr}T${endTime}:00`).toISOString();
      
      return {
        title: `${shift.shiftName} - ${shift.team}`,
        description: `Skift: ${shift.shiftName} (${shift.shiftCode})\nLag: ${shift.team}\nFöretag: ${shift.company}`,
        start,
        end
      };
    });
}

// Get default start time for shift codes
function getDefaultStartTime(shiftCode: string): string {
  const defaultTimes: Record<string, string> = {
    'M': '06:00', // Morgon
    'A': '14:00', // Kväll/Afternoon
    'N': '22:00', // Natt
    'F': '06:00', // Förmiddag
    'E': '14:00', // Eftermiddag
    'D': '06:00', // Dag
  };
  return defaultTimes[shiftCode] || '08:00';
}

// Get default end time for shift codes
function getDefaultEndTime(shiftCode: string): string {
  const defaultTimes: Record<string, string> = {
    'M': '14:00', // Morgon
    'A': '22:00', // Kväll/Afternoon
    'N': '06:00', // Natt (next day)
    'F': '14:00', // Förmiddag
    'E': '22:00', // Eftermiddag
    'D': '18:00', // Dag
  };
  return defaultTimes[shiftCode] || '16:00';
}

// Export to ICS file (Apple Calendar compatible)
export function exportToICS(shifts: ShiftData[]): void {
  const events = convertShiftsToEvents(shifts);
  generateICS(events);
}

// Export to Google Calendar
export async function exportToGoogle(shifts: ShiftData[], oauth2Client: any): Promise<void> {
  const events = convertShiftsToEvents(shifts);
  await exportToGoogleCalendar(events, oauth2Client);
}

// Generate download link for ICS file
export function generateICSDownload(shifts: ShiftData[]): string {
  const events = convertShiftsToEvents(shifts);
  
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
    lines.push(`DTSTART:${event.start.replace(/[-:]/g, '').split('.')[0]}Z`);
    lines.push(`DTEND:${event.end.replace(/[-:]/g, '').split('.')[0]}Z`);
    lines.push(`DESCRIPTION:${event.description || ''}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  const content = lines.join('\r\n');
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  return URL.createObjectURL(blob);
}