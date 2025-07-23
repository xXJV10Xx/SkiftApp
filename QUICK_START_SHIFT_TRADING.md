# 🚀 Snabbstart - Skiftbyte-funktionalitet

Kom igång med skiftbyte-funktionaliteten på 10 minuter!

## ⚡ Snabbinstallation

### 1. Uppdatera databas (2 min)
```bash
# Kör SQL-uppdateringar i Supabase Dashboard
cat DATABASE_SHIFT_UPDATES.sql
# Kopiera och klistra in i Supabase SQL Editor
```

### 2. Starta backend (2 min)
```bash
cd server

# Kopiera miljövariabler
cp .env.example .env
# Uppdatera .env med dina Supabase-uppgifter

# Starta servern
deno task dev
```

### 3. Testa API (1 min)
```bash
# Gör testskriptet körbart och kör det
chmod +x test-api.sh
./test-api.sh
```

### 4. Integrera frontend (5 min)
```tsx
// I din schedule-komponent
import ShiftTradeForm from '../../components/ShiftTradeForm';
import { shiftApi } from '../../lib/api/shiftApi';

// Lägg till trade-funktionalitet
const handleTradeShift = (shift) => {
  setSelectedShift(shift);
  setTradeFormVisible(true);
};
```

## 🎯 Grundläggande användning

### Skapa skiftbyte
1. Öppna schemat
2. Tryck på ett skift
3. Välj "Byt skift"
4. Skriv meddelande (valfritt)
5. Skicka förfrågan

### Visa intresse
1. Se trade request i gruppchatten
2. Tryck "Visa intresse"
3. Privat chatt skapas automatiskt
4. Diskutera och bekräfta bytet

## 📱 Widget-setup (valfritt)

### iOS
```bash
# Lägg till widget extension i Xcode
# Kopiera kod från ios/ScheduleWidget/ScheduleWidget.swift
```

### Android
```bash
# Kopiera widget-filer
cp android/app/src/main/java/com/skiftappen/widget/* your-android-project/
cp android/app/src/main/res/layout/schedule_widget.xml your-android-project/
```

## ✅ Verifiering

Kontrollera att allt fungerar:
- [ ] Deno-server startar (port 8000)
- [ ] API-endpoints svarar
- [ ] Skiftbyte-formulär öppnas
- [ ] Trade requests visas i chatt
- [ ] Privata chattar skapas

## 🔧 Snabbfelsökning

**Server startar inte?**
```bash
deno --version  # Kontrollera Deno är installerat
lsof -i :8000   # Kontrollera port är ledig
```

**API svarar inte?**
```bash
curl http://localhost:8000/health  # Testa health endpoint
```

**Frontend kan inte ansluta?**
- Kontrollera API_BASE_URL i `lib/api/shiftApi.ts`
- Verifiera CORS-inställningar i server

## 📞 Hjälp

Problem? Kolla:
1. `SHIFT_TRADING_SETUP.md` - Fullständig guide
2. Server-loggar: `tail -f server/logs/app.log`
3. Frontend-loggar: `npx expo start --dev-client`

Lycka till! 🎉