# Kalender Funktioner - Skiftappen

## Översikt

Skiftappen har nu utökats med avancerade kalenderfunktioner som inkluderar:

- 📅 **Kalendervy med skiftlag-filtrering**
- 🔄 **Synkning till Google/Apple Kalender**
- 📤 **ICS-export för kalenderfiler**
- ✏️ **Redigering och uppladdning av skift**
- 🎯 **Månad/År-visning**

## Installerade Paket

```bash
npx expo install expo-calendar
npx expo install @react-native-picker/picker
npx expo install expo-file-system expo-sharing
```

## Komponenter

### 1. CalendarView (`app/CalendarView.jsx`)

Huvudkomponenten som visar kalendern med alla funktioner:

**Funktioner:**
- Visar skift i kalenderformat med färgkodning per lag
- Filtrering på specifika skiftlag (31-35)
- Växling mellan månad och år-visning
- Synkning till enhetens kalender
- Export till ICS-format

**Användning:**
```jsx
import CalendarView from './app/CalendarView';

// I din app
<CalendarView />
```

### 2. ShiftEditor (`components/ShiftEditor.jsx`)

Komponent för att redigera och ladda upp skift:

**Funktioner:**
- Enskilt skift-redigering
- Bulk upload med JSON-format
- Validering av skiftdata
- Uppladdning till Supabase

**Användning:**
```jsx
import ShiftEditor from './components/ShiftEditor';

<ShiftEditor 
  onShiftUploaded={(result) => console.log('Uploaded:', result)}
  onClose={() => setShowEditor(false)}
/>
```

## Utility-filer

### 1. Skiftfärger (`utils/shiftColors.js`)

Hanterar färgkodning för skift och lag:

```javascript
import { getColorForTeam, getColorForShift } from './utils/shiftColors';

const teamColor = getColorForTeam(31); // Returnerar '#FF6B6B'
const shiftColor = getColorForShift('M'); // Returnerar '#FF6B6B'
```

### 2. ICS Export (`utils/icsExport.js`)

Exporterar skift till ICS kalenderfiler:

```javascript
import { exportShiftsToICS } from './utils/icsExport';

const result = await exportShiftsToICS(shifts, selectedTeam);
// Skapar och delar ICS-fil
```

### 3. Skifthantering (`utils/shiftManager.js`)

Hanterar CRUD-operationer för skift i Supabase:

```javascript
import { 
  uploadShiftsToSupabase, 
  fetchShiftsFromSupabase,
  updateShiftInSupabase,
  deleteShiftsFromSupabase 
} from './utils/shiftManager';

// Ladda upp skift
const result = await uploadShiftsToSupabase(shifts, { overwrite: true });

// Hämta skift med filter
const { shifts } = await fetchShiftsFromSupabase({ 
  team: 31, 
  startDate: '2024-01-01' 
});
```

## Kalenderfunktioner

### Synkning till Kalender

Appen kan synka skift till användarens standardkalender:

1. **Begär kalenderåtkomst**
2. **Hittar redigerbar kalender**
3. **Skapar kalenderhändelser** med:
   - Titel: "Skift: [typ] (Lag [nummer])"
   - Tid: Start- och sluttid
   - Plats: Arbetsplats eller specificerad plats
   - Beskrivning: Skiftdetaljer

### ICS Export

Exporterar skift som ICS-filer som kan importeras i alla kalenderappar:

**ICS-format inkluderar:**
- Standard VCALENDAR struktur
- Svensk tidszon (Europe/Stockholm)
- Unika event-ID:n
- Fullständiga skiftdetaljer

### Datavalidering

Alla skiftdata valideras före uppladdning:

**Obligatoriska fält:**
- `date` (YYYY-MM-DD format)
- `team` (31, 32, 33, 34, eller 35)

**Valfria fält:**
- `type` (M, A, N, F, E, D)
- `start_time` (HH:MM format)
- `end_time` (HH:MM format)
- `location` (text)

## Exempel på Användning

### Grundläggande Kalendervy

```jsx
import React from 'react';
import CalendarView from './app/CalendarView';

export default function App() {
  return <CalendarView />;
}
```

### Med Skiftredigering

```jsx
import React, { useState } from 'react';
import { View, Button } from 'react-native';
import CalendarView from './app/CalendarView';
import ShiftEditor from './components/ShiftEditor';

export default function App() {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <CalendarView />
      <Button 
        title="Redigera Skift" 
        onPress={() => setShowEditor(true)} 
      />
      {showEditor && (
        <ShiftEditor 
          onShiftUploaded={() => setShowEditor(false)}
          onClose={() => setShowEditor(false)}
        />
      )}
    </View>
  );
}
```

### Bulk Upload Exempel

JSON-format för bulk upload:

```json
[
  {
    "date": "2024-01-15",
    "team": 31,
    "type": "M",
    "start_time": "06:00",
    "end_time": "14:00",
    "location": "Arbetsplats"
  },
  {
    "date": "2024-01-16",
    "team": 32,
    "type": "A",
    "start_time": "14:00",
    "end_time": "22:00",
    "location": "Arbetsplats"
  }
]
```

## Felhantering

Alla funktioner inkluderar omfattande felhantering:

- **Nätverksfel**: Retry-logik och användarmeddelanden
- **Valideringsfel**: Tydliga felmeddelanden
- **Kalenderåtkomst**: Graceful fallback om åtkomst nekas
- **Filexport**: Kontroll av enhetskapacitet

## Säkerhet

- **Datavalidering**: All input valideras före databas-operationer
- **Kalenderåtkomst**: Begär endast nödvändiga rättigheter
- **Filåtkomst**: Säker filhantering med Expo FileSystem

## Prestandaoptimering

- **Batch-operationer**: Stora datamängder processas i batches
- **Lazy loading**: Kalenderdata laddas vid behov
- **Caching**: Färgkodning och metadata cachas
- **Minneshantering**: Automatisk rensning av temporära filer

## Framtida Förbättringar

Möjliga utökningar:

1. **Push-notifikationer** för kommande skift
2. **Kalenderintegration** med externa tjänster
3. **Avancerad filtrering** med datumintervall
4. **Skiftbyten** mellan användare
5. **Statistik och rapporter**
6. **Offline-funktionalitet**

## Support

För frågor eller problem, kontakta utvecklingsteamet eller skapa en issue i projektets repository.