# 🚀 Skiftappen

En modern React Native app med Supabase autentisering och real-time chatfunktion för lag och företag.

## ✨ Funktioner

- 🔐 **Supabase Autentisering** - Email/lösenord och Google OAuth
- 💬 **Real-time Chat** - Lagbaserad chatt med medlemmar
- 👥 **Laghantering** - Företag, lag och medlemshantering
- 📱 **Online Status** - Se vem som är online i realtid
- 🎨 **Modern UI** - Vackert svenskt gränssnitt
- 🔒 **Säkerhet** - Row Level Security (RLS) i databasen

## 🛠️ Teknisk Stack

- **Frontend:** React Native + Expo
- **Backend:** Supabase (PostgreSQL + Real-time)
- **Autentisering:** Supabase Auth
- **Styling:** React Native StyleSheet
- **Navigation:** Expo Router
- **Icons:** Expo Vector Icons

## 📋 Förutsättningar

- Node.js (version 16 eller högre)
- npm eller yarn
- Expo CLI
- Supabase konto

## 🚀 Installation

### 1. Klona projektet
```bash
git clone https://github.com/ditt-användarnamn/skiftappen.git
cd skiftappen
```

### 2. Installera dependencies
```bash
npm install
```

### 3. Konfigurera miljövariabler
Skapa en `.env` fil i projektets rot:
```env
EXPO_PUBLIC_SUPABASE_URL=din_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=din_supabase_anon_key
```

### 4. Sätt upp databasen
Följ instruktionerna i `DATABASE_SETUP.md` för att skapa tabeller och policies.

### 5. Starta appen
```bash
npm start
```

## 📱 App-struktur

```
skiftappen/
├── app/                    # Expo Router sidor
│   ├── (tabs)/           # Tab-navigation
│   │   ├── index.tsx     # Hem-sida
│   │   ├── chat.tsx      # Chat-sida
│   │   ├── explore.tsx   # Utforska-sida
│   │   └── profile.tsx   # Profil-sida
│   ├── auth/             # Autentiseringssidor
│   │   ├── login.tsx     # Login/signup
│   │   └── forgot-password.tsx
│   └── _layout.tsx       # Huvudlayout
├── context/              # React Context
│   ├── AuthContext.tsx   # Autentisering
│   └── ChatContext.tsx   # Chat-funktionalitet
├── lib/                  # Utilities
│   ├── supabase.ts       # Supabase klient
│   └── test-connection.ts
├── components/           # Återanvändbara komponenter
└── assets/              # Bilder och resurser
```

## 🗄️ Databasstruktur

### Tabeller:
- **companies** - Företag
- **teams** - Lag med färger
- **team_members** - Medlemskap
- **chat_messages** - Meddelanden
- **online_status** - Online-status
- **profiles** - Användarprofiler

### Säkerhet:
- Row Level Security (RLS) aktiverat
- Användare ser endast relevant data
- Lagbaserad åtkomstkontroll

## 🧪 Testning

### 1. Skapa testdata
```sql
-- Skapa företag och lag
INSERT INTO companies (name, description) VALUES
('TechCorp AB', 'Ett innovativt tech-företag');

INSERT INTO teams (name, color, company_id, description) VALUES
('Utvecklingsteam', '#007AFF', (SELECT id FROM companies WHERE name = 'TechCorp AB'), 'Huvudutvecklingsteam');
```

### 2. Lägg till användare i lag
```sql
INSERT INTO team_members (user_id, team_id, role) VALUES
('ditt-user-id', (SELECT id FROM teams WHERE name = 'Utvecklingsteam'), 'member');
```

### 3. Testa chatfunktionen
- Gå till Chat-fliken i appen
- Välj ett lag
- Skicka testmeddelanden

## 🔧 Konfiguration

### Supabase Setup
1. Skapa ett Supabase projekt
2. Kopiera URL och anon key
3. Aktivera Google OAuth (valfritt)
4. Skapa databasen med SQL-kommandon

### Google OAuth (valfritt)
Följ instruktionerna i `GOOGLE_OAUTH_SETUP.md`

## 📦 Deployment

### Expo Build
```bash
# För Android
expo build:android

# För iOS
expo build:ios
```

### EAS Build (rekommenderat)
```bash
# Installera EAS CLI
npm install -g @expo/eas-cli

# Logga in
eas login

# Konfigurera build
eas build:configure

# Bygg för Android
eas build --platform android

# Bygg för iOS
eas build --platform ios
```

## 🤝 Bidrag

1. Forka projektet
2. Skapa en feature branch (`git checkout -b feature/AmazingFeature`)
3. Committa dina ändringar (`git commit -m 'Add some AmazingFeature'`)
4. Pusha till branchen (`git push origin feature/AmazingFeature`)
5. Öppna en Pull Request

## 📄 Licens

Detta projekt är licensierat under MIT License - se [LICENSE](LICENSE) filen för detaljer.

## 📞 Support

Om du har frågor eller stöter på problem:

1. Kontrollera [Issues](https://github.com/ditt-användarnamn/skiftappen/issues)
2. Skapa en ny issue om problemet inte redan finns
3. Kontakta utvecklaren för direkta frågor

## 🎯 Roadmap

- [ ] Push-notifikationer
- [ ] Filuppladdning i chat
- [ ] Kalenderintegration
- [ ] Skiftschema
- [ ] Rapporter och analytics
- [ ] Multi-språk support

---

**Skapad med ❤️ för svenska företag och lag**
