# 📅 Kalenderexport Guide

## Översikt
Skiftappen kan nu exportera skiftscheman till iCal-format (.ics filer) som fungerar med alla stora kalenderapplikationer.

## Funktionalitet

### ShiftExportButton Komponent
- **Fil**: `components/ShiftExportButton.jsx`
- **Syfte**: Exporterar skiftdata till iCal-format
- **Stöder**: Apple Kalender, Google Kalender, Outlook

### Funktioner
1. **Automatisk tidsberäkning** baserat på skifttyp:
   - **Dag**: 07:00 - 19:00
   - **Natt**: 19:00 - 07:00 (nästa dag)
   - **Helg**: 07:00 - 19:00
   - **Standard**: 08:00 - 17:00

2. **iCal-standardformat** med:
   - Unika händelse-ID:n
   - Korrekt tidszonhantering
   - Svensk språkstöd
   - Metadata för kalendernamn

3. **Plattformsstöd**:
   - **Web**: Automatisk nedladdning av .ics-fil
   - **React Native**: Instruktioner för användaren

## Användning

### I CalendarView
```jsx
import ShiftExportButton from '../components/ShiftExportButton';

// Använd med events från useConvertedShifts
<ShiftExportButton events={events} />
```

### Lagval
- Dropdown/knappar för att välja skiftlag (31-35)
- Filtrering av skift baserat på valt lag
- Automatisk uppdatering av exportdata

## Import till Kalender

### 📱 iPhone/iPad (Apple Kalender)
1. Ladda ner .ics-filen från appen
2. Öppna filen i Mail eller Files-appen
3. Tryck "Lägg till i kalender"
4. Välj vilken kalender som ska användas

### 💻 Google Kalender
1. Gå till [calendar.google.com](https://calendar.google.com)
2. Klicka på "+" bredvid "Andra kalendrar"
3. Välj "Importera"
4. Ladda upp den nedladdade .ics-filen
5. Välj vilken kalender som ska användas

### 🖥️ Outlook
1. Öppna Outlook (web eller desktop)
2. Gå till Kalender
3. Klicka "Importera kalender"
4. Välj .ics-filen
5. Bekräfta importen

## Tekniska Detaljer

### iCal-format
- Standard RFC 5545 kompatibel
- UTF-8 kodning för svenska tecken
- VEVENT-objekt för varje skift
- Metadata för kalenderinfo

### Filtrering
Hook `useConvertedShifts` hanterar:
- Lagfiltrering baserat på `team_id` eller `lag`
- Konvertering till kalenderformat
- Färgkodning per skifttyp

### Felhantering
- Kontroll av tom data
- Plattformsdetektering
- Användarvänliga felmeddelanden
- Instruktioner för olika miljöer

## Utveckling

### Anpassa skifttider
Redigera `switch`-satsen i `ShiftExportButton.jsx`:
```jsx
switch (shift.shift_type) {
  case 'Dag':
    startDate.setHours(7, 0, 0, 0);
    endDate.setHours(19, 0, 0, 0);
    break;
  // ... fler fall
}
```

### Lägg till fler lag
Uppdatera `teamOptions` i `CalendarView.jsx`:
```jsx
const teamOptions = [
  { id: 31, name: 'Lag 31' },
  { id: 36, name: 'Lag 36' }, // Nytt lag
  // ...
];
```

## Framtida Förbättringar
- [ ] Direktintegration med Google Calendar API
- [ ] Automatisk synkronisering
- [ ] Påminnelser och notifikationer
- [ ] Anpassade arbetstider per lag
- [ ] Återkommande händelser för regelbundna skift