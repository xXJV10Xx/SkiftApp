# 🔄 Skiftbyte-funktionalitet - Installationsguide

Denna guide hjälper dig att implementera den nya skiftbyte-funktionaliteten i din schemaläggningsapp.

## 📋 Förhandsinstallation

### Krav
- Deno 1.37+ installerat
- Supabase-projekt konfigurerat
- React Native/Expo-app körande
- Node.js 18+ för frontend

### Kontrollera befintlig installation
```bash
# Kontrollera Deno-version
deno --version

# Kontrollera att Supabase-anslutningen fungerar
cd lib && deno run --allow-net test-connection.ts
```

## 🗄️ Steg 1: Uppdatera Databas-schema

### 1.1 Kör SQL-uppdateringar
1. Öppna din Supabase Dashboard
2. Gå till SQL Editor
3. Kör innehållet från `DATABASE_SHIFT_UPDATES.sql`

```sql
-- Kontrollera att tabellerna skapades korrekt
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('shift_trade_requests', 'private_chats', 'private_chat_messages');

-- Kontrollera att owner_id-kolumnen lades till
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'shifts' AND column_name = 'owner_id';
```

### 1.2 Aktivera Real-time
1. Gå till Database > Replication i Supabase Dashboard
2. Aktivera real-time för följande tabeller:
   - `shift_trade_requests`
   - `private_chats`
   - `private_chat_messages`

### 1.3 Migrera befintlig data (om nödvändigt)
```sql
-- Om du har befintliga skift utan owner_id, uppdatera dem
UPDATE shifts 
SET owner_id = employee_id 
WHERE owner_id IS NULL AND employee_id IS NOT NULL;
```

## 🚀 Steg 2: Starta Deno Backend

### 2.1 Konfigurera miljövariabler
```bash
cd server
cp .env.example .env
```

Uppdatera `.env` med dina Supabase-uppgifter:
```env
SUPABASE_URL=din_supabase_url
SUPABASE_ANON_KEY=din_anon_key
SUPABASE_SERVICE_ROLE_KEY=din_service_role_key
PORT=8000
```

### 2.2 Starta servern
```bash
# Utvecklingsläge (auto-restart)
deno task dev

# Produktionsläge
deno task start
```

### 2.3 Testa API-endpoints
```bash
# Health check
curl http://localhost:8000/health

# Testa autentisering (ersätt TOKEN med din Supabase JWT)
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:8000/api/schedule/USER_ID
```

## 📱 Steg 3: Frontend Integration

### 3.1 Installera nya komponenter
Komponenterna är redan skapade i `components/`:
- `ShiftTradeForm.tsx` - Formulär för skiftbyte
- `TradeRequestCard.tsx` - Visa trade requests i chatt

### 3.2 Uppdatera befintliga komponenter

#### Uppdatera Schedule-komponenten
Lägg till skiftbyte-funktionalitet i `app/(tabs)/schedule.tsx`:

```tsx
import ShiftTradeForm from '../../components/ShiftTradeForm';
import { shiftApi, Shift } from '../../lib/api/shiftApi';

// Lägg till state för trade form
const [tradeFormVisible, setTradeFormVisible] = useState(false);
const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

// Lägg till function för att öppna trade form
const handleTradeShift = (shift: Shift) => {
  setSelectedShift(shift);
  setTradeFormVisible(true);
};

// Lägg till i JSX
{selectedShift && (
  <ShiftTradeForm
    shift={selectedShift}
    visible={tradeFormVisible}
    onClose={() => setTradeFormVisible(false)}
    onSuccess={() => {
      // Uppdatera schemat
      loadUserSchedule();
    }}
  />
)}
```

#### Uppdatera Chat-komponenten
Lägg till trade request-kort i `app/(tabs)/chat.tsx`:

```tsx
import TradeRequestCard from '../../components/TradeRequestCard';
import { shiftApi } from '../../lib/api/shiftApi';

// Lägg till state för trade requests
const [tradeRequests, setTradeRequests] = useState([]);

// Hämta trade requests
useEffect(() => {
  loadTradeRequests();
}, []);

const loadTradeRequests = async () => {
  try {
    const response = await shiftApi.getTeamTradeRequests();
    setTradeRequests(response.data);
  } catch (error) {
    console.error('Error loading trade requests:', error);
  }
};

// Lägg till i meddelande-rendering
{message.type === 'trade_request' && (
  <TradeRequestCard
    tradeRequest={message.tradeRequest}
    currentUserId={currentUserId}
    onInterestShown={(chatId) => {
      // Navigera till privat chatt
      navigation.navigate('PrivateChat', { chatId });
    }}
  />
)}
```

