import React, { useState, useEffect } from 'react';
import { CalendarList } from 'react-native-calendars';
import { supabase } from '../lib/supabase';
import { getColorForTeam } from '../utils/shiftColors';

export default function CalendarView() {
  const [markedDates, setMarkedDates] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    fetchShifts();
  }, [selectedTeam]);

  const fetchShifts = async () => {
    let { data, error } = await supabase
      .from('shifts')
      .select('*');

    if (error) {
      console.error('Error fetching shifts:', error);
      return;
    }

    const markings = {};
    data.forEach((shift) => {
      const date = shift.date;
      const team = shift.team;
      const color = getColorForTeam(team);
      if (!selectedTeam || selectedTeam === team) {
        markings[date] = {
          customStyles: {
            container: { backgroundColor: color },
            text: { color: '#fff' }
          }
        };
      }
    });
    setMarkedDates(markings);
  };

  return (
    <CalendarList
      pastScrollRange={120}
      futureScrollRange={120}
      scrollEnabled
      showScrollIndicator
      markingType={'custom'}
      markedDates={markedDates}
    />
  );
}