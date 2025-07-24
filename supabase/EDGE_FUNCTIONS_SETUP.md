# Supabase Edge Functions Setup Guide

## Översikt

Detta projekt använder Supabase Edge Functions för att hantera @mentions i meddelanden och skicka push-notifikationer till nämnda användare. Edge Functions körs på Supabase's serverless plattform och använder Deno runtime.

## Förutsättningar

1. **Supabase CLI installerat**
   ```bash
   npm install -g supabase
   ```

2. **Deno installerat** (för lokal utveckling)
   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   ```

3. **Supabase projekt konfigurerat**
   - Se `SUPABASE_SETUP.md` för grundläggande konfiguration

## Installation och Deployment

### 1. Logga in på Supabase CLI
```bash
supabase login
```

### 2. Länka ditt lokala projekt till Supabase
```bash
supabase link --project-ref DITT_PROJEKT_REF
```
Du hittar din project-ref i Supabase dashboard under Settings > General.

### 3. Kör databasmigrationer
```bash
supabase db push
```

### 4. Deploya Edge Function
```bash
supabase functions deploy handle-new-message
```

### 5. Konfigurera Environment Variables
I Supabase dashboard, gå till Settings > Edge Functions och lägg till:
- `SUPABASE_URL`: Din Supabase projekt URL
- `SUPABASE_SERVICE_ROLE_KEY`: Din service role key (hemlig!)

## Konfiguration av Database Webhook

För att Edge Function ska triggas automatiskt när nya meddelanden skapas, måste du konfigurera en database webhook:

### 1. Skapa webhook i Supabase Dashboard
1. Gå till Database > Webhooks
2. Klicka "Create a new hook"
3. Konfigurera:
   - **Name**: `handle-new-message-webhook`
   - **Table**: `messages`
   - **Events**: `Insert`
   - **Type**: `HTTP Request`
   - **HTTP URL**: `https://DITT_PROJEKT_REF.supabase.co/functions/v1/handle-new-message`
   - **HTTP Method**: `POST`
   - **HTTP Headers**: 
     ```
     Content-Type: application/json
     Authorization: Bearer DITT_ANON_KEY
     ```

### 2. Testa webhook
```bash
# Testa funktionen manuellt
curl -X POST 'https://DITT_PROJEKT_REF.supabase.co/functions/v1/handle-new-message' \
  -H 'Authorization: Bearer DITT_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "INSERT",
    "table": "messages",
    "record": {
      "id": "test-id",
      "content": "Hej @john, kan du kolla detta?",
      "sender_id": "sender-uuid",
      "chat_room_id": "room-uuid"
    }
  }'
```

## Push Notification Setup

### 1. Konfigurera Expo Push Notifications i din app

I din React Native app, lägg till push notification hantering:

```typescript
import * as Notifications from 'expo-notifications';
import { supabase } from './lib/supabase';

// Registrera för push notifications
export async function registerForPushNotifications(employeeId: string) {
  let token;
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  
  token = (await Notifications.getExpoPushTokenAsync()).data;
  
  // Spara token i databasen
  await supabase.from('push_tokens').upsert({
    employee_id: employeeId,
    token: token,
    device_type: Platform.OS,
    is_active: true
  });
  
  return token;
}
```

### 2. Hantera inkommande notifikationer

```typescript
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

export function usePushNotifications() {
  useEffect(() => {
    // Hantera notifikationer när appen är öppen
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      
      // Hantera mention notifikation
      if (notification.request.content.data?.type === 'mention') {
        // Navigera till chat room eller visa mention
        const chatRoomId = notification.request.content.data.chatRoomId;
        // navigation.navigate('ChatRoom', { id: chatRoomId });
      }
    });

    // Hantera när användaren trycker på notifikationen
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      const data = response.notification.request.content.data;
      if (data?.type === 'mention' && data?.chatRoomId) {
        // Navigera till chat room
        // navigation.navigate('ChatRoom', { id: data.chatRoomId });
      }
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);
}
```

## Lokal Utveckling

### 1. Starta Supabase lokalt
```bash
supabase start
```

### 2. Kör Edge Function lokalt
```bash
supabase functions serve handle-new-message --no-verify-jwt
```

### 3. Testa lokalt
```bash
curl -X POST 'http://localhost:54321/functions/v1/handle-new-message' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "INSERT",
    "table": "messages",
    "record": {
      "id": "test-id",
      "content": "Hej @john, kan du kolla detta?",
      "sender_id": "sender-uuid",
      "chat_room_id": "room-uuid"
    }
  }'
```

## Funktionalitet

### Vad Edge Function gör:

1. **Lyssnar på nya meddelanden**: Triggas automatiskt via database webhook
2. **Detekterar @mentions**: Använder regex för att hitta @användarnamn i meddelanden
3. **Hittar nämnda användare**: Söker i `employees` tabellen baserat på `employee_id` eller `first_name`
4. **Skickar push-notifikationer**: Använder Expo Push Notification service
5. **Spårar mentions**: Sparar mention-records i `message_mentions` tabellen

### Mention-format som stöds:
- `@john` - Matchar employee_id eller first_name
- `@john.doe` - Matchar employee_id
- `@123456` - Matchar employee_id

## Säkerhet

- Edge Functions körs med service role-behörigheter
- RLS (Row Level Security) är aktiverat på alla tabeller
- Push tokens är kopplade till specifika användare
- Endast aktiva användare kan få notifikationer

## Troubleshooting

### Edge Function körs inte
1. Kontrollera att webhook är korrekt konfigurerad
2. Kolla Edge Function logs i Supabase dashboard
3. Verifiera att environment variables är satta

### Push notifications fungerar inte
1. Kontrollera att push tokens sparas korrekt
2. Verifiera Expo push token format
3. Kolla att användaren har gett permission för notifikationer

### Mentions hittas inte
1. Kontrollera att employee_id eller first_name matchar mention
2. Verifiera att användaren är aktiv (`is_active = true`)
3. Kolla regex-pattern i Edge Function

## Monitoring

Du kan övervaka Edge Functions i Supabase dashboard:
- **Edge Functions > Logs**: Se execution logs
- **Edge Functions > Metrics**: Prestanda och fel-statistik
- **Database > Webhooks**: Webhook execution history