### 3.3 Lägg till API-konfiguration
API-klienten är redan konfigurerad i `lib/api/shiftApi.ts`. Kontrollera att:
- `API_BASE_URL` pekar på din Deno-server
- Autentisering fungerar korrekt

## 📱 Steg 4: Mobila Widgets

### 4.1 iOS Widget Setup

#### Lägg till Widget Extension
1. Öppna ditt iOS-projekt i Xcode
2. File > New > Target > Widget Extension
3. Namnge det "ScheduleWidget"
4. Kopiera innehållet från `ios/ScheduleWidget/ScheduleWidget.swift`

#### Konfigurera Widget
1. Lägg till nätverksbehörigheter i `Info.plist`
2. Konfigurera App Groups för datadelning
3. Uppdatera användar-ID i widget-koden

### 4.2 Android Widget Setup

#### Lägg till Widget Provider
1. Kopiera `android/app/src/main/java/com/skiftappen/widget/ScheduleWidgetProvider.kt`
2. Kopiera `android/app/src/main/res/layout/schedule_widget.xml`

#### Uppdatera AndroidManifest.xml
```xml
<receiver android:name=".widget.ScheduleWidgetProvider">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/schedule_widget_info" />
</receiver>
```

#### Skapa widget-konfiguration
Skapa `android/app/src/main/res/xml/schedule_widget_info.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="250dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/schedule_widget"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />
```

## 🧪 Steg 5: Testning

### 5.1 Backend-tester
```bash
cd server

# Testa API-endpoints
deno run --allow-net test/api-tests.ts

# Testa databasanslutning
deno run --allow-net --allow-env test/db-tests.ts
```

### 5.2 Frontend-tester
```bash
# Kör React Native-appen
npm start

# Testa i iOS Simulator
npm run ios

# Testa i Android Emulator
npm run android
```

### 5.3 Funktionalitetstester

#### Testa skiftbyte-flödet:
1. Logga in som användare A
2. Skapa ett skiftbyte från schemat
3. Logga in som användare B (samma team)
4. Se trade request i gruppchatten
5. Visa intresse och starta privat chatt
6. Bekräfta bytet i privat chatt

#### Testa widgets:
1. Lägg till widget på hemskärmen
2. Kontrollera att schema visas korrekt
3. Testa uppdatering av data

## 🔧 Felsökning

### Vanliga problem

#### Backend startar inte
```bash
# Kontrollera Deno-version
deno --version

# Kontrollera miljövariabler
echo $SUPABASE_URL

# Kontrollera porttillgänglighet
lsof -i :8000
```

#### API-anrop misslyckas
- Kontrollera CORS-inställningar i `server/server.ts`
- Verifiera autentiseringstoken
- Kontrollera Supabase RLS-policies

#### Widgets fungerar inte
- **iOS**: Kontrollera App Groups-konfiguration
- **Android**: Verifiera manifest-konfiguration
- Kontrollera nätverksbehörigheter

#### Real-time uppdateringar fungerar inte
- Kontrollera att real-time är aktiverat i Supabase
- Verifiera prenumerationer i frontend-koden
- Kontrollera RLS-policies för real-time

### Loggar och debugging

#### Backend-loggar
```bash
# Visa server-loggar
tail -f server/logs/app.log

# Debug-läge
DENO_LOG=DEBUG deno task dev
```

#### Frontend-loggar
```bash
# React Native debugger
npx react-native log-ios
npx react-native log-android

# Expo debugger
npx expo start --dev-client
```

## 🚀 Deployment

### Backend-deployment
```bash
# Bygg för produktion
deno compile --allow-net --allow-env --allow-read server.ts

# Deploy till din server (exempel med PM2)
pm2 start server --name "shift-api"
```

### Frontend-deployment
```bash
# Bygg för produktion
expo build:ios
expo build:android

# Eller med EAS Build
eas build --platform all
```

## ✅ Verifiering

Efter installation, kontrollera att:

- [ ] Databastabeller är skapade och konfigurerade
- [ ] Deno-servern startar utan fel
- [ ] API-endpoints svarar korrekt
- [ ] Frontend kan kommunicera med backend
- [ ] Skiftbyte-formulär fungerar
- [ ] Trade requests visas i chatt
- [ ] Privata chattar skapas korrekt
- [ ] Real-time uppdateringar fungerar
- [ ] iOS widget visar data
- [ ] Android widget visar data
- [ ] Notifikationer skickas (om implementerat)

## 📞 Support

Om du stöter på problem:
1. Kontrollera loggarna för fel
2. Verifiera konfiguration mot denna guide
3. Testa API-endpoints manuellt
4. Kontrollera Supabase Dashboard för databasproblem

Lycka till med implementationen! 🚀