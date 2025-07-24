# Offline-First Architecture Usage Guide

Din app har nu en komplett offline-first arkitektur implementerad! Här är hur du använder den:

## Översikt

Appen fungerar nu enligt följande principer:
1. **Alltid lokalt först**: All data läses och skrivs till en lokal SQLite-databas
2. **Bakgrundssynkronisering**: Data synkroniseras automatiskt med Supabase i bakgrunden
3. **Fungerar offline**: Appen fungerar fullt ut även utan internetanslutning
4. **Konflikthantering**: Lokala ändringar laddas upp när anslutningen återställs

## Hur det fungerar

### 1. Dataflöde

```
Användare → Lokal SQLite → UI (omedelbar uppdatering)
                ↓
        Bakgrundssynk → Supabase
```

### 2. Komponenter

- **DatabaseService**: Hanterar lokal SQLite-databas
- **SyncService**: Synkroniserar data med Supabase
- **OfflineChatStore**: Zustand store som hanterar appens tillstånd
- **SyncStatusIndicator**: Visar synkroniseringsstatus för användaren

## Användning i din app

### Skicka meddelanden offline

```typescript
import { useOfflineChatStore } from '../stores/OfflineChatStore';

const { sendMessage, isOnline } = useOfflineChatStore();

// Fungerar både online och offline
await sendMessage("Hej från offline!", "text", userId);
```

### Övervaka synkroniseringsstatus

```typescript
const { syncing, isOnline, lastSyncResult } = useOfflineChatStore();

console.log('Synkroniserar:', syncing);
console.log('Online:', isOnline);
console.log('Senaste synk:', lastSyncResult);
```

### Manuell synkronisering

```typescript
const { syncData } = useOfflineChatStore();

// Tvinga synkronisering
const result = await syncData();
console.log('Synkresultat:', result);
```

## Automatisk synkronisering

Appen synkroniserar automatiskt var 30:e sekund när den är online:

```typescript
// Startas automatiskt i ChatContext
startAutoSync(30000); // 30 sekunder

// Stoppa auto-synk
stopAutoSync();
```

## Synkroniseringsstatus-indikator

Lägg till synkroniseringsstatus var som helst i din app:

```typescript
import SyncStatusIndicator from '../components/SyncStatusIndicator';

// Enkel status
<SyncStatusIndicator />

// Med detaljer
<SyncStatusIndicator showDetails={true} />
```

## Statusar

- 🟢 **Synkroniserad**: Allt är uppdaterat
- 🔄 **Synkroniserar**: Pågående synkronisering
- 🔴 **Offline**: Ingen internetanslutning
- 🟡 **Synkfel**: Problem med synkronisering

## Databasschema

### Messages
- Lagrar alla meddelanden lokalt
- `synced` flagga spårar synkroniseringsstatus
- `local_id` för offline-skapade meddelanden

### Teams
- Lagrar team-information
- Synkroniseras från Supabase

### Chat Rooms
- Lagrar chattrum-information
- Synkroniseras från Supabase

### Sync Metadata
- Spårar senaste synkroniseringstid för varje tabell

## Felsökning

### Rensa lokal data
```typescript
import { databaseService } from '../services/DatabaseService';

await databaseService.clearAllData();
```

### Kontrollera databasinnehåll
```typescript
const messages = await databaseService.getMessages(chatRoomId);
const unsyncedMessages = await databaseService.getUnsyncedMessages();
```

### Tvinga omsynkronisering
```typescript
import { syncService } from '../services/SyncService';

const result = await syncService.forcSync();
```

## Fördelar

1. **Snabb responsivitet**: UI uppdateras omedelbart
2. **Offline-funktionalitet**: Fungerar utan internet
3. **Databeständighet**: Inget dataförlust vid nätverksproblem
4. **Automatisk synkronisering**: Hanteras i bakgrunden
5. **Konflikthantering**: Lokala ändringar bevaras och synkroniseras

## Nästa steg

1. Testa offline-funktionaliteten genom att stänga av wifi
2. Anpassa synkroniseringsintervallet efter dina behov
3. Lägg till fler tabeller i DatabaseService och SyncService
4. Implementera mer avancerad konflikthantering om nödvändigt

Din app är nu redo för offline-användning! 🎉