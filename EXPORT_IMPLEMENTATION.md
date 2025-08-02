# Export Implementation - Skiftappen

## Översikt

Denna implementation lägger till en betalad exportfunktion som låter användare exportera sina skiftscheman som .ics-filer för import i kalenderapplikationer.

## Komponenter

### 1. Supabase Database Schema

**Ny tabell: `users`**
```sql
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  has_paid_export BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Kör migration:**
```bash
# Kör SQL-filen i Supabase Dashboard eller via CLI
supabase db reset
# eller
psql -h your-host -U postgres -d postgres -f database-migrations/001_add_users_table.sql
```

### 2. Stripe Webhook (`/api/webhook.js`)

Webhook som lyssnar på Stripe-betalningar och uppdaterar användarens exportbehörighet.

**Miljövariabler som behövs:**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Supported Events:**
- `payment_intent.succeeded`
- `checkout.session.completed`

### 3. CalendarExport Component

React-komponent som:
- Kontrollerar om användaren har betalat för export
- Visar köp-knapp för icke-betalande användare
- Genererar och laddar ner .ics-filer för betalande användare

**Features:**
- ✅ Betalningskontroll via Supabase
- ✅ .ics-filgenerering enligt RFC 5545
- ✅ Automatisk nedladdning i webbläsare
- ✅ Stöd för Google Calendar, Apple Calendar, Outlook
- ✅ Responsiv design med Tailwind CSS

## Installation

### 1. Installera dependencies

```bash
npm install stripe
```

### 2. Kör database migration

```sql
-- Kör innehållet från database-migrations/001_add_users_table.sql
-- i din Supabase SQL Editor
```

### 3. Konfigurera Stripe Webhook

1. Gå till Stripe Dashboard → Webhooks
2. Lägg till endpoint: `https://your-domain.com/api/webhook`
3. Välj events: `payment_intent.succeeded`, `checkout.session.completed`
4. Kopiera webhook secret till miljövariabler

### 4. Uppdatera miljövariabler

```env
# Lägg till i .env.local
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Användning

### För användare utan betalning:
- Ser meddelande om att export kräver betalning (99 kr)
- Kan klicka på "Köp exportfunktion" för att starta betalning

### För användare med betalning:
- Ser grön "Export tillgänglig"-ruta
- Kan klicka "Exportera till kalender (.ics)" för att ladda ner fil
- Filen kan importeras i alla större kalenderapplikationer

## ICS-filformat

Genererade filer följer RFC 5545 standarden och inkluderar:

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Skiftappen//Shift Calendar//SV
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Skiftschema
X-WR-TIMEZONE:Europe/Stockholm

BEGIN:VEVENT
UID:shift-123-20240101T120000Z@skiftappen.se
DTSTART:20240101T080000Z
DTEND:20240101T160000Z
SUMMARY:Skift - Receptionist
DESCRIPTION:Position: Receptionist\nPlats: Huvudkontor
LOCATION:Huvudkontor
STATUS:CONFIRMED
END:VEVENT

END:VCALENDAR
```

## Säkerhet

- ✅ Row Level Security (RLS) på users-tabellen
- ✅ Webhook signature verification från Stripe
- ✅ Service role key för säker databasaccess
- ✅ User authentication required för export

## Testing

### Testa webhook lokalt:
```bash
# Använd Stripe CLI för att forwarda webhooks
stripe listen --forward-to localhost:3000/api/webhook
stripe trigger payment_intent.succeeded
```

### Testa export utan betalning:
1. Logga in som användare
2. Navigera till kalender
3. Verifiera att "Export kräver betalning" visas

### Testa export med betalning:
1. Uppdatera user i databas: `UPDATE users SET has_paid_export = true WHERE email = 'test@example.com'`
2. Ladda om sidan
3. Verifiera att export-knappen fungerar

## Nästa steg

För produktion, överväg att lägga till:

1. **Stripe Checkout Integration**
   - Skapa checkout-session för 99 kr
   - Redirect till betalningssida
   - Success/cancel URLs

2. **Email Notifications**
   - Bekräftelsemail efter betalning
   - Instruktioner för .ics import

3. **Analytics**
   - Spåra exportanvändning
   - Konverteringsstatistik för betalningar

4. **Error Handling**
   - Retry-logik för misslyckade webhooks
   - Logging och monitoring

## Support

Användare kan importera .ics-filer i:
- ✅ Google Calendar
- ✅ Apple Calendar (iOS/macOS)
- ✅ Microsoft Outlook
- ✅ Mozilla Thunderbird
- ✅ De flesta andra kalenderapplikationer