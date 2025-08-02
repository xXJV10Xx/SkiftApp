# Skiftschema Scraper

Automatisk scraper för att hämta skiftscheman från skiftschema.se och lagra i Supabase.

## 📋 Setup

### 1. Miljövariabler

Skapa `.env` fil i projektets rot:

```bash
SUPABASE_URL=https://din-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=din-service-role-key
```

### 2. Supabase Setup

Kör SQL-koden från `supabase.sql` i din Supabase SQL Editor för att skapa nödvändiga tabeller och policys.

### 3. Installera beroenden

```bash
npm install puppeteer @supabase/supabase-js node-fetch cheerio dotenv
```

## 🚀 Användning

### Manuell körning

```bash
# Generera schemas från skiftschema.se
node scripts/generate-schemas.cjs

# Kör scrapern
node -r dotenv/config scripts/scrape-all.cjs
```

### Automatisk körning med GitHub Actions

1. Lägg till secrets i GitHub:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Workflow körs automatiskt varje dag kl 06:00 UTC

3. Manuell körning via GitHub Actions UI

## 📁 Filstruktur

```
scripts/
├── generate-schemas.cjs  # Hämtar tillgängliga scheman
├── scrape-all.cjs       # Huvudscraper
└── schemas.json         # Genererad lista över scheman

.github/workflows/
└── scrape.yml           # GitHub Actions workflow

supabase.sql             # Databasschema
.env                     # Miljövariabler (lokal)
```

## 🔧 Funktioner

- **Automatisk schemagenerering**: Hämtar alla tillgängliga scheman från skiftschema.se
- **Robust scraping**: Hanterar fel och timeouts
- **Databaslagring**: Lagrar data i Supabase med duplikatskydd
- **Automatisering**: Daglig körning via GitHub Actions
- **Loggning**: Detaljerad loggning av alla operationer

## 📊 Datastruktur

Varje skift lagras med följande fält:

- `company`: Företagsnamn
- `department`: Avdelning
- `team`: Team/grupp
- `date`: Datum
- `shift`: Skiftkod
- `time`: Tid (om tillgänglig)
- `source_url`: Ursprungs-URL
- `scraped_at`: Tidpunkt för scraping

## 🛠️ Felsökning

### Vanliga problem

1. **Puppeteer fel**: Kontrollera att Chrome/Chromium är installerat
2. **Supabase fel**: Verifiera URL och API-nyckel
3. **Nätverksfel**: Kontrollera internetanslutning

### Loggar

Scrapern loggar alla operationer till konsolen. Kolla GitHub Actions logs för automatiska körningar.

## 🔒 Säkerhet

- Service Role Key används endast för databasoperationer
- Row Level Security (RLS) aktiverat i Supabase
- Miljövariabler lagras säkert i GitHub Secrets