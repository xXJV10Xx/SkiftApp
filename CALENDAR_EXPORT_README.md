# Kalenderexport för Skiftappen

Denna implementation tillåter användare att exportera sina skift till både Google Kalender och Apple Kalender.

## Komponenter

### `ShiftExportButton.tsx`
En React-komponent som renderar två knappar för export till Google och Apple Kalender.

**Props:**
- `events: ShiftEvent[]` - Array av skift att exportera

**Användning:**
```tsx
import ShiftExportButton from './components/ShiftExportButton';

const events = [
  {
    title: "Morgonpass",
    date: "2024-01-15",
    startTime: "08:00",
    endTime: "16:00"
  }
];

<ShiftExportButton events={events} />
```

### `useConvertedShifts.ts`
En React hook som hämtar skift från Supabase och konverterar dem till kalenderformat.

**Parametrar:**
- `employeeId?: string` - Filtrera på anställd
- `companyId?: string` - Filtrera på företag  
- `teamId?: string` - Filtrera på team

**Returnerar:**
- `events: ShiftEvent[]` - Konverterade kalenderhändelser
- `loading: boolean` - Laddningsstatus
- `error: string | null` - Eventuella fel

**Användning:**
```tsx
import { useConvertedShifts } from './hooks/useConvertedShifts';

const { events, loading, error } = useConvertedShifts(employeeId);
```

## Utilities

### `googleCalendar.ts`
Exporterar händelser till Google Kalender genom att öppna Google Calendar's event creation URL för varje skift.

### `appleCalendar.ts`
Genererar en ICS-fil som kan importeras till Apple Kalender och andra kalenderappar.

## Typer

### `ShiftEvent`
```typescript
interface ShiftEvent {
  title: string;      // Titel på skiftet
  date: string;       // Datum i format YYYY-MM-DD
  startTime: string;  // Starttid i format HH:MM
  endTime: string;    // Sluttid i format HH:MM
}
```

## Komplett exempel

```tsx
import React from 'react';
import { useConvertedShifts } from './hooks/useConvertedShifts';
import ShiftExportButton from './components/ShiftExportButton';

const MyShiftsPage = () => {
  const { events, loading, error } = useConvertedShifts();

  if (loading) return <div>Laddar...</div>;
  if (error) return <div>Fel: {error}</div>;

  return (
    <div>
      <h1>Mina Skift</h1>
      <ShiftExportButton events={events} />
    </div>
  );
};
```

## Installation

Alla filer är klara att användas direkt. Se till att du har:

1. React och TypeScript installerat
2. Supabase konfigurerat enligt `lib/supabase.ts`
3. Tailwind CSS för styling (eller anpassa CSS-klasserna)

## Funktioner

- ✅ Export till Google Kalender (öppnar nya flikar för varje skift)
- ✅ Export till Apple Kalender (laddar ner ICS-fil)
- ✅ Automatisk konvertering från Supabase-format
- ✅ Filtrering på anställd, företag eller team
- ✅ TypeScript-stöd
- ✅ Felhantering och laddningsstatus