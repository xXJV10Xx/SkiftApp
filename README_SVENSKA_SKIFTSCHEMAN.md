# 🇸🇪 Svenska Skiftscheman - Komplett Skiftschema System

Ett komplett system för att hantera svenska skiftscheman från 2023-2035 med integration till Supabase och Loveable.

## 🎯 Funktioner

- ✅ **Svenska Skiftscheman**: Komplett databas med skiftscheman för alla stora svenska företag
- ✅ **Kalenderintegration**: Svenska helgdagar och skottår 2023-2035
- ✅ **Företag & Avdelningar**: Volvo, SSAB, Stora Enso, Sandvik, SKF och fler
- ✅ **Skifttyper**: Dag, 2-skift, 3-skift, 4-skift, kontinuerligt
- ✅ **Real-time Sync**: Supabase backend med live uppdateringar
- ✅ **React Native App**: Modern mobilapp med svensk UI
- ✅ **Loveable Export**: Automatisk export för frontend deployment

## 🏗️ Arkitektur

```
📁 Svenska Skiftscheman System
├── 📱 skiftappen/                    # React Native app
│   ├── app/(tabs)/shift-schedule.tsx # Huvudskärm
│   ├── lib/supabase.ts              # Supabase konfiguration
│   ├── context/AuthContext.tsx      # Autentisering
│   └── package.json                 # Dependencies
├── 🗄️ supabase/
│   └── migrations/
│       └── 20250126_create_shift_tables.sql  # Databasschema
├── 🤖 scripts/
│   ├── fetch-shift-schedules.js     # Datahämtning
│   ├── export-to-loveable.js        # Loveable export
│   └── deploy-shift-app.js          # Komplett deployment
└── 📄 Dokumentation och konfiguration
```

## 🚀 Snabbstart

### 1. Klona och Installera

```bash
# Klona projektet
git clone <repository-url>
cd svenska-skiftscheman

# Installera dependencies
cd skiftappen
npm install
```

### 2. Supabase Setup

```bash
# Skapa Supabase projekt på https://supabase.com
# Kopiera URL och Anon Key

# Skapa .env fil
cp .env.example .env

# Redigera .env med dina Supabase credentials:
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Databas Migration

```bash
# Kör SQL migration i Supabase Dashboard
# Eller använd Supabase CLI:
supabase db push
```

### 4. Populera Data

```bash
# Kör deployment script för att fylla databasen
cd ../scripts
chmod +x deploy-shift-app.js
SUPABASE_URL=your-url SUPABASE_SERVICE_KEY=your-service-key node deploy-shift-app.js
```

### 5. Starta Appen

```bash
cd ../skiftappen
npx expo start
```

## 📊 Datastruktur

### Svenska Helgdagar
- **2023-2035**: Alla svenska helgdagar
- **Typer**: Offentliga, regionala, religiösa
- **Skottår**: Automatisk hantering

### Företag & Avdelningar
- **Volvo Cars**: Karosseri, Motor, Lackering
- **SSAB**: Stålverk, Valsning, Underhåll  
- **Stora Enso**: Massa, Papper, Kartong
- **Sandvik**: Produktion, Verktyg, Service
- **SKF**: Kullager, Tätningar, Smörjning

### Skiftmönster
- **Dag**: 07:00-16:00
- **2-skift**: Dag + Kväll
- **3-skift**: Dag + Kväll + Natt
- **4-skift**: Fyra 6-timmars skift
- **Kontinuerligt**: 24/7 drift

## 🛠️ API Användning

### Hämta Företag
```typescript
import { shiftHelpers } from './lib/supabase';

