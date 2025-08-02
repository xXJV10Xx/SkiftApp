# Webhook Setup för Kalendersynkronisering

Denna guide visar hur du sätter upp automatisk synkronisering mellan Supabase och Google Calendar.

## 📋 Förutsättningar

1. ✅ Google OAuth är konfigurerat (se GOOGLE_OAUTH_SETUP.md)
2. ✅ Supabase-databasen är uppsatt (se DATABASE_SETUP.md)
3. ✅ Google Calendar API är aktiverat i Google Cloud Console

## 🗄️ Databasmigrering

Först behöver du lägga till kolumner för kalendersynkronisering:

```sql
-- Kör denna SQL i din Supabase SQL Editor
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS calendar_event_id VARCHAR(255);
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS synced_to_calendar BOOLEAN DEFAULT FALSE;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS calendar_sync_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS calendar_sync_error TEXT;

-- Skapa index för bättre prestanda
CREATE INDEX IF NOT EXISTS idx_shifts_calendar_sync ON shifts(synced_to_calendar, calendar_sync_at);
CREATE INDEX IF NOT EXISTS idx_shifts_calendar_event_id ON shifts(calendar_event_id);
```

Eller kör migreringsfilen:
```bash
# Kopiera innehållet från scripts/add_calendar_sync_columns.sql till Supabase SQL Editor
```

## 🔧 Installation av Backend-beroenden

```bash
# Installera backend-beroenden
npm install --prefix . --package-lock-only -f package.backend.json

# Eller manuellt:
npm install googleapis express cors dotenv nodemon
```

## 🌍 Miljövariabler

Lägg till dessa variabler i din `.env` fil:

```env
# Google Calendar API (samma som för OAuth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri

# Supabase (samma som tidigare)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Webhook server
WEBHOOK_PORT=3001
```

## 🚀 Starta Webhook-servern

### Utveckling (med auto-restart)
```bash
npm run dev-webhook
```

### Produktion
```bash
npm run webhook-server
```

Servern kommer att köra på `http://localhost:3001`

### Testa att servern fungerar
```bash
curl http://localhost:3001/health
# Ska returnera: {"status":"OK","timestamp":"..."}
```

## 🔗 Konfigurera Supabase Webhook

1. **Gå till Supabase Dashboard** → Database → Webhooks

2. **Skapa ny webhook** med följande inställningar:
   - **Name**: `shift_calendar_sync`
   - **Table**: `shifts`
   - **Events**: ✅ Insert, ✅ Update, ✅ Delete
   - **Type**: `HTTP Request`
   - **HTTP URL**: `http://localhost:3001/webhook/shifts`
   - **HTTP Method**: `POST`
   - **HTTP Headers**: 
     ```
     Content-Type: application/json
     ```

3. **För produktion**, använd din publika URL istället för localhost

## 🧪 Testa Webhook-funktionaliteten

### 1. Lägg till ett nytt skift
```sql
INSERT INTO shifts (employee_id, shift_type_id, start_time, end_time)
VALUES (
  'user_id_here',
  1,
  '2024-01-15 08:00:00+01',
  '2024-01-15 16:00:00+01'
);
```

### 2. Kontrollera att kalenderhändelsen skapades
```sql
SELECT 
  id, 
  calendar_event_id, 
  synced_to_calendar, 
  calendar_sync_at,
  calendar_sync_error
FROM shifts 
WHERE id = 'ditt_skift_id';
```

### 3. Kolla webhook-serverns loggar
Du bör se något liknande:
```
Received webhook: { type: 'INSERT', table: 'shifts', record: {...} }
Calendar event created for shift abc123: calendar_event_id_xyz
```

## 🔍 Felsökning

### Webhook-servern startar inte
- Kontrollera att port 3001 är ledig: `lsof -i :3001`
- Verifiera miljövariabler: `echo $SUPABASE_URL`

### Kalenderhändelser skapas inte
1. **Kontrollera Google Calendar API-behörigheter**
   - Gå till Google Cloud Console → APIs & Services → Credentials
   - Kontrollera att Calendar API är aktiverat

2. **Kontrollera Google OAuth-token**
   ```sql
   SELECT * FROM google_tokens WHERE user_id = 'user_id_here';
   ```

3. **Kontrollera webhook-loggar**
   - Kolla `calendar_sync_error` kolumnen i shifts-tabellen
   - Läs webhook-serverns konsol-output

### Webhook når inte servern
- Kontrollera att webhook-URL:en är korrekt i Supabase
- För lokal utveckling: använd ngrok för att exponera localhost:
  ```bash
  npx ngrok http 3001
  # Använd den genererade URL:en i Supabase webhook-konfiguration
  ```

## 📊 Monitoring

### Övervaka synkroniseringsstatus
```sql
-- Antal synkroniserade skift
SELECT 
  COUNT(*) as total_shifts,
  COUNT(CASE WHEN synced_to_calendar THEN 1 END) as synced_shifts,
  COUNT(CASE WHEN calendar_sync_error IS NOT NULL THEN 1 END) as failed_syncs
FROM shifts;

-- Senaste synkroniseringsfel
SELECT 
  id,
  start_time,
  calendar_sync_error,
  calendar_sync_at
FROM shifts 
WHERE calendar_sync_error IS NOT NULL 
ORDER BY calendar_sync_at DESC 
LIMIT 10;
```

## 🚀 Nästa steg

När webhook-funktionaliteten fungerar kan du:

1. **Implementera batch-synkronisering** för befintliga skift
2. **Lägga till användargränssnitt** för att aktivera/inaktivera kalendersynkronisering
3. **Skapa ICS-import** för att importera externa scheman
4. **Sätta upp notifikationer** när synkronisering misslyckas

## 🔐 Säkerhet för Produktion

- Använd HTTPS för webhook-URL:er
- Implementera webhook-signaturverifiering
- Begränsa nätverksåtkomst till webhook-servern
- Övervaka webhook-anrop för ovanlig aktivitet