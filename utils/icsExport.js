import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Formatera datum för ICS format (YYYYMMDDTHHMMSSZ)
const formatDateForICS = (dateString, timeString = '00:00') => {
  const date = new Date(`${dateString}T${timeString}`);
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

// Skapa ICS innehåll
const createICSContent = (shifts, selectedTeam = null) => {
  const now = new Date();
  const timestamp = formatDateForICS(now.toISOString().split('T')[0], now.toTimeString().split(' ')[0]);
  
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Skiftappen//Skiftschema//SV',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Skiftschema${selectedTeam ? ` - Lag ${selectedTeam}` : ''}`,
    'X-WR-TIMEZONE:Europe/Stockholm',
    'X-WR-CALDESC:Automatiskt genererat skiftschema'
  ];

  shifts.forEach((shift, index) => {
    const startTime = formatDateForICS(shift.date, shift.start_time || '06:00');
    const endTime = formatDateForICS(shift.date, shift.end_time || '18:00');
    const uid = `shift-${shift.id || index}-${timestamp}@skiftappen.se`;
    
    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:Skift: ${shift.type || 'Okänt'} (Lag ${shift.team})`,
      `DESCRIPTION:Skifttyp: ${shift.type || 'Okänt'}\\nLag: ${shift.team}\\nTid: ${shift.start_time || '06:00'} - ${shift.end_time || '18:00'}`,
      `LOCATION:${shift.location || 'Arbetsplats'}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');
  
  return icsContent.join('\r\n');
};

// Exportera skift till ICS fil
export const exportShiftsToICS = async (shifts, selectedTeam = null) => {
  try {
    if (!shifts || shifts.length === 0) {
      throw new Error('Inga skift att exportera');
    }

    const icsContent = createICSContent(shifts, selectedTeam);
    const filename = `skiftschema${selectedTeam ? `_lag${selectedTeam}` : ''}_${new Date().toISOString().split('T')[0]}.ics`;
    const fileUri = FileSystem.documentDirectory + filename;

    await FileSystem.writeAsStringAsync(fileUri, icsContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Kontrollera om delning är tillgängligt
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/calendar',
        dialogTitle: 'Exportera skiftschema',
        UTI: 'public.calendar-event',
      });
    } else {
      throw new Error('Delning är inte tillgängligt på denna enhet');
    }

    return { success: true, filename, fileUri };
  } catch (error) {
    console.error('Error exporting to ICS:', error);
    throw error;
  }
};

// Validera ICS data
export const validateShiftData = (shifts) => {
  if (!Array.isArray(shifts)) {
    return { valid: false, error: 'Skiftdata måste vara en array' };
  }

  for (let i = 0; i < shifts.length; i++) {
    const shift = shifts[i];
    if (!shift.date) {
      return { valid: false, error: `Skift ${i + 1} saknar datum` };
    }
    if (!shift.team) {
      return { valid: false, error: `Skift ${i + 1} saknar lag` };
    }
  }

  return { valid: true };
};

export default { exportShiftsToICS, validateShiftData };