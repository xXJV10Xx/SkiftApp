# Skiftappen - Shift Management System

En modern webb-applikation för att hantera och schemalägg skift, byggd med React, Express, och Supabase.

## 📋 Projektstruktur

```
skiftappen/
├── backend/             → Express API (valfritt)
├── scripts/             → Web scraper för skiftdata
├── frontend/            → React + Tailwind UI
├── .env                 → API-nycklar och konfiguration
├── supabase/            → SQL-schema + seed data
└── README.md           → Denna fil
```

## 🚀 Funktioner

### Frontend (React + Tailwind)
- **Dashboard**: Översikt över skift och statistik
- **Skifthantering**: Skapa, redigera och tilldela skift
- **Användarautentisering**: Inloggning och registrering
- **Responsiv design**: Fungerar på alla enheter
- **Moderna UI-komponenter**: Med Lucide React ikoner

### Backend (Express API)
- **RESTful API**: För skift-, användar- och autentiseringshantering
- **Säkerhet**: CORS, helmet, rate limiting
- **Middleware**: Autentisering och auktorisering
- **Supabase-integration**: Databasanslutning

### Scraper (Node.js)
- **Automatisk skiftinhämtning**: Scrapa skift från externa webbplatser
- **Schemalagd körning**: Cron-jobb för regelbunden uppdatering
- **Puppeteer + Cheerio**: För webb-scraping
- **Databasintegration**: Spara scrapade skift i Supabase

### Databas (Supabase)
- **PostgreSQL**: Med Row Level Security (RLS)
- **Autentisering**: Inbyggd användarhantering
- **Realtid**: Live-uppdateringar av data
- **Backup**: Automatisk säkerhetskopiering

## 🛠️ Installation och Setup

### Förutsättningar
- Node.js (v18 eller senare)
- npm eller yarn
- Supabase-konto

### 1. Klona projektet
```bash
git clone <repository-url>
cd skiftappen
```

### 2. Konfigurera miljövariabler
Kopiera `.env` och uppdatera med dina nycklar:

```bash
# Databas
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Backend API
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here

# Frontend
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Setup Supabase-databas
```sql
-- Kör schema.sql i Supabase SQL Editor
-- Sedan kör seed.sql för testdata
```

### 4. Installera och starta komponenter

#### Frontend
```bash
cd frontend
npm install
npm start
```
Öppnar på http://localhost:3000

#### Backend (valfritt)
```bash
cd backend
npm install
npm run dev
```
Körs på http://localhost:3001

#### Scraper
```bash
cd scripts
npm install
npm start
```

## 📚 API-dokumentation

### Autentisering
- `POST /api/auth/login` - Logga in användare
- `POST /api/auth/register` - Registrera ny användare
- `POST /api/auth/logout` - Logga ut användare

### Skift
- `GET /api/shifts` - Hämta alla skift
- `GET /api/shifts/:id` - Hämta specifikt skift
- `POST /api/shifts` - Skapa nytt skift
- `PUT /api/shifts/:id` - Uppdatera skift
- `DELETE /api/shifts/:id` - Ta bort skift

### Användare
- `GET /api/users` - Hämta alla användare (admin)
- `GET /api/users/profile` - Hämta egen profil
- `PUT /api/users/profile` - Uppdatera egen profil
- `GET /api/users/:id/shifts` - Hämta användarens skift

## 🗄️ Databasschema

### Huvudtabeller
- **users**: Användarinformation och roller
- **shifts**: Skiftdata med tider och platser
- **locations**: Arbetsplatser och lokaler
- **shift_applications**: Ansökningar till skift
- **shift_participants**: Deltagare i skift
- **availability**: Användares tillgänglighet
- **time_off_requests**: Ledighetsansökningar
- **notifications**: Systemnotifikationer
- **audit_logs**: Revisionslogg

### Roller och behörigheter
- **Admin**: Full åtkomst till alla funktioner
- **Manager**: Kan skapa och hantera skift
- **Employee**: Kan se och ansöka om skift

## 🔧 Utveckling

### Kodstruktur
```
frontend/src/
├── components/         → Återanvändbara komponenter
├── pages/             → Sidkomponenter
├── hooks/             → Custom React hooks
├── utils/             → Hjälpfunktioner
└── types/             → TypeScript-typer

backend/
├── routes/            → API-rutter
├── middleware/        → Express middleware
└── models/            → Datamodeller

scripts/
└── scraper.js         → Huvudscrapern
```

### Köra tester
```bash
# Frontend
cd frontend && npm test

# Backend
cd backend && npm test

# Scraper
cd scripts && npm test
```

### Linting och formatering
```bash
# Kör ESLint
npm run lint

# Formatera kod
npm run format
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Bygg produktionsversion: `npm run build`
2. Deploya `build/`-mappen
3. Konfigurera miljövariabler

### Backend (Railway/Heroku)
1. Push till Git-repository
2. Konfigurera miljövariabler
3. Starta med `npm start`

### Scraper (Cron-jobb)
1. Deploya till server med cron-support
2. Konfigurera schemalagd körning
3. Övervaka loggar

## 📊 Funktionsöversikt

### ✅ Implementerat
- [x] Grundläggande projektstruktur
- [x] React frontend med Tailwind CSS
- [x] Express backend med API-rutter
- [x] Supabase-databasschema
- [x] Användarautentisering (UI)
- [x] Skifthantering (UI)
- [x] Web scraper-ramverk
- [x] Responsiv design

### 🔄 Pågående utveckling
- [ ] Supabase-integration i frontend
- [ ] Backend-middleware för autentisering
- [ ] Scraper-implementation för specifika sajter
- [ ] Realtidsuppdateringar
- [ ] Push-notifikationer

### 📋 Framtida funktioner
- [ ] Mobilapp (React Native)
- [ ] Avancerad rapportering
- [ ] Integration med kalendersystem
- [ ] Lönesystem-integration
- [ ] AI-baserad skiftoptimering

## 🤝 Bidrag

1. Forka projektet
2. Skapa en feature-branch (`git checkout -b feature/ny-funktion`)
3. Committa ändringar (`git commit -am 'Lägg till ny funktion'`)
4. Pusha till branch (`git push origin feature/ny-funktion`)
5. Skapa en Pull Request

## 📝 Licens

Detta projekt är licensierat under MIT-licensen - se [LICENSE](LICENSE) för detaljer.

## 🆘 Support

För support och frågor:
- Skapa en issue på GitHub
- Kontakta utvecklingsteamet
- Läs dokumentationen

---

**Skiftappen** - Effektiv skifthantering för moderna arbetsplatser 🚀
