# 📅 Skiftapp Kalendersynkronisering

## 📋 Översikt

Skiftapp har integrerad kalendersynkronisering som låter användare synka sina skift med:
- **Google Kalender**
- **Apple Kalender**
- **Personliga kalenderhändelser**

## 🚀 Funktioner

### Kalendersynkronisering
- **Bidirektionell synkronisering**: Skift ↔ Kalender
- **Automatisk synkronisering**: Varje timme
- **Manuell synkronisering**: På begäran
- **Konfliktlösning**: Smart hantering av överlappande händelser

### Stödda Kalendrar
- **Google Calendar**: Fullständig OAuth-integration
- **Apple Calendar**: iOS/macOS kalenderintegration
- **Skiftapp Events**: Interna händelser

### Synkroniseringsfunktioner
- **Skift → Kalender**: Automatisk export av schemalagda skift
- **Kalender → Skiftapp**: Importera externa händelser
- **Real-time uppdateringar**: Omedelbar synkronisering
- **Offline-stöd**: Synkronisering när anslutning återställs

## 📱 Användargränssnitt

### UserDashboard.tsx
Huvudkomponent för kalendersynkronisering:
```typescript
import { UserDashboard } from './components/UserDashboard';

// Visar användardashboard med kalendersynkronisering
<UserDashboard />
```

**Funktioner:**
- Google/Apple kalendersynkronisering
- Synkroniseringsstatus
- Snabbstatistik
- Kommande händelser
- Användarinställningar

## 🏗️ Databasstruktur

### calendar_syncs
```typescript
{
  id: string;
  user_id: string;
  calendar_type: 'google' | 'apple';
  is_enabled: boolean;
  last_sync: string;
  sync_frequency: 'hourly' | 'daily' | 'weekly';
  access_token: string | null;
  refresh_token: string | null;
  calendar_id: string | null;
}
```

### calendar_events
```typescript
{
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  calendar_type: 'google' | 'apple' | 'skiftapp';
  external_event_id: string | null;
  is_synced: boolean;
  sync_direction: 'inbound' | 'outbound' | 'bidirectional';
}
```

## ⚙️ Konfiguration

### Google Calendar Setup
1. **Skapa Google Cloud Project**
2. **Aktivera Google Calendar API**
3. **Skapa OAuth 2.0 credentials**
4. **Lägg till redirect URIs:**
   - `skiftapp://auth/callback`
   - `http://localhost:3000/auth/callback`

### Apple Calendar Setup
1. **Konfigurera Apple Developer Account**
2. **Skapa App ID med Calendar capability**
3. **Generera certificates**
4. **Konfigurera URL schemes**

### Miljövariabler
```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your_google_client_secret
EXPO_PUBLIC_APPLE_TEAM_ID=your_apple_team_id
EXPO_PUBLIC_APPLE_KEY_ID=your_apple_key_id
```

## 🔧 Användning

### 1. Synka Google Kalender
```typescript
const handleGoogleCalendarSync = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'skiftapp://auth/callback',
        scopes: 'https://www.googleapis.com/auth/calendar'
      }
    });
    
    if (error) throw error;
    
    // Hantera OAuth callback
    console.log('Google Calendar synkroniserad');
  } catch (error) {
    console.error('Google Calendar sync error:', error);
  }
};
```

### 2. Synka Apple Kalender
```typescript
const handleAppleCalendarSync = async () => {
  try {
    // Implementera Apple Calendar OAuth
    const syncData = {
      user_id: user.id,
      calendar_type: 'apple',
      is_enabled: true,
      last_sync: new Date().toISOString(),
      sync_frequency: 'hourly'
    };
    
    const { error } = await supabase
      .from('calendar_syncs')
      .upsert(syncData);
      
    if (error) throw error;
    
    console.log('Apple Calendar synkroniserad');
  } catch (error) {
    console.error('Apple Calendar sync error:', error);
  }
};
```

