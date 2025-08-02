# Skiftappen 📅

En modern webbapplikation för att visa svenska skiftscheman med månads- och årsvy. Applikationen hämtar automatiskt skiftdata från externa källor och presenterar den i en färgkodad kalendervy.

## ✨ Funktioner

- **📅 Månadsvy**: Detaljerad kalendervy med alla skift för månaden
- **📊 Årsvy**: Översikt över hela året med skiftstatistik
- **🎨 Färgkodade skiftlag**: Varje lag har sin unika färg för enkel identifiering
- **🔍 Lagfiltrering**: Visa/dölj specifika skiftlag
- **🔄 Automatisk uppdatering**: Daglig scraping via GitHub Actions
- **📱 Responsiv design**: Fungerar på alla enheter
- **⚡ Realtidsdata**: Powered by Supabase

## 🏗️ Arkitektur

```
skiftappen/
├── package.json              # Projektberoenden och scripts
├── scripts/
│   └── scrape-all.cjs        # Hämta alla företag, orter, skiftlag och skift
├── supabase/
│   └── schema.sql            # Databasschema för Supabase
├── frontend/
│   ├── app/
│   │   ├── layout.jsx        # Root layout
│   │   ├── page.jsx          # Huvudsida
│   │   ├── CalendarView.jsx  # Kalenderkomponent
│   │   └── globals.css       # Global styling
│   ├── lib/
│   │   └── supabase.js       # Supabase klient och hjälpfunktioner
│   └── utils/
│       └── shiftColors.js    # Färghantering för skiftlag
└── .github/workflows/
    └── scraper.yml           # Daglig scraping via GitHub Actions
```

## 🚀 Kom igång

### Förutsättningar

- Node.js 18+
- Ett Supabase-projekt
- GitHub repository (för automatisk scraping)

### Installation

1. **Klona projektet**
   ```bash
   git clone <repository-url>
   cd skiftappen
   ```

2. **Installera beroenden**
   ```bash
   npm install
   ```

3. **Konfigurera miljövariabler**
   ```bash
   cp .env.example .env.local
   ```
   
   Fyll i dina Supabase-uppgifter:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-role-key
   ```

4. **Sätt upp databasen**
   
   Kör SQL-schemat i Supabase SQL Editor:
   ```bash
   # Kopiera innehållet från supabase/schema.sql
   # Klistra in i Supabase SQL Editor och kör
   ```

5. **Starta utvecklingsservern**
   ```bash
   npm run dev
   ```

   Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare.

## 🔧 Konfiguration

### Supabase Setup

1. Skapa ett nytt projekt på [Supabase](https://supabase.com)
2. Kör SQL-schemat från `supabase/schema.sql`
3. Konfigurera RLS (Row Level Security) policies
4. Hämta dina API-nycklar från projektinställningar

### GitHub Actions Setup

För automatisk daglig scraping, konfigurera följande secrets i ditt GitHub repository:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

### Scraping Konfiguration

Uppdatera `BASE_URL` i `scripts/scrape-all.cjs` med den faktiska URL:en för skiftdata-källan.

## 📊 Datamodell

```sql
companies (företag)
├── id (TEXT, PRIMARY KEY)
├── name (TEXT)
└── timestamps

locations (orter)
├── id (TEXT, PRIMARY KEY)
├── name (TEXT)
├── company_id (TEXT, FK)
└── timestamps

teams (skiftlag)
├── id (TEXT, PRIMARY KEY)
├── name (TEXT)
├── color (TEXT)
├── location_id (TEXT, FK)
└── timestamps

