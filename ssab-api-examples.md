# SSAB Oxelösund API Användningsexempel

## Supabase REST API

### Hämta skift för specifikt lag
```bash
curl "https://fsefeherdbtsddqimjco.supabase.co/rest/v1/shifts?team=eq.31&select=*&order=date.asc" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Hämta skift för specifik månad
```bash
curl "https://fsefeherdbtsddqimjco.supabase.co/rest/v1/shifts?date=gte.2025-01-01&date=lte.2025-01-31&select=*" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Hämta endast arbetsskift (exkludera lediga dagar)
```bash
curl "https://fsefeherdbtsddqimjco.supabase.co/rest/v1/shifts?type=neq.L&select=*" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Hämta skift för specifik dag
```bash
curl "https://fsefeherdbtsddqimjco.supabase.co/rest/v1/shifts?date=eq.2025-01-15&type=neq.L&select=*" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## JavaScript/TypeScript Exempel

### Hämta nästa skift för lag
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fsefeherdbtsddqimjco.supabase.co',
  'YOUR_ANON_KEY'
);

async function getNextShift(team: number) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('team', team)
    .neq('type', 'L')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(1);
    
  return data?.[0];
}
```

### Hämta schema för månad
```typescript
async function getMonthSchedule(year: number, month: number, team?: number) {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
  let query = supabase
    .from('shifts')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
    
  if (team) {
    query = query.eq('team', team);
  }
  
  const { data, error } = await query;
  return data;
}
```

### Validera dagens täckning
```typescript
async function validateDailyCoverage(date: string) {
  const { data } = await supabase
    .from('shifts')
    .select('team, type')
    .eq('date', date)
    .neq('type', 'L');
    
  const shiftTypes = data?.map(s => s.type) || [];
  const hasF = shiftTypes.includes('F');
  const hasE = shiftTypes.includes('E');
  const hasN = shiftTypes.includes('N');
  
  return {
    valid: hasF && hasE && hasN && data?.length === 3,
    working_teams: data?.length || 0,
    shift_types: shiftTypes
  };
}
```

## SQL Queries för Analys

### Arbetsbörda per lag per månad
```sql
SELECT 
  team,
  DATE_TRUNC('month', date) as month,
  COUNT(CASE WHEN type != 'L' THEN 1 END) as work_days,
  COUNT(CASE WHEN type = 'L' THEN 1 END) as free_days
FROM shifts 
WHERE date >= '2025-01-01' AND date <= '2025-12-31'
GROUP BY team, DATE_TRUNC('month', date)
ORDER BY month, team;
```

### Skiftfördelning
```sql
SELECT 
  team,
  type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY team), 2) as percentage
FROM shifts 
WHERE date >= '2025-01-01' AND date <= '2025-12-31'
GROUP BY team, type
ORDER BY team, type;
```

### Kontrollera daglig täckning
```sql
SELECT 
  date,
  COUNT(CASE WHEN type = 'F' THEN 1 END) as F_shifts,
  COUNT(CASE WHEN type = 'E' THEN 1 END) as E_shifts,
  COUNT(CASE WHEN type = 'N' THEN 1 END) as N_shifts,
  COUNT(CASE WHEN type != 'L' THEN 1 END) as total_working
FROM shifts 
WHERE date >= '2025-01-01' AND date <= '2025-01-31'
GROUP BY date
HAVING COUNT(CASE WHEN type != 'L' THEN 1 END) != 3
ORDER BY date;
```

## React/React Native Komponenter

### Skiftkalender Hook
```typescript
import { useState, useEffect } from 'react';

export function useShiftSchedule(team: number, month: number, year: number) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchedule() {
      const data = await getMonthSchedule(year, month, team);
      setSchedule(data || []);
      setLoading(false);
    }
    fetchSchedule();
  }, [team, month, year]);

  return { schedule, loading };
}
```

### Nästa skift komponent
```typescript
export function NextShift({ team }: { team: number }) {
  const [nextShift, setNextShift] = useState(null);

  useEffect(() => {
    getNextShift(team).then(setNextShift);
  }, [team]);

  if (!nextShift) return <div>Inga kommande skift</div>;

  return (
    <div>
      <h3>Nästa skift</h3>
      <p>Datum: {nextShift.swedish_date}</p>
      <p>Typ: {nextShift.type} ({nextShift.start_time} - {nextShift.end_time})</p>
    </div>
  );
}
```
