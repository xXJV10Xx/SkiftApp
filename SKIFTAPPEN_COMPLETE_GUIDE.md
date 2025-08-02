# 🚀 Skiftappen - Komplett Implementeringsguide

## 📋 Översikt

Denna lösning ger dig en fullständig skiftschema-app som automatiskt hämtar data från skiftschema.se och visar den i en snygg kalendervy.

### ✨ Funktioner
- **Automatisk scraping** från skiftschema.se varje dag
- **Realtidsdata** via Supabase databas
- **Snygg kalendervy** med färgkodade skift
- **Företags- och teamfiltrering**
- **Responsiv design** för mobil och desktop

## 🏗️ Arkitektur

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│  skiftschema.se │───▶│ GitHub       │───▶│ Supabase        │
│  (källa)        │    │ Actions      │    │ Database        │
└─────────────────┘    │ (scraping)   │    └─────────────────┘
                       └──────────────┘            │
                                                  │
                       ┌─────────────────────────▼┐
                       │ React/Expo App          │
                       │ (frontend)              │
                       └─────────────────────────┘
```

## 🚀 Steg-för-steg Implementation

### 1️⃣ Supabase Setup

#### Skapa Supabase Projekt
1. Gå till [supabase.com](https://supabase.com)
2. Skapa nytt projekt
3. Anteckna din `Project URL` och `anon key`

#### Skapa Databas Tabell
Kör denna SQL i Supabase SQL Editor:

```sql
create table shifts (
  id uuid primary key default uuid_generate_v4(),
  company text not null,
  location text,
  team text not null,
  date date not null,
  shift_type text not null, -- F, E, N, L
  shift_time text not null, -- t.ex. "06:00-14:00"
  scraped_at timestamp default now()
);

-- Index för bättre prestanda
create index idx_shifts_company_team_date on shifts(company, team, date);
create index idx_shifts_date on shifts(date);
```

### 2️⃣ GitHub Secrets Konfiguration

Gå till ditt GitHub repo → Settings → Secrets and Variables → Actions

Lägg till dessa secrets:
- `SUPABASE_URL`: Din Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Din service role key (från API settings)

### 3️⃣ Environment Variables (.env)

Skapa `.env.local` fil i projektets root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4️⃣ Kör Scraping (första gången)

#### Manuellt via GitHub Actions:
1. Gå till Actions tab i GitHub
2. Välj "Scrape and Upload Shifts"
3. Klicka "Run workflow"
4. Vänta ~5-10 minuter
5. Kontrollera att data finns i Supabase

#### Automatiskt:
Scriptet körs automatiskt varje dag kl 02:00 UTC.

### 5️⃣ Starta Appen

```bash
# Installera dependencies (om inte redan gjort)
npm install

# Starta utvecklingsserver
npm start

# Navigera till /supabase-shifts för den nya vyn
```

## 📱 Användning

### Första användning:
1. Öppna appen
2. Gå till `/supabase-shifts` route
3. Välj ditt företag från listan
4. Välj ditt team
5. Se ditt skiftschema i kalendervyn!

### Funktioner:
- **Månadnavigering**: Använd pilarna för att bläddra mellan månader
- **Dagdetaljer**: Klicka på en dag för att se skiftinformation
- **Teamfiltrering**: Välj "Alla team" eller specifikt team
- **Färgkodning**: 
  - 🟦 Förmiddag (F): 06:00-14:00
  - 🟧 Eftermiddag (E): 14:00-22:00  
  - 🟦 Natt (N): 22:00-06:00
  - ⬜ Ledig (L): -

## 🔧 Teknisk Information

### Filstruktur
```
├── scripts/
│   └── scrape-all.cjs           # Scraping script
├── .github/workflows/
│   └── scrape.yml               # GitHub Actions workflow
├── components/
│   ├── SupabaseShiftCalendar.tsx    # Kalenderkomponent
│   ├── SupabaseCompanySelector.tsx  # Företagsväljare
│   └── SupabaseTeamSelector.tsx     # Teamväljare
├── hooks/
│   └── useShifts.ts             # Supabase data hooks
├── lib/
│   └── supabase.ts              # Supabase konfiguration
└── app/
    └── supabase-shifts.tsx      # Huvudsida
```

### Databasschema
```sql
shifts {
  id: uuid (primary key)
  company: text (t.ex. "SSAB", "Ovako")
  location: text (t.ex. "ssab_ox_3skift") 
  team: text (t.ex. "Lag A", "Lag B")
  date: date (YYYY-MM-DD)
  shift_type: text (F/E/N/L)
  shift_time: text (t.ex. "06:00-14:00")
  scraped_at: timestamp
}
```

## 🐛 Felsökning

### Scraping fungerar inte:
1. Kontrollera GitHub Secrets är korrekt konfigurerade
2. Kolla GitHub Actions logs för felmeddelanden
3. Verifiera att Supabase service role key har rätt behörigheter

### Ingen data visas i appen:
1. Kontrollera att scraping har körts och data finns i Supabase
2. Verifiera environment variables (.env.local)
3. Kolla browser console för fel

### Fel i kalendervyn:
1. Kontrollera att shifts tabellen har rätt struktur
2. Verifiera att datum-format är korrekt (YYYY-MM-DD)

## 📈 Nästa Steg

### Utökningar du kan göra:
1. **Fler företag**: Lägg till fler företag i scraping-scriptet
2. **Push-notiser**: Notifiera om kommande skift
3. **Kalenderexport**: Export till Google/Apple Calendar
4. **Statistik**: Visa skiftstatistik och trender
5. **Team-chatt**: Lägg till kommunikation mellan teammedlemmar

### Produktionsdrift:
1. Sätt upp domän och hosting (t.ex. Vercel, Netlify)
2. Konfigurera Supabase för produktion
3. Sätt upp monitoring och logging
4. Implementera error handling och retry-logik

## 🎉 Resultat

Du har nu en fullständig skiftschema-app som:
- ✅ Automatiskt hämtar data från skiftschema.se
- ✅ Lagrar data i Supabase databas  
- ✅ Visar data i snygg kalendervy
- ✅ Stöder flera företag och team
- ✅ Uppdateras automatiskt varje dag
- ✅ Fungerar på mobil och desktop

**Grattis! Din skiftappen är nu redo att användas! 🚀**