shifts (skift)
├── id (UUID, PRIMARY KEY)
├── team_id (TEXT, FK)
├── date (DATE)
├── shift_type (TEXT)
├── start_time (TIME)
├── end_time (TIME)
└── timestamps
```

## 🎨 Färgkodning

Skiftlag får automatiskt färger baserat på:

1. **Fördefinierade färger** för vanliga lagnamn (A-lag, B-lag, etc.)
2. **Skifttyp-färger** för olika typer av skift
3. **Genererade färger** för okända lag baserat på lagnamn

Se `frontend/utils/shiftColors.js` för fullständig färgkonfiguration.

## 🔄 Automatisk Uppdatering

GitHub Actions workflow (`scraper.yml`) kör:

- **Dagligen kl 06:00 UTC**: Hämtar ny skiftdata
- **Veckovis (söndagar)**: Full datasynkronisering
- **Vid fel**: Backup-försök och notifieringar

## 🛠️ Utveckling

### Tillgängliga Scripts

```bash
npm run dev          # Starta utvecklingsserver
npm run build        # Bygg för produktion
npm run start        # Starta produktionsserver
npm run lint         # Kör linting
npm run scrape       # Kör scraping manuellt
```

### Projektstruktur

- **Frontend**: Next.js 14 med React 18
- **Styling**: Tailwind CSS
- **Databas**: Supabase (PostgreSQL)
- **Scraping**: Node.js med Cheerio
- **Deployment**: Vercel/Netlify kompatibel

### Bidra

1. Forka projektet
2. Skapa en feature branch (`git checkout -b feature/amazing-feature`)
3. Commita dina ändringar (`git commit -m 'Add amazing feature'`)
4. Pusha till branchen (`git push origin feature/amazing-feature`)
5. Öppna en Pull Request

## 📱 Användning

### Månadsvy
- Visa alla skift för en specifik månad
- Färgkodade skiftlag för enkel identifiering
- Klicka på skift för mer detaljer
- Navigera mellan månader med pilknapparna

### Årsvy
- Översikt över hela året
- Skiftstatistik per månad
- Klicka på månad för att växla till månadsvy
- Färgdots visar aktiva lag per månad

### Lagfiltrering
- Visa/dölj specifika skiftlag
- Alla lag visas som standard
- Färgkodade filterknappar
- Realtidsfiltrering av kalendervy

## 🚀 Deployment

### Vercel (Rekommenderat)

1. Koppla ditt GitHub repository till Vercel
2. Konfigurera miljövariabler i Vercel dashboard
3. Deploy automatiskt vid push till main branch

### Netlify

1. Koppla repository till Netlify
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Konfigurera miljövariabler

### Manuell Deployment

```bash
npm run build
npm run start
```

## 🔍 Felsökning

### Vanliga Problem

**Supabase anslutning misslyckas**
- Kontrollera att miljövariabler är korrekt konfigurerade
- Verifiera att RLS policies tillåter läsning
- Kontrollera att tabellerna existerar

**Scraping misslyckas**
- Kontrollera att `BASE_URL` är korrekt
- Verifiera att målwebbplatsen är tillgänglig
- Kontrollera rate limiting inställningar

**Färger visas inte korrekt**
- Kontrollera att Tailwind CSS är korrekt konfigurerat
- Verifiera att färgfunktioner importeras korrekt

### Loggar

- **Utveckling**: Loggar visas i browser console
- **Produktion**: Kontrollera Vercel/Netlify function logs
- **Scraping**: GitHub Actions workflow logs

## 📄 Licens

Detta projekt är licensierat under MIT License - se [LICENSE](LICENSE) filen för detaljer.

## 🤝 Support

- 📧 Email: support@skiftappen.se
- 🐛 Bug reports: [GitHub Issues](https://github.com/your-repo/skiftappen/issues)
- 💬 Diskussioner: [GitHub Discussions](https://github.com/your-repo/skiftappen/discussions)

## 🙏 Tack

- [Supabase](https://supabase.com) för backend-as-a-service
- [Next.js](https://nextjs.org) för React framework
- [Tailwind CSS](https://tailwindcss.com) för styling
- [Lucide](https://lucide.dev) för ikoner
- [date-fns](https://date-fns.org) för datumhantering

---

**Skiftappen** - Gör svenska skiftscheman enkla att förstå och hantera! 🇸🇪
