# 🔄 Skiftschema.se Scraper

Automatisk scraper för att klona alla skiftscheman från skiftschema.se och ladda upp till Supabase.

## 📋 Översikt

Detta projekt automatiserar processen att:
1. 🕸️ Skrapa alla företag och lag från skiftschema.se
2. 🗄️ Generera SQL-schema för databas
3. 📅 Extrahera skiftdata från varje lags kalender
4. ☁️ Ladda upp data till Supabase

## 🚀 Snabbstart

### 1. Installation

```bash
# Klona projektet
git clone <repository-url>
cd skiftschema-scraper

# Installera dependencies
npm install
```

### 2. Konfigurera Supabase

1. Skapa ett nytt projekt på [Supabase](https://supabase.com)
2. Kopiera din projekt-URL och API-nyckel
3. Uppdatera `.env`-filen:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key
```

### 3. Kör scrapern

```bash
# Kör komplett scraping och upload
npm start

# Eller kör steg för steg:
npm run scrape-teams    # Skrapa alla lag från webbplatsen
npm run scrape-upload   # Ladda upp skiftdata till Supabase
```

## 📊 Data Structure

### Companies (Företag)
- ABB, SSAB, LKAB, Stora Enso, Barilla, etc.

### Departments (Avdelningar)
- HVC, Borlänge, Kiruna, Nymölla, Filipstad, etc.

### Teams (Lag)
- A-skift, B-skift, Lag 1, Grupp 1, etc.

### Shifts (Skift)
- **F** (Förmiddag): 06:00-14:00
- **E** (Eftermiddag): 14:00-22:00  
- **N** (Natt): 22:00-06:00
- **L** (Ledigt): Ingen arbetstid

## 🗄️ Databas Schema

Kör SQL-skriptet för att skapa tabellerna:

```sql
-- Se skiftschema-schema.sql för komplett schema
CREATE TABLE companies (id, name, created_at);
CREATE TABLE departments (id, company_id, name, created_at);
CREATE TABLE teams (id, department_id, name, url, created_at);
CREATE TABLE shifts (id, team_id, date, shift_type, start_time, end_time, raw_data, created_at, updated_at);
```

## 📁 Filstruktur

```
skiftschema-scraper/
├── scripts/
│   └── scrape-upload-cursor.cjs    # Huvudsaklig scraper
├── teams-array.js                  # Alla lag och URL:er
├── skiftschema-schema.sql          # Databas schema
├── scrape-skiftschema.js          # Initial scraper för lag
├── package.json                    # Dependencies
├── .env                           # Supabase konfiguration
└── README.md                      # Denna fil
```

## 🔧 Konfiguration

### Environment Variables (.env)
```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# Scraper Configuration  
HEADLESS_BROWSER=true
BATCH_SIZE=3
DELAY_BETWEEN_BATCHES=2000
```

### Teams Array (teams-array.js)
Innehåller alla 75+ lag från 12 företag:

```javascript
const TEAMS = [
  { id: 1, company: "ABB", department: "HVC", team: "Skift 1", url: "https://..." },
  { id: 2, company: "ABB", department: "HVC", team: "Skift 2", url: "https://..." },
  // ... 73 fler lag
];
```

## ⚙️ Avancerad användning

### Skrapa specifika lag

```javascript
const { scrapeTeamSchedule } = require('./scripts/scrape-upload-cursor.cjs');

// Skrapa ett specifikt lag
const team = { id: 1, company: "ABB", team: "Skift 1", url: "https://..." };
const shifts = await scrapeTeamSchedule(team);
console.table(shifts);
```

### Anpassad batch-storlek

```javascript
// I scripts/scrape-upload-cursor.cjs
const BATCH_SIZE = 5; // Ändra från 3 till 5 lag per batch
```

## 📈 Statistik

Scrapern hanterar:
- **12 företag** (ABB, SSAB, LKAB, Stora Enso, etc.)
- **15 avdelningar** (olika orter och fabriker)
- **75 lag** (olika skift och grupper)
- **~27,000 skiftposter** per år (365 dagar × 75 lag)

## 🛠️ Felsökning

### Vanliga problem

**Puppeteer timeout:**
```bash
# Öka timeout i scraper-filen
await page.goto(team.url, { timeout: 60000 });
```

**Supabase connection error:**
```bash
# Kontrollera .env-filen
echo $SUPABASE_URL
echo $SUPABASE_KEY
```

**Ingen data extraherad:**
```bash
# Kör i non-headless mode för debugging
const browser = await puppeteer.launch({ headless: false });
```

### Debug mode

```javascript
// I scripts/scrape-upload-cursor.cjs
const browser = await puppeteer.launch({ 
  headless: false,  // Visa webbläsaren
  slowMo: 250      // Långsammare för debugging
});
```

## 📅 Automatisering

### Cron job (Linux/Mac)
```bash
# Kör varje dag kl 06:00
0 6 * * * cd /path/to/skiftschema-scraper && npm run scrape-upload
```

### GitHub Actions
```yaml
name: Daily Scrape
on:
  schedule:
    - cron: '0 6 * * *'  # Varje dag 06:00 UTC
jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run scrape-upload
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
```

## 🤝 Bidra

1. Forka projektet
2. Skapa en feature branch (`git checkout -b feature/amazing-feature`)
3. Commita dina ändringar (`git commit -m 'Add amazing feature'`)
4. Pusha till branchen (`git push origin feature/amazing-feature`)
5. Öppna en Pull Request

## 📄 Licens

MIT License - se LICENSE-filen för detaljer.

## ⚖️ Ansvarsskyldighet

Denna scraper är endast för utbildningssyfte. Respektera skiftschema.se:s terms of service och använd inte scrapern för kommersiella ändamål utan tillstånd.

---

**Made with ❤️ by Cursor Agent**
