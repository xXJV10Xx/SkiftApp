# Svenska Skiftappen - Loveable Export

## 🇸🇪 Översikt

Detta är en React Native-app för att visa svenska skiftscheman och kalenderdata. Appen integrerar med Supabase för backend och stödjer:

- **Svenska skiftscheman** från stora företag och organisationer
- **Svensk kalender** med helgdagar och skottår
- **Realtidssynkronisering** med Supabase
- **Filtrering** per företag, ort och avdelning
- **Kalendervisning** med skiftmarkeringar

## 🏗️ Projektstruktur

```
src/
├── components/          # React komponenter
│   ├── ShiftCalendar.tsx
│   ├── ShiftScheduleCard.tsx
│   ├── CompanyFilter.tsx
│   └── HolidayIndicator.tsx
├── screens/             # App skärmar
│   └── ShiftScheduleScreen.tsx
├── hooks/               # Custom hooks
│   ├── useShiftSchedules.ts
│   └── useSwedishHolidays.ts
├── types/               # TypeScript typer
│   └── shift.ts
└── utils/               # Hjälpfunktioner
    ├── shiftCalculations.ts
    └── swedishCalendar.ts
```

## 🚀 Funktioner

### Skiftscheman
- Visa scheman för svenska företag (Volvo, SSAB, Stora Enso, etc.)
- Olika skifttyper: 2-2, 3-3, 4-4, 5-5, 6-2, 7-7, 2-2-2-4
- Filtrering per företag, ort och avdelning
- Kalendervisning med färgkodade skift

### Svensk Kalender
- Svenska helgdagar 2023-2035
- Automatisk beräkning av påsk, midsommar, alla helgons dag
- Skottårshantering
- Veckonummervisning

### Supabase Integration
- Realtidsdata från Supabase
- Optimerade queries med indexering
- Row Level Security (RLS)
- Användarspecifika scheman

## 📱 Komponenter

### ShiftCalendar
Huvudkalenderkomponent som visar skiftscheman och helgdagar.

```tsx
<ShiftCalendar
  schedules={schedules}
  holidays={holidays}
  onDateSelect={handleDateSelect}
  selectedCompany="Volvo Group"
  selectedLocation="Göteborg"
/>
```

### ShiftScheduleCard
Kort för att visa detaljerad skiftinformation.

```tsx
<ShiftScheduleCard
  schedule={schedule}
  onPress={handleCardPress}
  showDetails={true}
/>
```

### CompanyFilter
Filter för att välja företag, ort och avdelning.

```tsx
<CompanyFilter
  companies={companies}
  selectedCompany={selectedCompany}
  onCompanyChange={setSelectedCompany}
/>
```

## 🔧 Setup

1. **Installera dependencies:**
   ```bash
   npm install
   ```

2. **Konfigurera Supabase:**
   - Skapa nytt Supabase projekt
   - Kör migrations från `supabase/migrations/`
   - Uppdatera `SUPABASE_URL` och `SUPABASE_ANON_KEY`

3. **Importera data:**
   ```bash
   node scripts/fetch-shift-schedules.js
   ```

4. **Starta appen:**
   ```bash
   npm start
   ```

## 🌐 Loveable Deployment

### Automatisk Deploy
Denna app är konfigurerad för automatisk deployment till Loveable:

1. Importera projektet i Loveable
2. Koppla till GitHub repository
3. Konfigurera environment variables
4. Deploy automatiskt vid push till main

### Environment Variables
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## 📊 Data

### Svenska Företag
- Volvo Group (Göteborg, Skövde, Umeå)
- SSAB (Luleå, Oxelösund, Borlänge)
- Stora Enso (Falun, Skutskär, Hylte)
- Region Stockholm (Stockholm, Huddinge, Solna)
- SCA (Sundsvall, Östrand, Munksund)

### Skifttyper
- **2-2**: 2 dagar på, 2 dagar av
- **3-3**: 3 dagar på, 3 dagar av
- **4-4**: 4 dagar på, 4 dagar av
- **5-5**: 5 dagar på, 5 dagar av
- **6-2**: 6 dagar på, 2 dagar av
- **7-7**: 7 dagar på, 7 dagar av
- **2-2-2-4**: Kontinuerligt skift

### Svenska Helgdagar
- Nyårsdagen, Trettondedag jul
- Långfredagen, Påskdagen, Annandag påsk
- Första maj, Kristi himmelsfärdsdag
- Sveriges nationaldag, Pingstdagen
- Midsommardagen, Alla helgons dag
- Julafton, Juldagen, Annandag jul, Nyårsafton

## 🔄 Synkronisering

Appen synkroniseras automatiskt med Supabase för:
- Skiftscheman uppdateringar
- Nya företag och avdelningar
- Helgdagsändringar
- Användarinställningar

## 📈 Prestanda

- Optimerade Supabase queries
- Lazy loading av data
- Caching av kalenderdata
- Effektiv rendering av stora dataset

## 🤝 Bidrag

För att bidra till projektet:
1. Fork repository
2. Skapa feature branch
3. Commit ändringar
4. Skapa Pull Request

## 📄 Licens

MIT License - se LICENSE fil för detaljer.

---

**Utvecklad för svenska skiftarbetare** 🇸🇪
