# Skiftappen Backend Server

## 🚀 Komplett Backend för Skiftschemaläggning

Detta är backend-servern för Skiftappen med fullständig integration för:
- ✅ Google OAuth & Calendar synkning
- ✅ ICS import/export för Apple Kalender
- ✅ E-postnotifieringar
- ✅ Supabase webhook integration

## 📋 Installation

### 1. Installera beroenden
```bash
cd server
npm install
```

### 2. Konfigurera miljövariabler
Kopiera `.env.example` till `.env` och fyll i dina värden:

```bash
cp .env.example .env
```

### 3. Starta servern
```bash
# Development
npm run dev

# Production
npm start
```

## 🔧 API Endpoints

### Google OAuth
- `POST /api/google/oauth` - Token exchange för Google OAuth

### Kalender Import/Export
- `POST /api/import-ics` - Importera från ICS-URL
- `GET /api/export.ics` - Exportera till ICS-format

### Google Calendar Integration
- `POST /api/calendar/sync-to-calendar` - Synka skift till Google Calendar
- `GET /api/calendar/events` - Hämta händelser från Google Calendar

### E-postnotifieringar
- `POST /api/email/send-shift-notification` - Skicka notifiering för nytt skift
- `POST /api/email/send-shift-reminder` - Skicka påminnelse för kommande skift

### Webhooks
- `POST /api/notify` - Webhook för Supabase triggers

## 🗄️ Supabase Setup

### 1. Skapa webhook-funktionen
Kör följande SQL i Supabase SQL Editor:

```sql
-- Från server/supabase/webhook-functions.sql
create or replace function notify_new_shift()
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://your-backend.com/api/notify',
    headers := json_build_object('Content-Type', 'application/json'),
    body := json_build_object(
      'shift_id', NEW.id,
      'date', NEW.date,
      'team_id', NEW.team_id
    )::text
  );
  return NEW;
end;
$$ language plpgsql;

create trigger on_new_shift
after insert on shifts
for each row execute procedure notify_new_shift();
```

### 2. Uppdatera webhook URL
Ändra `https://your-backend.com` till din faktiska backend-URL.

## 📧 E-postkonfiguration

### Gmail Setup
1. Aktivera 2-faktor-autentisering på ditt Gmail-konto
2. Skapa ett App Password: https://myaccount.google.com/apppasswords
3. Använd App Password som `EMAIL_PASS` i .env

### Andra e-postleverantörer
Uppdatera `transporter` konfigurationen i `routes/emailNotifications.js`.

## 🔗 Google Calendar Integration

### 1. Google Cloud Console Setup
1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Skapa nytt projekt eller välj befintligt
3. Aktivera Google Calendar API
4. Skapa OAuth 2.0 credentials
5. Lägg till dina redirect URIs

### 2. Miljövariabler
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 📱 Frontend Integration

### Använd CalendarImportExport komponenten
```tsx
import { CalendarImportExport } from '../components/CalendarImportExport';

function CalendarPage() {
  return (
    <CalendarImportExport
      onImportSuccess={(count) => {
        console.log(`${count} skift importerade!`);
      }}
      onExportSuccess={(url) => {
        console.log(`Export URL: ${url}`);
      }}
    />
  );
}
```

## 🔄 Flödesöversikt

### 1. Nytt skift skapas i Supabase
→ Trigger `on_new_shift` aktiveras
→ HTTP POST till `/api/notify`
→ E-postnotifiering skickas till teammedlemmar

### 2. Import från extern kalender
→ Användaren anger ICS-URL
→ POST till `/api/import-ics`
→ Events parsas och sparas i Supabase
→ Webhook triggas för varje nytt skift

### 3. Export till Apple Kalender
→ GET `/api/export.ics`
→ Skapar ICS-fil från Supabase data
→ Användaren prenumererar på URL:en

### 4. Google Calendar synkning
→ OAuth flow för användarautentisering
→ Access token sparas per användare
→ Automatisk synkning vid nya skift

## 🛠️ Development

### Projektstruktur
```
server/
├── routes/
│   ├── googleOAuth.js      # Google OAuth hantering
│   ├── importICS.js        # ICS import funktionalitet
│   ├── exportICS.js        # ICS export funktionalitet
│   ├── googleCalendar.js   # Google Calendar API
│   ├── emailNotifications.js # E-postnotifieringar
│   └── notify.js           # Webhook hantering
├── supabase/
│   └── webhook-functions.sql # Supabase triggers
├── server.js               # Huvudserver
├── package.json
└── .env.example

```

### Loggar
Servern loggar alla viktiga händelser:
- OAuth token exchanges
- Kalender import/export aktiviteter  
- E-postnotifieringar
- Webhook anrop från Supabase

## 🚨 Felsökning

### Vanliga problem

**CORS-fel**
- Kontrollera att `FRONTEND_URL` är korrekt i .env
- Lägg till din frontend-domän i CORS-konfigurationen

**Google OAuth misslyckas**
- Verifiera `GOOGLE_CLIENT_ID` och `GOOGLE_CLIENT_SECRET`
- Kontrollera redirect URIs i Google Cloud Console

**E-post skickas inte**
- Kontrollera Gmail App Password
- Testa SMTP-inställningar med andra leverantörer

**Webhook fungerar inte**
- Kontrollera att `BACKEND_URL` är tillgänglig från Supabase
- Verifiera webhook-funktionen i Supabase SQL Editor

## 📞 Support

För frågor eller problem, kontakta utvecklingsteamet eller skapa en issue i projektet.

---

🎉 **Allt är nu klart för komplett kalenderintegration!**