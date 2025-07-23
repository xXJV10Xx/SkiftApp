# 🚀 Skiftapp Deployment Guide

## 📋 Översikt

Denna guide hjälper dig att spara och exportera alla uppdateringar till GitHub, Supabase och Firebase för din Skiftapp.

## 🎯 Vad som ska deployas

### Nya Funktioner
- ✅ **Kalendersynkronisering** (Google/Apple Calendar)
- ✅ **Förbättrat Chattsystem** (Bilddelning, Online-status, Privatchatt)
- ✅ **Skiftintresse-system** (Färdiga meddelanden, Automatisk privatchatt)
- ✅ **Användardashboard** (Snabbstatistik, Inställningar)
- ✅ **Autentisering** (Google OAuth, Email/Password)

### Databasuppdateringar
- ✅ **calendar_syncs** - Kalendersynkronisering
- ✅ **calendar_events** - Kalenderhändelser
- ✅ **chat_channels** - Privatchattar
- ✅ **chat_messages** - Uppdaterad med skiftintresse
- ✅ **online_status** - Online-användare

## 📁 Filer att spara

### Komponenter
```
components/
├── AuthScreen.tsx
├── ChatSystem.tsx
├── CompanyManagement.tsx
├── PatternDashboard.tsx
├── ShiftManagement.tsx
└── UserDashboard.tsx
```

### Konfiguration
```
lib/
└── supabase.ts
```

### Dokumentation
```
README/
├── AUTH_README.md
├── CALENDAR_SYNC_README.md
├── CHAT_SYSTEM_README.md
├── SHIFT_INTEREST_README.md
└── SKIFTAPP_OVERVIEW.md
```

### Huvudapp
```
App.tsx
```

## 🔧 Deployment-steg

### 1. GitHub Deployment

#### A. Förberedelse
```bash
# Kontrollera git status
git status

# Lägg till alla nya filer
git add .

# Skapa commit med beskrivning
git commit -m "🚀 Major update: Calendar sync, enhanced chat, shift interest system

- Added Google/Apple Calendar synchronization
- Enhanced chat system with image sharing and online status
- Implemented shift interest system with predefined messages
- Added user dashboard with statistics
- Updated database schema for new features
- Added comprehensive documentation"

# Push till GitHub
git push origin main
```

#### B. GitHub Actions (om konfigurerat)
```yaml
# .github/workflows/deploy.yml
name: Deploy Skiftapp
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Build app
        run: npm run build
```

### 2. Supabase Deployment

#### A. Databasschema
```sql
-- Kör dessa SQL-kommandon i Supabase SQL Editor

-- 1. Skapa calendar_syncs tabell
CREATE TABLE IF NOT EXISTS calendar_syncs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_type TEXT NOT NULL CHECK (calendar_type IN ('google', 'apple')),
  is_enabled BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_frequency TEXT DEFAULT 'hourly' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly')),
  access_token TEXT,
  refresh_token TEXT,
  calendar_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Skapa calendar_events tabell
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  calendar_type TEXT NOT NULL CHECK (calendar_type IN ('google', 'apple', 'skiftapp')),
  external_event_id TEXT,
  is_synced BOOLEAN DEFAULT false,
  sync_direction TEXT DEFAULT 'bidirectional' CHECK (sync_direction IN ('inbound', 'outbound', 'bidirectional')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Skapa chat_channels tabell
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('team', 'department', 'company', 'private')),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  participants TEXT[],
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Uppdatera chat_messages tabell
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS shift_interest JSONB;

-- 5. Skapa RLS policies
ALTER TABLE calendar_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;

-- Calendar syncs policies
CREATE POLICY "Users can view own calendar syncs" ON calendar_syncs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar syncs" ON calendar_syncs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar syncs" ON calendar_syncs
  FOR UPDATE USING (auth.uid() = user_id);

-- Calendar events policies
CREATE POLICY "Users can view own calendar events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar events" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

-- Chat channels policies
CREATE POLICY "Users can view channels they participate in" ON chat_channels
  FOR SELECT USING (
    auth.uid() = ANY(participants) OR 
    auth.uid() = created_by OR
    type IN ('team', 'department', 'company')
  );

CREATE POLICY "Users can insert channels" ON chat_channels
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update channels they created" ON chat_channels
  FOR UPDATE USING (auth.uid() = created_by);
```

