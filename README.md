# ShiftChat - Chat-app för Skiftarbetare

En modern chat-applikation speciellt utvecklad för skiftarbetare med funktioner för gruppchatt, formulärhantering och kalenderexport.

## 🚀 Funktioner

### ✅ Grundfunktioner
- **Gruppchatt** - Chatta med kollegor baserat på företag och avdelning
- **Formulärhantering** - Skapa och hantera skiftöverlämningar, extra jobb och haverier
- **Online-status** - Se vilka kollegor som är online
- **Realtidsmeddelanden** - Få meddelanden direkt när de skickas
- **Profilbilder** - Automatiskt genererade avatarer baserat på namn

### 📱 Avancerade funktioner
- **Intresserad-knapp** - Markera intresse för extra jobb
- **Privat chatt** - Starta privata konversationer med intresserade kollegor
- **Kalenderexport** - Exportera skift till Google/Apple Kalender (99 kr engångsbetalning)
- **Betalningsintegration** - Stripe, Apple Pay, Google Pay

### 🔐 Autentisering
- Google OAuth
- Apple Sign In
- Facebook Login
- Automatisk profilskapande

## 🛠️ Teknisk Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time + Auth)
- **Betalningar**: Stripe
- **Hosting**: Vite + Vercel/Netlify
- **Icons**: Lucide React

## 📋 Installation

### 1. Klona projektet
```bash
git clone https://github.com/ditt-användarnamn/shiftchat-app.git
cd shiftchat-app
```

### 2. Installera dependencies
```bash
npm install
```

### 3. Konfigurera miljövariabler
Skapa en `.env` fil i projektets rot:

```env
# Supabase
REACT_APP_SUPABASE_URL=din_supabase_url
REACT_APP_SUPABASE_ANON_KEY=din_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=din_service_role_key

# Stripe
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# OAuth (konfigureras i Supabase Dashboard)
# Google, Apple, Facebook credentials läggs till i Supabase Auth Settings
```

### 4. Sätt upp Supabase-databasen
```bash
# Kör SQL-scriptet i Supabase SQL Editor
cat schema.sql | pbcopy
# Klistra in i Supabase Dashboard > SQL Editor > New Query
```

### 5. Konfigurera OAuth-providers

#### Google OAuth
1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Skapa ett nytt projekt eller välj befintligt
3. Aktivera Google+ API
4. Skapa OAuth 2.0 credentials
5. Lägg till authorized redirect URI: `https://din-supabase-url.supabase.co/auth/v1/callback`
6. Lägg till credentials i Supabase Dashboard > Authentication > Settings > Auth Providers

