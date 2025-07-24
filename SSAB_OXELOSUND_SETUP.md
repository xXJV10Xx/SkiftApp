# 🏭 SSAB Oxelösund Schema System

## Översikt

Detta system är specifikt konfigurerat för SSAB Oxelösund med 3-skift system och lag 31-35 (motsvarande lag 1-5). Systemet genererar korrekta scheman baserat på SSAB:s 14-dagars cykel och sparar all data i Supabase.

## 🔧 Konfiguration

### Lag och Färger
- **Lag 31**: Orange (#FF6B35)
- **Lag 32**: Blå (#004E89)
- **Lag 33**: Grön (#1A936F)
- **Lag 34**: Rosa (#C6426E)
- **Lag 35**: Lila (#6F1E51)

### Skiftmönster (14-dagars cykel)
```
SSAB 3-skift: ['M', 'M', 'M', 'A', 'A', 'A', 'N', 'N', 'N', 'L', 'L', 'L', 'L', 'L']
```

- **M**: Morgon (06:00-14:00)
- **A**: Kväll (14:00-22:00)
- **N**: Natt (22:00-06:00)
- **L**: Ledig

## 🚀 Installation och Setup

### 1. Initialisera SSAB Oxelösund i Supabase

```bash
# Fullständig setup (rekommenderas)
curl -X POST http://localhost:8081/api/setup-ssab \
  -H "Content-Type: application/json" \
  -d '{"action": "full-setup"}'
```

Detta kommer att:
- Skapa SSAB Oxelösund företag i databasen
- Skapa alla 5 lag (31-35)
- Generera scheman för nästa 3 månader

### 2. Alternativa Setup-kommandon

```bash
# Endast initialisera företag och lag
curl -X POST http://localhost:8081/api/setup-ssab \
  -H "Content-Type: application/json" \
  -d '{"action": "initialize"}'

# Endast generera scheman
curl -X POST http://localhost:8081/api/setup-ssab \
  -H "Content-Type: application/json" \
  -d '{"action": "generate-schedules"}'

# Rensa alla scheman
curl -X POST http://localhost:8081/api/setup-ssab \
  -H "Content-Type: application/json" \
  -d '{"action": "clear-schedules"}'
```

### 3. Kontrollera Setup

```bash
# Hämta SSAB data
curl http://localhost:8081/api/setup-ssab
```

## 📅 Använda Schema API:et

### Generera Schema för ett Specifikt Lag

```bash
# GET request
curl "http://localhost:8081/api/generate-schedule?companyId=ssab&teamId=31&startDate=2024-01-01&endDate=2024-01-31&includeStats=true"

# POST request
curl -X POST http://localhost:8081/api/generate-schedule \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "ssab",
    "teamId": "31",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "includeStats": true
  }'
```

### Generera Schema för Aktuell Månad

```bash
curl "http://localhost:8081/api/generate-schedule?currentMonth=true&teamId=31"
```

### Generera Schema för Alla Lag

```bash
curl "http://localhost:8081/api/generate-schedule?allTeams=true&startDate=2024-01-01&endDate=2024-01-31"
```

## 📊 API Response Format

```json
{
  "success": true,
  "data": {
    "schedule": [
      {
        "date": "2024-01-01T00:00:00.000Z",
        "dateString": "2024-01-01",
        "day": 1,
        "weekday": "måndag",
        "shift": {
          "code": "M",
          "time": {
            "start": "06:00",
            "end": "14:00",
            "name": "Morgon"
          },
          "cycleDay": 1,
          "totalCycleDays": 14
        },
        "isToday": false,
        "isWeekend": false,
        "teamId": "31"
      }
    ],
    "stats": {
      "totalHours": 168.0,
      "workDays": 21,
      "averageHours": 8.0
    },
    "nextShift": {
      "date": "2024-01-02T00:00:00.000Z",
      "shift": {
        "code": "M",
        "time": {
          "start": "06:00",
          "end": "14:00",
          "name": "Morgon"
        }
      },
      "daysUntil": 1
    },
    "teamInfo": {
      "teamId": "31",
      "companyName": "SSAB Oxelösund",
      "shiftType": "SSAB 3-skift",
      "color": "#FF6B35"
    }
  }
}
```

## 🔄 Frontend Integration

### React/React Native Exempel

```typescript
import { useState, useEffect } from 'react';

interface ScheduleData {
  success: boolean;
  data?: {
    schedule: any[];
    stats?: any;
    nextShift?: any;
    teamInfo: any;
  };
  error?: string;
}

function useSSABSchedule(teamId: string) {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const response = await fetch(
          `/api/generate-schedule?currentMonth=true&teamId=${teamId}`
        );
        const data = await response.json();
        setSchedule(data);
      } catch (error) {
        console.error('Fel vid hämtning av schema:', error);
        setSchedule({ success: false, error: 'Nätverksfel' });
      } finally {
        setLoading(false);
      }
    }

    fetchSchedule();
  }, [teamId]);

  return { schedule, loading };
}

// Användning
function ScheduleComponent() {
  const { schedule, loading } = useSSABSchedule('31');

  if (loading) return <div>Laddar schema...</div>;
  if (!schedule?.success) return <div>Fel: {schedule?.error}</div>;

  return (
    <div>
      <h2>{schedule.data?.teamInfo.companyName} - Lag {schedule.data?.teamInfo.teamId}</h2>
      {schedule.data?.schedule.map((day: any) => (
        <div key={day.dateString} style={{ color: schedule.data?.teamInfo.color }}>
          {day.weekday} {day.day}: {day.shift.time.name || 'Ledig'} 
          {day.shift.time.start && ` (${day.shift.time.start}-${day.shift.time.end})`}
        </div>
      ))}
    </div>
  );
}
```

### Loveable Integration

För att integrera med Loveable:

1. **Använd API:et direkt** i din Loveable-app:
```javascript
// I din Loveable frontend
const fetchSchedule = async (teamId) => {
  const response = await fetch(`/api/generate-schedule?currentMonth=true&teamId=${teamId}`);
  return response.json();
};
```

2. **Eller skapa en hook** som automatiskt uppdaterar schemat:
```javascript
const [schedule, setSchedule] = useState(null);

useEffect(() => {
  fetchSchedule('31').then(setSchedule);
}, []);
```

## 🗄️ Databasstruktur

### Companies Table
```sql
INSERT INTO companies (name, slug) VALUES 
('SSAB Oxelösund', 'ssab-oxelosund');
```

### Teams Table
```sql
INSERT INTO teams (company_id, name, description, color) VALUES 
(company_id, 'Lag 31', 'SSAB Oxelösund Lag 31 - 3-skift', '#FF6B35'),
(company_id, 'Lag 32', 'SSAB Oxelösund Lag 32 - 3-skift', '#004E89'),
-- ... etc
```

### Shifts Table
```sql
-- Automatiskt genererade scheman sparas här
SELECT * FROM shifts WHERE company_id = 'ssab-company-id';
```

## 🔐 Säkerhet och RLS

Alla tabeller använder Row Level Security (RLS). Se `DATABASE_SETUP.md` för detaljer om säkerhetspolicies.

## 🚨 Troubleshooting

### Vanliga Problem

1. **"SSAB företagsdata hittades inte"**
   - Kör setup-kommandot igen
   - Kontrollera att `data/companies.ts` innehåller SSAB-konfigurationen

2. **"Team finns inte"**
   - Använd lag 31-35, inte 1-5
   - Kontrollera att setup har körts korrekt

3. **Inga scheman genereras**
   - Kontrollera Supabase-anslutningen
   - Verifiera att tabellerna finns
   - Kör `clear-schedules` följt av `generate-schedules`

### Debug-kommandon

```bash
# Kontrollera SSAB data
curl http://localhost:8081/api/setup-ssab

# Testa schema-generering
curl "http://localhost:8081/api/generate-schedule?companyId=ssab&teamId=31&startDate=2024-01-01&endDate=2024-01-07"

# Rensa och återskapa
curl -X POST http://localhost:8081/api/setup-ssab -H "Content-Type: application/json" -d '{"action": "clear-schedules"}'
curl -X POST http://localhost:8081/api/setup-ssab -H "Content-Type: application/json" -d '{"action": "full-setup"}'
```

## 📈 Prestanda

- Schemagenerering för 1 månad: ~50ms
- Schemagenerering för alla 5 lag: ~200ms
- Databassparande: ~100ms per lag

## 🔄 Automatisk Uppdatering

För att automatiskt generera nya scheman varje månad, implementera en cron-job eller scheduled function som anropar:

```bash
curl -X POST http://localhost:8081/api/setup-ssab \
  -H "Content-Type: application/json" \
  -d '{"action": "generate-schedules"}'
```

## 📞 Support

Vid problem, kontrollera:
1. Supabase-anslutning och RLS-policies
2. API-endpoints svarar korrekt
3. Företags- och teamdata finns i databasen
4. Scheman genereras och sparas korrekt