#### B. Storage Bucket
```sql
-- Skapa storage bucket för chat-bilder
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', true);

-- Storage policies för chat-bilder
CREATE POLICY "Users can upload chat images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view chat images" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-images');
```

#### C. Realtime Subscriptions
```sql
-- Aktivera realtime för nya tabeller
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_syncs;
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_channels;
```

### 3. Firebase Deployment

#### A. Firebase Functions (om använt)
```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Calendar sync function
exports.syncCalendar = functions.https.onCall(async (data, context) => {
  // Implementera kalendersynkronisering
  const { userId, calendarType } = data;
  
  // Logik för kalendersynkronisering
  return { success: true };
});

// Chat notification function
exports.sendChatNotification = functions.https.onCall(async (data, context) => {
  // Implementera push-notifikationer för chatt
  const { userId, message } = data;
  
  // Logik för notifikationer
  return { success: true };
});
```

#### B. Firebase Hosting
```bash
# Installera Firebase CLI
npm install -g firebase-tools

# Login till Firebase
firebase login

# Initiera Firebase projekt
firebase init hosting

# Deploy till Firebase
firebase deploy
```

#### C. firebase.json
```json
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions"
  }
}
```

### 4. Environment Variables

#### A. .env.local
```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://fsefeherdbtsddqimjco.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZWZlaGVyZGJ0c2RkcWltamNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODUwNDcsImV4cCI6MjA2ODM2MTA0N30.YEltOJVQU6Ox5YrkZJGzbMiojyQClkFwG-mBPilIAfk

# Google Calendar
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your_google_client_secret

# Apple Calendar
EXPO_PUBLIC_APPLE_TEAM_ID=your_apple_team_id
EXPO_PUBLIC_APPLE_KEY_ID=your_apple_key_id

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🚀 Snabbdeployment

### Komplett deployment-script
```bash
#!/bin/bash

echo "🚀 Starting Skiftapp deployment..."

# 1. Git deployment
echo "📦 Deploying to GitHub..."
git add .
git commit -m "🚀 Major update: Calendar sync, enhanced chat, shift interest system"
git push origin main

# 2. Build app
echo "🔨 Building app..."
npm run build

# 3. Deploy to Firebase
echo "🔥 Deploying to Firebase..."
firebase deploy

# 4. Update Supabase (manuellt)
echo "📊 Please run SQL commands in Supabase dashboard"
echo "📋 Check DEPLOYMENT_GUIDE.md for SQL commands"

echo "✅ Deployment complete!"
```

### Manuell deployment-checklista
- [ ] **GitHub**: `git add . && git commit -m "message" && git push`
- [ ] **Supabase**: Kör SQL-kommandon i dashboard
- [ ] **Firebase**: `firebase deploy`
- [ ] **Environment**: Uppdatera .env filer
- [ ] **Test**: Verifiera alla funktioner

## 🔍 Verifiering

### Testa nya funktioner
```bash
# 1. Testa autentisering
npm start
# Öppna app och testa login

# 2. Testa chattsystem
# Skicka meddelande, dela bild, skapa privatchatt

# 3. Testa skiftintresse
# Skapa skiftintresse, visa intresse

# 4. Testa kalendersynk
# Synka med Google/Apple Calendar

# 5. Testa dashboard
# Kontrollera statistik och inställningar
```

### Debug-verktyg
```typescript
// Lägg till i App.tsx för debugging
console.log('App loaded with features:', {
  calendarSync: true,
  enhancedChat: true,
  shiftInterest: true,
  userDashboard: true
});
```

## 📞 Support

### Vanliga problem
1. **Supabase connection error**
   - Kontrollera environment variables
   - Verifiera API keys

2. **Firebase deployment failed**
   - Kontrollera firebase.json
   - Verifiera projekt-ID

3. **Git push rejected**
   - Pull senaste ändringar
   - Resolve conflicts

### Kontakt
- **GitHub**: Skapa issue för buggar
- **Supabase**: Använd dashboard support
- **Firebase**: Använd Firebase console

---

**Skiftapp Deployment** - Komplett guide för att deploya alla uppdateringar till GitHub, Supabase och Firebase. 