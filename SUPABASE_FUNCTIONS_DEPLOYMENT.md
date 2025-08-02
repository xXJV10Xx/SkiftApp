# Supabase Functions Deployment

## Förutsättningar

1. **Installera Supabase CLI:**
```bash
npm install -g supabase
```

2. **Logga in på Supabase:**
```bash
supabase login
```

3. **Länka till ditt projekt:**
```bash
supabase link --project-ref ditt-projekt-id
```

## Deploy Webhook-funktionen

### 1. Deploy new-shift webhook
```bash
supabase functions deploy new-shift --no-verify-jwt
```

### 2. Sätt miljövariabler
```bash
supabase secrets set RESEND_API_KEY=din_resend_api_nyckel
```

### 3. Skapa databas-trigger
Kör följande SQL i Supabase Dashboard → SQL Editor:

```sql
-- Skapa trigger för nya skift
CREATE OR REPLACE FUNCTION notify_new_shift()
RETURNS TRIGGER AS $$
BEGIN
  -- Anropa webhook-funktionen
  PERFORM
    net.http_post(
      url := 'https://ditt-projekt-id.supabase.co/functions/v1/new-shift',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := json_build_object(
        'record', row_to_json(NEW)
      )::jsonb
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Skapa trigger som anropas vid INSERT på shifts-tabellen
CREATE TRIGGER on_shift_created
  AFTER INSERT ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_shift();
```

## Testa webhook-funktionen

### 1. Testa manuellt via cURL:
```bash
curl -X POST 'https://ditt-projekt-id.supabase.co/functions/v1/new-shift' \
  -H 'Authorization: Bearer ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "record": {
      "calendarId": "test",
      "summary": "Test Skift",
      "start_time": "2024-01-15T08:00:00Z",
      "end_time": "2024-01-15T16:00:00Z"
    }
  }'
```

### 2. Testa genom att lägga till ett skift:
```sql
INSERT INTO shifts (calendar_id, summary, start_time, end_time)
VALUES ('test-calendar', 'Morgonpass', '2024-01-15 08:00:00+00', '2024-01-15 16:00:00+00');
```

## Databas-schema för aviseringar

Lägg till följande tabeller i Supabase Dashboard → SQL Editor:

```sql
-- Notification settings tabell
CREATE TABLE notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shift_reminders BOOLEAN DEFAULT true,
  reminder_time INTEGER DEFAULT 60, -- minuter före skift
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  weekend_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shift notifications tabell
CREATE TABLE shift_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only access their own notification settings
CREATE POLICY "Users can view own notification settings" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view notifications for their shifts
CREATE POLICY "Users can view shift notifications" ON shift_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shifts 
      WHERE shifts.id = shift_notifications.shift_id 
      AND shifts.user_id = auth.uid()
    )
  );
```

## Resend API Integration

1. **Skaffa Resend API-nyckel:**
   - Gå till [resend.com](https://resend.com)
   - Skapa konto och få API-nyckel

2. **Sätt miljövariabel:**
```bash
supabase secrets set RESEND_API_KEY=re_din_api_nyckel_här
```

3. **Uppdatera webhook-funktionen** för att använda rätt e-postadresser:
```typescript
// I supabase/functions/new-shift.ts
body: JSON.stringify({
  from: 'skiftappen@dindomän.se', // Ändra till din verifierade domän
  to: 'användare@example.com',    // Ändra till rätt mottagare
  subject: 'Nytt skift tillagt',
  html: `<strong>${summary}</strong><br>${start_time} – ${end_time}`,
}),
```

## Övervaka funktionen

### Visa loggar:
```bash
supabase functions logs new-shift
```

### Visa realtidsloggar:
```bash
supabase functions logs new-shift --follow
```

## Felsökning

### Vanliga problem:

1. **Funktionen svarar inte:**
   - Kontrollera att den är deployad: `supabase functions list`
   - Kolla loggar: `supabase functions logs new-shift`

2. **E-post skickas inte:**
   - Verifiera Resend API-nyckel
   - Kontrollera att avsändardomänen är verifierad i Resend

3. **Trigger fungerar inte:**
   - Kontrollera att triggern är skapad: `\dt triggers` i psql
   - Kolla att net.http_post extension är aktiverad

### Aktivera http extension:
```sql
CREATE EXTENSION IF NOT EXISTS http;
```

## Säkerhet

- Webhook-funktionen använder `--no-verify-jwt` för att tillåta anrop från databas-triggers
- I produktion, överväg att lägga till autentisering mellan trigger och webhook
- Miljövariabler lagras säkert i Supabase Secrets

## Nästa steg

Efter deployment kan du:
1. Testa alla funktioner i appen
2. Konfigurera e-postmallar i Resend
3. Lägga till fler webhook-funktioner för andra händelser
4. Implementera push-notifikationer via Expo