#### Apple Sign In
1. Gå till [Apple Developer Console](https://developer.apple.com/)
2. Skapa en App ID med Sign In with Apple capability
3. Skapa en Service ID
4. Konfigurera Return URLs: `https://din-supabase-url.supabase.co/auth/v1/callback`
5. Lägg till credentials i Supabase

#### Facebook Login
1. Gå till [Facebook Developers](https://developers.facebook.com/)
2. Skapa en ny app
3. Lägg till Facebook Login product
4. Konfigurera Valid OAuth Redirect URIs
5. Lägg till credentials i Supabase

### 6. Starta utvecklingsservern
```bash
npm run dev
```

Appen kommer att vara tillgänglig på `http://localhost:5173`

## 🗄️ Databasstruktur

### Huvudtabeller
- `companies` - Företagsinformation
- `departments` - Avdelningar per företag
- `teams` - Team per avdelning
- `users` - Användardata med företags-/avdelningstillhörighet
- `groups` - Chattgrupper
- `group_members` - Gruppmedlemskap
- `messages` - Chattmeddelanden
- `shift_forms` - Formulär för skift
- `payment_transactions` - Betalningshistorik

### Säkerhet
- Row Level Security (RLS) aktiverat på alla tabeller
- Användare kan endast se data från sitt eget företag
- Automatisk filtrering baserat på företagstillhörighet

## 💳 Betalningsintegration

### Stripe Setup
1. Skapa Stripe-konto på [stripe.com](https://stripe.com)
2. Hämta API-nycklar från Dashboard
3. Konfigurera webhooks (valfritt för avancerad funktionalitet)

### Betalningsflöde
1. Användare klickar på "Kalender Export"
2. PaymentModal öppnas med prissättning (99 kr)
3. Användare väljer betalningsmetod (kort/Apple Pay/Google Pay)
4. Stripe hanterar betalningen säkert
5. Vid lyckad betalning aktiveras kalenderexport för användaren

## 🔧 API Endpoints

### Frontend API (src/lib/api.ts)
- `userAPI` - Användarhantering
- `formsAPI` - Formulärhantering  
- `chatAPI` - Chat och gruppfunktioner
- `calendarAPI` - Kalenderexport
- `companyAPI` - Företags-/avdelningsdata

### Backend API (api/)
- `POST /api/create-payment-intent` - Skapa Stripe payment intent

## 🚀 Deployment

### Vercel Deployment
```bash
# Installera Vercel CLI
npm i -g vercel

# Deploy
vercel

# Sätt miljövariabler i Vercel Dashboard
```

### Netlify Deployment
```bash
# Bygg projektet
npm run build

# Ladda upp dist/ mappen till Netlify
# Eller anslut GitHub repo för automatisk deploy
```

### Miljövariabler för produktion
Se till att alla miljövariabler är konfigurerade i din hosting-plattform:
- Supabase URL och nycklar
- Stripe nycklar
- OAuth-credentials (konfigureras i Supabase)

## 📱 Användning

### För Administratörer
1. Logga in via Supabase Dashboard
2. Lägg till företag i `companies` tabellen
3. Lägg till avdelningar i `departments` tabellen
4. Användare kan sedan välja sitt företag vid första inloggningen

### För Användare
1. Gå till appen och logga in med Google/Apple/Facebook
2. Välj ditt företag och avdelning
3. Börja chatta i grupper eller skapa formulär
4. Köp kalenderexport för 99 kr (engångsbetalning)

## 🔒 Säkerhet

- Alla API-anrop autentiseras via Supabase Auth
- Row Level Security förhindrar åtkomst till andra företags data
- Stripe hanterar alla betalningar säkert (PCI-compliant)
- OAuth-providers hanterar autentisering
- HTTPS krävs för produktion

## 🐛 Felsökning

### Vanliga problem

**Supabase-anslutning fungerar inte**
- Kontrollera att URL och API-nycklar är korrekta
- Verifiera att RLS-policies är korrekt konfigurerade

**OAuth fungerar inte**
- Kontrollera redirect URIs i OAuth-provider settings
- Verifiera att credentials är korrekt konfigurerade i Supabase

**Stripe-betalningar fungerar inte**
- Kontrollera att API-nycklar är för rätt miljö (test/live)
- Verifiera CORS-inställningar för API endpoints

**Meddelanden uppdateras inte i realtid**
- Kontrollera nätverksanslutning
- Verifiera att Supabase realtime är aktiverat

## 📞 Support

För support och frågor:
- Skapa en issue på GitHub
- Kontakta utvecklaren via e-post
- Läs dokumentationen på [Supabase Docs](https://supabase.com/docs)

## 📄 Licens

Detta projekt är licensierat under MIT License. Se `LICENSE` filen för detaljer.

## 🤝 Bidra

Bidrag är välkomna! Se `CONTRIBUTING.md` för riktlinjer.

1. Forka projektet
2. Skapa en feature branch (`git checkout -b feature/AmazingFeature`)
3. Commita dina ändringar (`git commit -m 'Add some AmazingFeature'`)
4. Pusha till branchen (`git push origin feature/AmazingFeature`)
5. Öppna en Pull Request

---

**Utvecklad med ❤️ för skiftarbetare**
