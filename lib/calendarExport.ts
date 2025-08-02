import { generateMonthSchedule, SHIFT_TYPES, ShiftType } from '@/data/ShiftSchedules';
import { generateICS } from './appleCalendar.js';
import { exportToGoogleCalendar } from './googleCalendar.js';

export interface CalendarEvent {
  title: string;
  description: string;
  start: string;
  end: string;
}

export function convertShiftScheduleToEvents(
  year: number,
  month: number,
  shiftType: ShiftType,
  team: string,
  companyName: string
): CalendarEvent[] {
  const schedule = generateMonthSchedule(year, month, shiftType, team);
  const events: CalendarEvent[] = [];

  schedule.forEach(day => {
    if (day.shift && day.shift !== 'L') { // Skip 'Ledig' (free) days
      const shiftInfo = shiftType.times[day.shift];
      if (shiftInfo && shiftInfo.start && shiftInfo.end) {
        const startDateTime = new Date(day.date);
        const endDateTime = new Date(day.date);
        
        // Parse start time
        const [startHour, startMinute] = shiftInfo.start.split(':').map(Number);
        startDateTime.setHours(startHour, startMinute, 0, 0);
        
        // Parse end time
        const [endHour, endMinute] = shiftInfo.end.split(':').map(Number);
        endDateTime.setHours(endHour, endMinute, 0, 0);
        
        // Handle night shifts that end the next day
        if (endHour < startHour) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }

        events.push({
          title: `${shiftInfo.name} - ${companyName} (${team})`,
          description: `${shiftType.name} - ${shiftInfo.name}skift\nTid: ${shiftInfo.start} - ${shiftInfo.end}\nLag: ${team}`,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString()
        });
      }
    }
  });

  return events;
}

export async function exportShiftsToGoogleCalendar(
  year: number,
  month: number,
  shiftTypeId: string,
  team: string,
  companyName: string,
  oauth2Client: any
) {
  const shiftType = Object.values(SHIFT_TYPES).find(st => st.id === shiftTypeId);
  if (!shiftType) {
    throw new Error(`Shift type ${shiftTypeId} not found`);
  }

  const events = convertShiftScheduleToEvents(year, month, shiftType, team, companyName);
  await exportToGoogleCalendar(events, oauth2Client);
}

export function exportShiftsToICS(
  year: number,
  month: number,
  shiftTypeId: string,
  team: string,
  companyName: string
): string {
  const shiftType = Object.values(SHIFT_TYPES).find(st => st.id === shiftTypeId);
  if (!shiftType) {
    throw new Error(`Shift type ${shiftTypeId} not found`);
  }

  const events = convertShiftScheduleToEvents(year, month, shiftType, team, companyName);
  const icsContent = generateICS(events);
  
  return icsContent;
}