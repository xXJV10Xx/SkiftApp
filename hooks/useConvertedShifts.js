import { useEffect, useState } from 'react';
import { useShifts } from './useShifts';

// Hook för att konvertera skift till kalenderformat och filtrera på lag
export default function useConvertedShifts(selectedTeam) {
  const { shifts, loading, error } = useShifts();
  const [convertedEvents, setConvertedEvents] = useState([]);

  useEffect(() => {
    if (!shifts || shifts.length === 0) {
      setConvertedEvents([]);
      return;
    }

    // Filtrera skift baserat på valt lag (om det finns team-info i datan)
    // Annars returnera alla skift
    const filteredShifts = selectedTeam 
      ? shifts.filter(shift => {
          // Antag att team-info finns i shift objektet
          // Anpassa detta baserat på din faktiska datastruktur
          return shift.team_id === selectedTeam || 
                 shift.lag === selectedTeam ||
                 !shift.team_id; // Inkludera skift utan team-info
        })
      : shifts;

    // Konvertera till kalenderformat
    const events = filteredShifts.map(shift => ({
      id: shift.uuid || shift.id,
      title: `${shift.shift_type}skift`,
      date: shift.date,
      shift_type: shift.shift_type,
      uuid: shift.uuid,
      // Lägg till fler fält om behövs för kalendern
      start: new Date(shift.date),
      end: new Date(shift.date),
      allDay: false,
      // Färgkodning baserat på skifttyp
      color: getShiftColor(shift.shift_type),
      // Original shift data för export
      originalShift: shift
    }));

    setConvertedEvents(events);
  }, [shifts, selectedTeam]);

  // Hjälpfunktion för att få färg baserat på skifttyp
  function getShiftColor(shiftType) {
    switch (shiftType) {
      case 'Dag':
        return '#3b82f6'; // Blå
      case 'Natt':
        return '#7c3aed'; // Lila
      case 'Helg':
        return '#059669'; // Grön
      default:
        return '#6b7280'; // Grå
    }
  }

  return convertedEvents;
}