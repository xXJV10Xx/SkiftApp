SKIFTCHEMA API/DATAGUIDE FÖR FRONTEND & MOBILAPP

Den här filen beskriver hur du som frontend- eller mobilutvecklare kan använda och implementera alla skiftscheman som sparats från scraping i Skiftappen.

--------------------------------------------------

1. VAR FINNS SKIFTSCHEMAT?

Alla skiftscheman är sparade i filen:
  skiftschema-output.json
eller (för fullständig data):
  skiftscheman_alla_företag_2020_2030.json

Formatet är JSON och innehåller alla företag, avdelningar, lag och skift för perioden 2020–2030.

--------------------------------------------------

2. DATAFORMAT (EXEMPEL)

[
  {
    "company_id": "acme-ab",
    "company_name": "Acme AB",
    "departments": [
      {
        "department_id": "produktion",
        "department_name": "Produktion",
        "teams": [
          {
            "team_id": "nattlag",
            "team_name": "Nattlag",
            "shifts": [
              {
                "shift_id": "2024-06-01_natt",
                "date": "2024-06-01",
                "type": "Natt",
                "start_time": "22:00",
                "end_time": "06:00",
                "break_minutes": 30
              }
              // ... fler skift
            ]
          }
        ]
      }
    ]
  }
  // ... fler företag
]

--------------------------------------------------

3. SÅ HÄR ANVÄNDER DU DATAN I APPEN

A. Ladda in JSON-filen (React Native/Expo):
import shiftData from '../skiftschema-output.json';

// Hämta alla företag
const companies = shiftData.map(c => ({ id: c.company_id, name: c.company_name }));

// Hämta alla skift för ett företag, avdelning och lag
function getShifts(companyId, departmentId, teamId) {
  const company = shiftData.find(c => c.company_id === companyId);
  if (!company) return [];
  const department = company.departments.find(d => d.department_id === departmentId);
  if (!department) return [];
  const team = department.teams.find(t => t.team_id === teamId);
  if (!team) return [];
  return team.shifts;
}

// Exempel: Hämta alla nattpass för Acme AB, Produktion, Nattlag
function getNightShifts() {
  return getShifts('acme-ab', 'produktion', 'nattlag').filter(s => s.type === 'Natt');
}

B. Visa skiftschema i kalender:
- Använd t.ex. react-native-calendars eller liknande komponent
- Mappa skift till kalenderhändelser:
const calendarEvents = getShifts(companyId, departmentId, teamId).map(shift => ({
  date: shift.date,
  title: `${shift.type} (${shift.start_time}–${shift.end_time})`,
  start: shift.start_time,
  end: shift.end_time
}));

C. Sök & filtrera skift:
const shiftsOnDate = getShifts(companyId, departmentId, teamId).filter(s => s.date === '2024-06-01');

--------------------------------------------------

4. BEST PRACTICES
- Ladda bara in relevanta skift (filtrera på företag/avdelning/lag)
- Cacha skiftschemat lokalt om det är stort
- Visa tydligt skifttyp, tider och eventuella raster
- Uppdatera datan om ny scraping görs
- Hantera stora filer: Om filen är stor, ladda in paginerat eller via backend-API

--------------------------------------------------

5. TIPS FÖR IMPLEMENTATION
- Visa skiftschema i kalender, lista eller tabell
- Låt användaren filtrera på datum, skifttyp, team
- Koppla skift till chatten (t.ex. "Vem jobbar natt 1 juni?")
- Använd skiftdata för att föreslå skiftbyten eller intresse

--------------------------------------------------

6. OM DU VILL ANVÄNDA VIA API
- Skapa en endpoint /api/shifts som returnerar filtrerad data
- Exempel: /api/shifts?company=acme-ab&date=2024-06-01
- Returnera samma JSON-format som ovan

--------------------------------------------------

7. FRÅGOR/SUPPORT
- Kontakta backend-teamet om du behöver mer data eller API
- Se README för mer info om datamodellen

--------------------------------------------------

Lycka till med implementationen av skiftschemat i mobilappen! 

Nu finns en komplett React Native-komponent (`ShiftScheduleCalendar.tsx`) som visar skiftschemat i en kalender, med filtrering på team och dag, och detaljerad vy för varje skift.

**Så här fungerar den:**
- Välj team högst upp (horisontell lista)
- Kalendern markerar alla dagar med skift
- Tryck på en dag för att se detaljer om skiftet (typ, tid, rast)
- Allt är anpassat för svenska användare

**För att använda:**
1. Installera `react-native-calendars` om du inte redan har det:
   ```
   npm install react-native-calendars
   ```
2. Lägg till komponenten i din app, t.ex. i din dashboard eller användarvy:
   ```tsx
   import ShiftScheduleCalendar from './components/ShiftScheduleCalendar';
   // ...
   <ShiftScheduleCalendar />
   ```

Vill du ha en liknande komponent för lista eller tabell, eller integration med chatten? 