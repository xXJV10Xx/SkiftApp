# Supabase Edge Functions

Detta är Supabase Edge Functions för Skiftappen. Funktionerna är skrivna i Deno och körs på Supabase Edge Runtime.

## Funktioner

### 1. create-trade-request
**Endpoint:** `POST /functions/v1/create-trade-request`

Skapar en ny skiftbytesförfrågan i databasen.

**Request Body:**
```json
{
  "shift_id": "uuid",
  "requested_shift_id": "uuid", 
  "message": "optional message"
}
```

**Response:**
```json
{
  "success": true,
  "trade_request": {
    "id": "uuid",
    "shift_id": "uuid",
    "requested_shift_id": "uuid",
    "requester_id": "uuid",
    "status": "pending",
    "message": "string",
    "created_at": "timestamp"
  }
}
```

### 2. handle-trade-interest
**Endpoint:** `POST /functions/v1/handle-trade-interest`

Skapar en privat chatt när en användare visar intresse för ett skiftbyte.

**Request Body:**
```json
{
  "trade_request_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "chat_id": "uuid",
  "message": "Chat created successfully"
}
```

### 3. send-chat-notification
**Endpoint:** `POST /functions/v1/send-chat-notification`

Skickar push-notifikationer via Firebase Cloud Messaging när nya meddelanden skapas.

Denna funktion triggas automatiskt av en database webhook när ett nytt meddelande läggs till i `messages` tabellen.

## Miljövariabler

Följande miljövariabler måste konfigureras i Supabase:

- `SUPABASE_URL` - Din Supabase projekt URL
- `SUPABASE_ANON_KEY` - Din Supabase anonyma nyckel
- `FCM_SERVER_KEY` - Firebase Cloud Messaging server nyckel (endast för send-chat-notification)

## Deployment

För att deploya funktionerna:

```bash
# Installera Supabase CLI
npm install -g supabase

# Logga in på Supabase
supabase login

# Länka projektet
supabase link --project-ref YOUR_PROJECT_REF

# Deploya alla funktioner
supabase functions deploy

# Eller deploya specifika funktioner
supabase functions deploy create-trade-request
supabase functions deploy handle-trade-interest
supabase functions deploy send-chat-notification
```

## Database Webhook Setup

För att `send-chat-notification` ska fungera måste du skapa en database webhook i Supabase:

1. Gå till Supabase Dashboard
2. Navigera till Database > Webhooks
3. Skapa en ny webhook:
   - **Name:** `messages_webhook`
   - **Table:** `messages`
   - **Events:** `INSERT`
   - **URL:** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-chat-notification`
   - **HTTP Method:** `POST`
   - **Headers:** `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`

## Testning

Du kan testa funktionerna lokalt med Supabase CLI:

```bash
# Starta lokal utvecklingsmiljö
supabase start

# Testa funktioner lokalt
supabase functions serve
```

## Felhantering

Alla funktioner returnerar standardiserade felmeddelanden:

- `401 Unauthorized` - Användaren är inte autentiserad
- `400 Bad Request` - Saknade eller ogiltiga parametrar
- `404 Not Found` - Resurs hittades inte
- `500 Internal Server Error` - Serverfel

## Loggar

Loggar kan visas i Supabase Dashboard under Functions > Logs eller via CLI:

```bash
supabase functions logs
``` 