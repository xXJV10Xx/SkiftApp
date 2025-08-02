# 🔐 Google OAuth Setup Guide för Skiftappen

Denna guide hjälper dig att konfigurera Google OAuth för hela Skiftappen-ekosystemet (mobilapp, webbapp och backend).

## 📋 Översikt

Vi har implementerat ett komplett Google OAuth-flöde som inkluderar:

- ✅ **Mobilapp** (Expo/React Native) - OAuth via `expo-auth-session`
- ✅ **Webbapp** (React) - OAuth via backend redirect
- ✅ **Backend** (Node.js/Express) - Token hantering och Calendar API
- ✅ **Kalenderintegration** - Exportera skift till Google Calendar

## 🚀 Snabbstart

### 1. Google Cloud Console Setup

1. Gå till [Google Cloud Console](https://console.developers.google.com/)
2. Skapa nytt projekt eller välj befintligt
3. Aktivera följande APIs:
   - Google Calendar API
   - Google+ API (för användarinfo)

4. Skapa OAuth 2.0 Credentials:
   - Gå till "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Skapa separata credentials för varje plattform:

#### Web Application
```
Name: Skiftappen Web
Authorized redirect URIs:
- http://localhost:3000/auth/google/callback (utveckling)
- https://your-domain.com/auth/google/callback (produktion)
```

#### iOS Application
```
Name: Skiftappen iOS
Bundle ID: com.skiftappen.app
```

#### Android Application
```
Name: Skiftappen Android
Package name: com.skiftappen.app
SHA-1: [Din utvecklings- och produktions-SHA1]
```

### 2. Miljövariabler

Kopiera `.env.example` till `.env` och fyll i dina credentials:

```bash
cp .env.example .env
```

Uppdatera följande värden:
```env
GOOGLE_CLIENT_ID=your_web_client_id
GOOGLE_CLIENT_SECRET=your_web_client_secret
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
```

### 3. Databas Setup

Kör dessa SQL-kommandon i din Supabase-databas:

```sql
-- Användartabell (om den inte redan finns)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR,
  avatar_url VARCHAR,
  google_id VARCHAR UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Google tokens tabell
CREATE TABLE google_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type VARCHAR DEFAULT 'Bearer',
  scope TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

### 4. Installation och Start

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Webbapp
```bash
cd web
npm install
npm start
```

#### Mobilapp
```bash
# I projektets root
npm install
npm start
```

## 📱 Användning

### Mobilapp
1. Navigera till `/auth/google-login`
2. Tryck på "Fortsätt med Google"
3. Logga in i Google-popup
4. Automatisk redirect till huvudappen

### Webbapp
1. Gå till `/login`
2. Klicka på "Fortsätt med Google"
3. Omdirigeras till Google OAuth
4. Kommer tillbaka till `/dashboard`

## 🧪 Testning

Kör test-scriptet för att verifiera att allt fungerar:

```bash
cd backend
node test-calendar.js
```

Detta testar:
- ✅ Server hälsa
- ✅ Kalenderexport (kräver inloggad användare)

## 📅 Kalenderintegration

### Exportera ett skift till Google Calendar

```javascript
const response = await fetch('/calendar/export', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_email: 'user@example.com',
    event_data: {
      title: 'Mitt Skift',
      description: 'Beskrivning av skiftet',
      start_time: '2024-01-15T08:00:00.000Z',
      end_time: '2024-01-15T16:00:00.000Z',
      location: 'Arbetsplats',
      timezone: 'Europe/Stockholm'
    }
  })
});
```

## 🔧 API Endpoints

### Backend Routes

| Method | Endpoint | Beskrivning |
|--------|----------|-------------|
| GET | `/auth/google` | Startar OAuth för webb |
| GET | `/auth/google/callback` | OAuth callback för webb |
| POST | `/google-token` | Tar emot tokens från mobilapp |
| POST | `/calendar/export` | Exporterar event till Google Calendar |
| GET | `/health` | Hälsokontroll |

## 🔐 Säkerhet

- ✅ Refresh tokens sparas säkert i Supabase
- ✅ Access tokens förnyas automatiskt
- ✅ CORS konfigurerat för säkra anrop
- ✅ Environment variables för känslig data

## 🚨 Felsökning

### Vanliga problem:

#### "Invalid OAuth client"
- Kontrollera att redirect URIs matchar exakt
- Verifiera att rätt Client ID används för varje plattform

#### "Access denied"
- Kontrollera att användaren har godkänt alla scopes
- Verifiera att Calendar API är aktiverat

#### "Token expired"
- Systemet hanterar automatisk token refresh
- Kontrollera att refresh_token finns i databasen

#### Mobilapp fungerar inte
- Kontrollera att `expo-auth-session` och `expo-web-browser` är installerade
- Verifiera att redirect URI är korrekt konfigurerad för Expo

### Debug-tips:

```bash
# Kontrollera server logs
cd backend && npm run dev

# Kontrollera Expo logs
npx expo start --clear

# Testa API endpoints
curl http://localhost:3000/health
```

## 📦 Filstruktur

```
skiftappen/
├── app/auth/google-login.tsx          # Mobilapp OAuth
├── backend/
│   ├── server.js                      # Express server med OAuth
│   ├── package.json                   # Backend dependencies
│   └── test-calendar.js               # Test script
├── web/
│   ├── src/pages/Login.jsx            # Webbapp login
│   ├── src/pages/Login.css            # Styling
│   └── package.json                   # Web dependencies
├── .env.example                       # Miljövariabel mall
└── GOOGLE_OAUTH_SETUP_GUIDE.md        # Denna guide
```

## 🎯 Nästa steg

1. **Produktion**: Uppdatera redirect URIs för produktionsdomäner
2. **Säkerhet**: Implementera rate limiting och input validation
3. **Features**: Lägg till fler Calendar API funktioner (läsa events, etc.)
4. **UX**: Förbättra felhantering och loading states

## 💡 Tips

- Använd olika Google projekt för utveckling och produktion
- Spara dina Client IDs säkert (använd aldrig i public repos)
- Testa OAuth-flödet på olika enheter och webbläsare
- Övervaka API-användning i Google Cloud Console

---

**🎉 Grattis! Du har nu ett komplett Google OAuth-system för Skiftappen!**

För support, kontakta utvecklingsteamet eller öppna en issue i projektet.