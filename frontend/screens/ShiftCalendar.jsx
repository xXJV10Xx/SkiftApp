import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const colorMap = { F: '#4ade80', E: '#facc15', N: '#60a5fa', L: '#d1d5db' };

export default function ShiftCalendar() {
  const [data, setData] = useState([]);
  const [team, setTeam] = useState('all');
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    supabase
      .from('shifts')
      .select('date,type,team')
      .order('date')
      .eq(team !== 'all' ? 'team' : undefined, team)
      .then(r => setData(r.data || []));
  }, [team]);

  const renderMonth = m => {
    const days = new Date(year, m+1, 0).getDate();
    return <div key={m}><h3>{new Date(year, m).toLocaleString('sv-SE', {month:'long'})}</h3>
      <div style={{display:'flex',flexWrap:'wrap'}}>
        {Array.from({length:days},(_,i) => {
          const d = `${year}-${String(m+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
          const sh = data.find(s=>s.date===d);
          return <div key={i} style={{
            width: 30, height:30, margin:1, background: sh ? colorMap[sh.type]: '#f3f4f6'
          }}>{i+1}</div>
        })}
      </div>
    </div>;
  };

  return (
    <div>
      <h2>Skiftschema {year}</h2>
      <select value={team} onChange={e => setTeam(e.target.value)}>
        <option value="all">Alla lag</option>
        <option value="31">Lag 31</option>
        <option value="32">Lag 32</option>
        <option value="33">Lag 33</option>
        <option value="34">Lag 34</option>
        <option value="35">Lag 35</option>
      </select>
      <button onClick={()=>setYear(y=>y-1)}>←</button>
      <button onClick={()=>setYear(y=>y+1)}>→</button>
      <div>{Array.from({length:12},(_,m)=>renderMonth(m))}</div>
    </div>
  );
}