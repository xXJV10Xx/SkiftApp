import React, { useState, useEffect } from 'react';
import { exportToGoogleCalendar } from '../utils/googleCalendar';
import { exportToAppleCalendar } from '../utils/appleCalendar';
import { fetchShifts } from '../utils/supabase';
import shiftColors from '../utils/shiftColors';

export default function CalendarView() {
  const [shifts, setShifts] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('Alla');

  useEffect(() => {
    async function loadShifts() {
      const data = await fetchShifts();
      setShifts(data);
    }
    loadShifts();
  }, []);

  const filteredShifts = selectedTeam === 'Alla'
    ? shifts
    : shifts.filter(s => s.team === selectedTeam);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">Skiftschema Kalender</h1>
        <select
          className="border rounded px-3 py-1"
          onChange={e => setSelectedTeam(e.target.value)}
          value={selectedTeam}
        >
          <option value="Alla">Alla lag</option>
          <option value="31">Lag 31</option>
          <option value="32">Lag 32</option>
          <option value="33">Lag 33</option>
          <option value="34">Lag 34</option>
          <option value="35">Lag 35</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {filteredShifts.map((shift, i) => {
          const color = shiftColors[shift.team] || 'bg-gray-300';

          const timeRange = {
            F: '06:00–14:00',
            E: '14:00–22:00',
            N: '22:00–06:00'
          }[shift.type] || 'Okänd tid';

          return (
            <div key={i} className={`p-4 rounded shadow ${color}`}>
              <div className="font-semibold">
                {shift.date} – {shift.type} ({timeRange})
              </div>
              <div className="text-sm">
                {shift.company} – {shift.department} – Lag {shift.team}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => exportToGoogleCalendar(shift)}
                  className="bg-white text-sm px-3 py-1 rounded border"
                >
                  Exportera till Google
                </button>
                <button
                  onClick={() => exportToAppleCalendar(shift)}
                  className="bg-white text-sm px-3 py-1 rounded border"
                >
                  Exportera till Apple
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}