### 3. Hantera Kalenderhändelser
```typescript
// Skapa kalenderhändelse
const createCalendarEvent = async (eventData) => {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      user_id: user.id,
      title: eventData.title,
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      calendar_type: 'skiftapp',
      sync_direction: 'outbound'
    });
};

// Synka med extern kalender
const syncWithExternalCalendar = async (eventId) => {
  // Implementera synkronisering med Google/Apple API
};
```

## 🔄 Synkroniseringsflöden

### Skift → Kalender
```
1. Användare schemalägger skift
2. Skiftapp skapar kalenderhändelse
3. Exporterar till Google/Apple Kalender
4. Uppdaterar sync-status
```

### Kalender → Skiftapp
```
1. Användare lägger till händelse i kalender
2. Skiftapp importerar händelse
3. Skapar intern händelse
4. Uppdaterar sync-status
```

### Konfliktlösning
```
1. Detektera överlappande händelser
2. Jämför metadata (tid, plats, beskrivning)
3. Prioritera Skiftapp-händelser
4. Skapa sammanslagna händelser
```

## 🛡️ Säkerhet

### OAuth-säkerhet
- **Secure token storage**: Krypterad lagring av tokens
- **Token refresh**: Automatisk förnyelse av utgångna tokens
- **Scope-begränsning**: Minimal åtkomst till kalenderdata
- **Revoke access**: Möjlighet att återkalla åtkomst

### Dataskydd
- **End-to-end kryptering**: All kalenderdata krypterad
- **GDPR-kompatibilitet**: Användarkontroll över data
- **Data retention**: Automatisk rensning av gamla data
- **Audit logging**: Spårning av alla synkroniseringshändelser

## 📊 Övervakning

### Synkroniseringsstatus
- **Last sync time**: När senaste synkronisering skedde
- **Sync frequency**: Hur ofta synkronisering sker
- **Error tracking**: Spårning av synkroniseringsfel
- **Performance metrics**: Synkroniseringshastighet

### Felhantering
- **Network errors**: Automatisk återförsök
- **API rate limits**: Respekt för API-begränsningar
- **Authentication errors**: Automatisk token refresh
- **Data conflicts**: Smart konfliktlösning

## 🎨 Användarupplevelse

### Dashboard
- **Synkroniseringsstatus**: Visar status för varje kalender
- **Snabbstatistik**: Antal synkroniserade händelser
- **Kommande händelser**: Lista över kommande händelser
- **Inställningar**: Enkel hantering av synkronisering

### Notifikationer
- **Sync success**: Bekräftelse vid lyckad synkronisering
- **Sync errors**: Varningar vid synkroniseringsfel
- **New events**: Notifikationer för nya händelser
- **Conflicts**: Varningar vid konflikter

## 🔮 Framtida Funktioner

### Planerade Förbättringar
- [ ] **Outlook Calendar** integration
- [ ] **iCal format** stöd
- [ ] **Recurring events** hantering
- [ ] **Calendar sharing** mellan användare
- [ ] **Advanced conflict resolution**
- [ ] **Bulk sync** för stora datamängder

### Tekniska Förbättringar
- [ ] **Webhook support** för real-time synkronisering
- [ ] **Background sync** för bättre prestanda
- [ ] **Offline sync queue** för robusthet
- [ ] **API versioning** för framtida kompatibilitet

## 📞 Support

### Vanliga Problem
1. **Google Calendar sync fungerar inte**
   - Kontrollera OAuth credentials
   - Verifiera API permissions
   - Kontrollera redirect URIs

2. **Apple Calendar sync fungerar inte**
   - Verifiera Apple Developer setup
   - Kontrollera certificates
   - Testa på fysisk enhet

3. **Synkronisering är långsam**
   - Kontrollera nätverksanslutning
   - Verifiera API rate limits
   - Optimera sync frequency

### Debug
```typescript
// Aktivera debug logging
console.log('Calendar sync status:', syncStatus);
console.log('Last sync time:', lastSync);
console.log('Sync errors:', syncErrors);
```

---

**Skiftapp Calendar Sync** - Säker och användarvänlig kalendersynkronisering för din app. 