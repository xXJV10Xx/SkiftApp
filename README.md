# 📱 Skiftappen - Avancerad Schemaläggning och Skiftbyten

En modern React Native-app för schemahantering och skiftbyten, byggd med Expo, Supabase och designad för enkel deployment via Lovable.

## ✨ Funktioner

### 🔐 Autentisering & Onboarding
- Säker användarregistrering och inloggning
- Komplett onboarding-process för nya användare
- Profilhantering med företags- och laginformation

### 📅 Avancerad Kalender
- Färgkodade lag och schematyper
- Intelligenta filter (Mitt lag, Alla lag, Specifika lag)
- Interaktiv kalendervy med detaljerad information
- Dynamisk legend som visar alla aktiva lag och schematyper

### 🔄 Skiftbyten
- Skapa och hantera bytesförfrågningar
- Visa intresse för andras byten
- Automatisk chattfunktion för förhandlingar
- Statusspårning (Öppen, Accepterad, Avbruten, Slutförd)

### 💬 Realtidschatt
- Privata konversationer för varje bytesförfrågan
- Push-notiser via Firebase Cloud Messaging
- Meddelanden med olika typer (text, förslag, accepterad/avvisad)

### 👤 Profilhantering
- Personlig profil med avatar
- Arbetsplatsinformation och lagmedlemskap
- Inställningar och kontoadministration

## 🏗️ Teknisk Arkitektur

### Frontend
- **React Native** med Expo för cross-platform utveckling
- **TypeScript** för typsäkerhet
- **React Navigation** för navigation
- **React Native Calendars** för kalenderkomponenter
- **Supabase JS Client** för backend-integration

### Backend
- **Supabase** som Backend-as-a-Service
- **PostgreSQL** databas med Row Level Security (RLS)
- **Supabase Auth** för användarautentisering
- **Edge Functions** för serverlogik
- **Realtime** för live-uppdateringar

### Säkerhet
- Row Level Security (RLS) på alla databastabeller
- JWT-baserad autentisering
- Säkra API-endpoints med användarvalidering
- Miljövariabler för känslig konfiguration

## 🚀 Snabbstart

### Förutsättningar
- Node.js 18+ och npm/yarn
- Expo CLI (`npm install -g @expo/cli`)
- Supabase CLI (`npm install -g supabase`)
- Git

### Installation

1. **Klona repositoryt**
```bash
git clone https://github.com/ditt-username/skiftappen.git
cd skiftappen
```

2. **Installera beroenden**
```bash
npm install
```

3. **Konfigurera miljövariabler**
```bash
cp .env.example .env
# Redigera .env med dina Supabase-uppgifter
```

4. **Starta utvecklingsservern**
```bash
npm start
```

## 🗄️ Databasschema

### Huvudtabeller
- `shift_teams` - Lag med färgkodning
- `profiles` - Användarprofilinformation
- `shifts` - Scheman kopplade till lag
- `shift_trade_requests` - Bytesförfrågningar
- `private_chats` - Privata konversationer
- `messages` - Chattmeddelanden

### RPC-funktioner
- `get_calendar_shifts()` - Hämtar filtrerade scheman
- `is_profile_complete()` - Kontrollerar profilstatus

## 📦 Deployment

### Till GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Till Supabase
1. Skapa nytt Supabase-projekt
2. Kör SQL-schemat från `supabase_schema.sql`
3. Deploya Edge Functions:
```bash
supabase functions deploy create-trade-request
supabase functions deploy handle-trade-interest
supabase functions deploy send-chat-notification
```

### Till Lovable
1. Importera GitHub-repository till Lovable
2. Konfigurera miljövariabler
3. Kör build och deploy

Se `DEPLOYMENT_COMPLETE_GUIDE.md` för detaljerade instruktioner.

## 🎯 Kommande Funktioner

- [ ] **Kalenderintegration**: Export till Google/Apple Calendar
- [ ] **Push-notiser**: Fullständig FCM-implementation
- [ ] **Hemskärms-widgets**: iOS och Android widgets
- [ ] **Offline-support**: Caching och synkronisering
- [ ] **Admin-panel**: Laghantering och användaradministration
- [ ] **Rapporter**: Schemastatistik och bytesanalys

## 🤝 Bidra

1. Forka projektet
2. Skapa en feature branch (`git checkout -b feature/AmazingFeature`)
3. Commita dina ändringar (`git commit -m 'Add some AmazingFeature'`)
4. Pusha till branchen (`git push origin feature/AmazingFeature`)
5. Öppna en Pull Request

## 📄 Licens

Detta projekt är licensierat under MIT License - se [LICENSE](LICENSE) filen för detaljer.

## 🆘 Support

- 📧 **Email**: support@skiftappen.se
- 🐛 **Buggar**: [GitHub Issues](https://github.com/ditt-username/skiftappen/issues)
- 💬 **Diskussioner**: [GitHub Discussions](https://github.com/ditt-username/skiftappen/discussions)

## 🙏 Tack

- [Supabase](https://supabase.com) för den fantastiska backend-plattformen
- [Expo](https://expo.dev) för React Native-utvecklingsverktyg
- [Lovable](https://lovable.dev) för deployment och hosting
- [React Native Calendar](https://github.com/wix/react-native-calendars) för kalenderkomponenter

---

**Skiftappen** - Förenkla ditt arbetsliv med intelligent schemahantering! 🚀