const { data: companies } = await shiftHelpers.getActiveCompanies();
```

### Hämta Skiftscheman
```typescript
const { data: schedules } = await shiftHelpers.getShiftSchedules(
  '2024-01-01', 
  '2024-12-31',
  companyId
);
```

### Svenska Helgdagar
```typescript
const { data: holidays } = await shiftHelpers.getSwedishHolidays(2024);
```

### Real-time Uppdateringar
```typescript
const subscription = shiftHelpers.subscribeToShiftChanges((payload) => {
  console.log('Skiftschema uppdaterat:', payload);
});
```

## 🎨 UI Komponenter

### ShiftCalendar
- Månadsvy med skiftscheman
- Svenska helgdagar markerade
- Företag- och avdelningsfilter
- Touch-interaktion

### CompanyFilter
- Dropdown med alla företag
- Avdelningsfilter per företag
- Aktiv/inaktiv status

### HolidayDisplay
- Svenska helgdagar listade
- Typ av helgdag (offentlig/regional)
- Kalenderintegration

## 📱 React Native Features

- **Expo Router**: Modern navigation
- **TypeScript**: Type-safe utveckling
- **Supabase**: Real-time backend
- **React Native Calendars**: Kalendervy
- **Async Storage**: Lokal cachning
- **Svenska lokalisering**: sv-SE

## 🚀 Loveable Integration

### Automatisk Export
```bash
node scripts/export-to-loveable.js
```

### Export Innehåll
- React komponenter
- Supabase schema
- Sampledata
- Konfiguration
- Dependencies

### Deployment till Loveable
1. Kör export script
2. Ladda upp `loveable-export.json`
3. Konfigurera Supabase credentials
4. Deploya till produktion

## 🔧 Utveckling

### Lokal utveckling
```bash
# Starta Expo dev server
npx expo start

# iOS simulator
npx expo start --ios

# Android emulator  
npx expo start --android

# Web browser
npx expo start --web
```

### Databas utveckling
```bash
# Supabase CLI
supabase start        # Lokal Supabase
supabase db reset     # Återställ databas
supabase db push      # Synka migrations
```

### Linting och Format
```bash
npm run lint          # ESLint
npm run format        # Prettier
npm run type-check    # TypeScript
```

## 📈 Prestandaoptimering

### Databas
- **Indexering**: Optimerade index för datum och företag
- **Batching**: Stora datamängder hanteras i batches
- **Caching**: Supabase edge caching

### React Native
- **Lazy Loading**: Komponenter laddas vid behov
- **Memoization**: React.memo för tunga komponenter
- **Image Optimization**: Optimerade bilder och ikoner

## 🔒 Säkerhet

### Supabase RLS (Row Level Security)
```sql
-- Exempel: Användare kan bara se sina företags data
CREATE POLICY "Users can view their company data" ON shift_schedules
FOR SELECT USING (auth.uid() IN (
  SELECT user_id FROM user_companies WHERE company_id = shift_schedules.company_id
));
```

### Autentisering
- Email/lösenord
- OAuth providers (Google, GitHub)
- Magic links
- Session management

## 📊 Monitoring & Analytics

### Supabase Dashboard
- Real-time databas aktivitet
- API användning
- Autentisering metrics
- Storage användning

### Expo Analytics
- App användning
- Crash rapporter
- Performance metrics
- User engagement

## 🚨 Felsökning

### Vanliga Problem

**Supabase Connection Error**
```bash
# Kontrollera .env filen
cat .env
# Verifiera Supabase credentials i dashboard
```

**Build Errors**
```bash
# Rensa cache
npx expo start --clear
rm -rf node_modules && npm install
```

**Migration Errors**
```bash
# Kontrollera SQL syntax
supabase db lint
# Återställ databas
supabase db reset
```

## 📞 Support

- **GitHub Issues**: Rapportera buggar och feature requests
- **Dokumentation**: Se denna README och koden
- **Supabase Docs**: https://supabase.com/docs
- **Expo Docs**: https://docs.expo.dev

## 📄 Licens

MIT License - Se LICENSE fil för detaljer.

## 🤝 Bidrag

1. Fork projektet
2. Skapa feature branch (`git checkout -b feature/ny-funktion`)
3. Commit ändringar (`git commit -am 'Lägg till ny funktion'`)
4. Push till branch (`git push origin feature/ny-funktion`)
5. Skapa Pull Request

## 🎉 Tack till

- **Supabase**: För fantastisk backend-as-a-service
- **Expo**: För React Native utvecklingsverktyg
- **Loveable**: För frontend deployment platform
- **Svenska företag**: För inspiration till skiftscheman

---

**🇸🇪 Gjort med kärlek för svenska skiftarbetare! 🇸🇪**