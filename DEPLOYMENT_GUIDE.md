# 🚀 Deployment Guide - Skiftappen

## 📱 Testa appen lokalt

### Steg 1: Starta utvecklingsservern
```bash
npx expo start
```

### Steg 2: Testa på telefon
1. **Ladda ner Expo Go-appen** på din telefon
2. **Skanna QR-koden** som visas i terminalen
3. **Testa alla funktioner:**
   - Logga in med email/password
   - Logga in med Google
   - Skapa testdata i Supabase
   - Testa chat-funktionen
   - Testa språkbyte (Svenska/Engelska)
   - Testa tema (Ljust/Mörkt/System)

## 🏗️ Bygg för produktion

### Steg 1: Installera EAS CLI
```bash
npm install -g @expo/eas-cli
```

### Steg 2: Logga in på Expo
```bash
eas login
```

### Steg 3: Konfigurera projekt
```bash
eas build:configure
```

### Steg 4: Bygg för Android
```bash
# För testning (APK)
eas build --platform android --profile preview

# För produktion (AAB)
eas build --platform android --profile production
```

### Steg 5: Bygg för iOS
```bash
# För testning
eas build --platform ios --profile preview

# För produktion
eas build --platform ios --profile production
```

## 📦 Deploya till App Store/Play Store

### Android (Google Play Store)

#### Steg 1: Skapa Google Play Console-konto
1. Gå till [Google Play Console](https://play.google.com/console)
2. Skapa ett utvecklarkonto ($25 engångsavgift)
3. Skapa ett nytt app-projekt

#### Steg 2: Ladda upp APK/AAB
1. **Ladda ner AAB-filen** från EAS build
2. **Ladda upp till Google Play Console**
3. **Fyll i app-information:**
   - App-namn: "Skiftappen"
   - Beskrivning
   - Screenshots
   - Kategori: "Kommunikation"

#### Steg 3: Publicera
1. **Genomför intern testning**
2. **Skicka in för granskning**
3. **Vänta på godkännande** (1-3 dagar)

### iOS (App Store)

#### Steg 1: Skapa Apple Developer-konto
1. Gå till [Apple Developer](https://developer.apple.com)
2. Registrera dig ($99/år)
3. Skapa ett nytt app-ID

#### Steg 2: Ladda upp till App Store Connect
1. **Ladda ner IPA-filen** från EAS build
2. **Skapa app i App Store Connect**
3. **Ladda upp IPA-filen**

#### Steg 3: Publicera
1. **Fyll i app-information**
2. **Skicka in för granskning**
3. **Vänta på godkännande** (1-7 dagar)

## 🔧 Miljövariabler

### Skapa .env fil
```bash
# Skapa .env fil i projektets rot
EXPO_PUBLIC_SUPABASE_URL=https://fsefeherdbtsddqimjco.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk
```

## 📊 Prestandaoptimering

### Steg 1: Aktivera Hermes
```json
// app.json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

### Steg 2: Aktivera ProGuard (Android)
```json
// app.json
{
  "expo": {
    "android": {
      "enableProguardInReleaseBuilds": true
    }
  }
}
```

## 🔐 Säkerhet

### Steg 1: Aktivera RLS i Supabase
- Alla tabeller har redan RLS aktiverat
- Policies är konfigurerade för säker åtkomst

### Steg 2: API-nycklar
- Använd endast anon key i klienten
- Service key ska endast användas på servern

## 📈 Analytics och Monitoring

### Steg 1: Lägg till crash reporting
```bash
npm install @sentry/react-native
```

### Steg 2: Lägg till analytics
```bash
npm install expo-analytics
```

## 🚀 Snabb deployment

### För snabb testning:
```bash
# Bygg och dela APK
eas build --platform android --profile preview
```

### För produktion:
```bash
# Bygg för båda plattformar
eas build --platform all --profile production
```

## 📞 Support

Om du stöter på problem:
1. **Kontrollera Expo-dokumentationen**
2. **Kontrollera Supabase-dokumentationen**
3. **Skapa issue på GitHub**

## ✅ Checklista före deployment

- [ ] Testa alla funktioner lokalt
- [ ] Konfigurera miljövariabler
- [ ] Testa på riktiga enheter
- [ ] Bygg för produktion
- [ ] Testa APK/IPA-filer
- [ ] Ladda upp till stores
- [ ] Konfigurera push-notifikationer
- [ ] Testa live-appen 