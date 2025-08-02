# Scripts för ICS Import/Export

## 📥 Import från .ics-fil till Supabase

Importerar skiftscheman från en kalenderfil (.ics) till Supabase-databasen.

### Användning:
```bash
npm run import-ics
```

eller direkt:
```bash
node scripts/import-ics-to-supabase.js
```

### Förutsättningar:
- Placera din `.ics`-fil i projektets rot och döp den till `shifts.ics`
- Sätt miljövariabler:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Vad scriptet gör:
1. Läser `shifts.ics` från projektets rot
2. Parsar alla VEVENT-poster
3. Importerar varje händelse till `shift_schedules`-tabellen
4. Markerar källan som 'ics-import'

---

## 📤 Export till .ics-fil (Google/Apple Calendar)

Exporterar alla skiftscheman från Supabase till en kalenderfil som kan importeras i Google Calendar eller Apple Calendar.

### Användning:
```bash
npm run export-ics
```

eller direkt:
```bash
node scripts/export-to-ics.js
```

### Resultat:
- Skapar filen `exported.ics` i projektets rot
- Denna fil kan importeras i:
  - Google Calendar
  - Apple Calendar
  - Outlook
  - Andra kalenderapplikationer

### Vad scriptet gör:
1. Hämtar alla poster från `shift_schedules`-tabellen
2. Konverterar till ICS-format
3. Sparar som `exported.ics`

---

## 🔧 Installation av dependencies

Scripts kräver följande npm-paket:
```bash
npm install ical ics @supabase/supabase-js
```

## 📋 Exempel på ICS-fil

Se `shifts.ics` i projektets rot för ett exempel på korrekt format.

## 🚨 Viktigt

- Säkerställ att miljövariablerna är korrekt satta
- Använd SERVICE_ROLE_KEY för serverside-operationer
- Kontrollera att tabellstrukturen matchar förväntade fält:
  - `title`
  - `start_time`
  - `end_time`
  - `location`
  - `source`