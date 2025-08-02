# 🏢 SkiftApp Backend

En komplett backend för skiftschemahantering med Google Calendar-integration och Supabase.

## 🚀 Funktioner

- ✅ **Google OAuth 2.0** - Säker autentisering
- ✅ **Google Calendar API** - Automatisk synkning av skift
- ✅ **Supabase Integration** - Databas och realtidsuppdateringar  
- ✅ **Push-notifikationer** - Meddelanden om kalenderhändelser
- ✅ **RESTful API** - Komplett CRUD för skift och kalenderhändelser
- ✅ **Token Management** - Automatisk refresh av Google tokens

## 📦 Installation

### 1. Klona och installera dependencies

```bash
npm install
```

### 2. Konfigurera miljövariabler

Kopiera `.env.example` till `.env` och fyll i dina värden:

```bash
cp .env.example .env
```

```env
PORT=3000

# Google OAuth
GOOGLE_CLIENT_ID=din_google_client_id
GOOGLE_CLIENT_SECRET=din_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:3001

# Supabase
SUPABASE_URL=https://din-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=din_service_role_key
```

### 3. Konfigurera Google OAuth

1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Skapa ett nytt projekt eller välj befintligt
3. Aktivera Google Calendar API
4. Skapa OAuth 2.0 credentials
5. Lägg till authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (utveckling)
   - `https://din-backend.com/auth/google/callback` (produktion)

### 4. Konfigurera Supabase

Kör SQL-schemat i din Supabase-databas:

```bash
# Kopiera innehållet från supabase-schema.sql och kör i Supabase SQL Editor
```

### 5. Starta servern

```bash
# Utveckling
npm run dev

# Produktion  
npm start
```

## 🔗 API Endpoints

### Autentisering

- `GET /auth/google` - Initiera Google OAuth
- `GET /auth/google/callback` - OAuth callback

### Kalenderhändelser

- `POST /calendar/create-event` - Skapa ny händelse
- `GET /calendar/events/:userEmail` - Hämta användarens händelser
- `PUT /calendar/update-event/:eventId` - Uppdatera händelse
- `DELETE /calendar/delete-event/:eventId` - Ta bort händelse

### Skifthantering

- `GET /calendar/shifts/:userEmail` - Hämta användarens skift
- `POST /calendar/sync-shifts` - Synka skift till Google Calendar

## 📋 API Exempel

### Skapa kalenderhändelse

```javascript
POST /calendar/create-event
Content-Type: application/json

{
  "userEmail": "user@example.com",
  "title": "Arbetspass - Café Stockholm",
  "description": "Morgonpass på caféet",
  "startTime": "2024-01-15T08:00:00.000Z",
  "endTime": "2024-01-15T16:00:00.000Z",
  "location": "Café Stockholm, Drottninggatan 1",
  "attendees": ["manager@cafe.com"]
}
```

### Hämta händelser

```javascript
GET /calendar/events/user@example.com?timeMin=2024-01-01T00:00:00.000Z&timeMax=2024-01-31T23:59:59.000Z
```

### Synka skift

```javascript
POST /calendar/sync-shifts
Content-Type: application/json

{
  "userEmail": "user@example.com"
}
```

## 🗄️ Databasschema

### Huvudtabeller

- **google_tokens** - Google OAuth tokens
- **calendar_events** - Kalenderhändelser från Google
- **shifts** - Användarens skift/arbetspass
- **notifications** - Push-notifikationer
- **user_profiles** - Användarprofiler
- **employers** - Arbetsgivare/klienter
- **payments** - Löner och betalningar

### Exempel: Skapa skift

```sql
INSERT INTO shifts (user_email, title, start_time, end_time, location, hourly_rate)
VALUES (
  'user@example.com',
  'Morgonpass - Café',
  '2024-01-15 08:00:00+01',
  '2024-01-15 16:00:00+01', 
  'Café Stockholm',
  150.00
);
```

## 🔔 Push-notifikationer

Systemet sparar automatiskt notifikationer i Supabase när:

- ✅ Ny kalenderhändelse skapas
- ✅ Händelse uppdateras  
- ✅ Händelse tas bort
- ✅ Skift synkas till kalender

För att integrera med push-tjänster, uppdatera `sendPushNotification()` funktionen i `calendar.js`.

## 🚀 Deployment

### Replit

1. Importera detta repo till Replit
2. Konfigurera miljövariabler i Secrets
3. Kör `npm start`

### Railway/Render

1. Anslut GitHub repo
2. Sätt miljövariabler
3. Deploy automatiskt

### Vercel/Netlify

För serverless deployment, konvertera till Vercel Functions eller Netlify Functions.

## 🔧 Utveckling

### Projektstruktur

```
skiftapp-backend/
├── server.js          # Huvudserver
├── googleAuth.js       # Google OAuth hantering
├── calendar.js         # Kalender API endpoints
├── supabase-schema.sql # Databasschema
├── package.json        # Dependencies
├── .env.example        # Miljövariabler mall
└── README.md          # Denna fil
```

### Lägga till nya endpoints

```javascript
// I calendar.js
router.post('/calendar/new-endpoint', async (req, res) => {
  try {
    // Din logik här
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🤝 Frontend Integration

### React/Next.js Exempel

```javascript
// Skapa händelse
const createEvent = async (eventData) => {
  const response = await fetch('/calendar/create-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  });
  return response.json();
};

// Hämta händelser
const getEvents = async (userEmail) => {
  const response = await fetch(`/calendar/events/${userEmail}`);
  return response.json();
};
```

### Loveable Integration

Använd dessa endpoints direkt i din Loveable-app för att hantera kalenderfunktioner.

## 📞 Support

För frågor och support, kontakta utvecklaren eller skapa en issue i GitHub-repot.

---

**🎉 Nu är din SkiftApp backend redo att användas!**
