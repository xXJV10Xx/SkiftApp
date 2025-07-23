# 🏢 Loveable Skiftappen - Deployment Guide

## Översikt

Denna guide beskriver hur man deployar Loveable Skiftappen med fullständig integration av svenska företag och skiftscheman från scraping data.

## 🚀 Snabbstart

### 1. Förutsättningar

- Supabase konto
- React Native/Expo projekt
- Firebase projekt (för push notifications)
- Node.js 18+

### 2. Database Setup

```bash
# 1. Kör huvudschema
psql -h your-supabase-host -U postgres -d postgres -f LOVEABLE_COMPLETE_SCHEMA.sql

# 2. Kör RPC funktioner
psql -h your-supabase-host -U postgres -d postgres -f get_calendar_shifts_loveable.sql

# 3. Importera svenska företag
psql -h your-supabase-host -U postgres -d postgres -f SWEDISH_COMPANIES_IMPORT.sql
```

### 3. Edge Functions Deployment

```bash
# Navigera till Supabase projekt
cd supabase

# Deploy alla edge functions
supabase functions deploy create-trade-request
supabase functions deploy handle-trade-interest
supabase functions deploy send-chat-notification
```

### 4. Miljövariabler

Skapa `.env` fil:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Firebase (för push notifications)
FCM_SERVER_KEY=your-fcm-server-key
FCM_PROJECT_ID=your-firebase-project-id

# App konfiguration
EXPO_PUBLIC_APP_NAME=Skiftappen
EXPO_PUBLIC_APP_VERSION=1.0.0
```

## 📱 Frontend Setup

### 1. Installera dependencies

```bash
npm install react-native-calendars @react-native-picker/picker
npm install @expo/vector-icons expo-notifications
npm install react-native-push-notification
```

### 2. App.tsx Integration

```typescript
import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { useAuth } from './hooks/useAuth'
import { OnboardingFlow } from './components/OnboardingFlow'
import { LoveableCalendar } from './components/LoveableCalendar'
import { supabase } from './lib/supabase'

const Stack = createStackNavigator()

export default function App() {
  const { user, loading } = useAuth()
  const [profileComplete, setProfileComplete] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)

  useEffect(() => {
    checkProfileCompletion()
  }, [user])

  const checkProfileCompletion = async () => {
    if (!user) {
      setCheckingProfile(false)
      return
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, department_location, shift_team_id')
        .eq('id', user.id)
        .single()

      const isComplete = !!(profile?.company_id && profile?.department_location && profile?.shift_team_id)
      setProfileComplete(isComplete)
    } catch (error) {
      console.error('Error checking profile:', error)
    } finally {
      setCheckingProfile(false)
    }
  }

  if (loading || checkingProfile) {
    return <LoadingScreen />
  }

  if (!user) {
    return <AuthScreen />
  }

  if (!profileComplete) {
    return <OnboardingFlow onComplete={() => setProfileComplete(true)} />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Calendar" 
          component={LoveableCalendar}
          options={{ title: 'Skiftschema' }}
        />
        {/* Lägg till fler screens här */}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
```

### 3. Supabase Client Setup

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

## 🔧 Backend Konfiguration

### 1. Supabase RLS Policies

Alla RLS policies är redan konfigurerade i `LOVEABLE_COMPLETE_SCHEMA.sql`. Kontrollera att de är aktiva:

```sql
-- Kontrollera RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('companies', 'shift_teams', 'profiles', 'shifts');
```

### 2. Edge Functions Konfiguration

Sätt miljövariabler för edge functions:

```bash
supabase secrets set SUPABASE_URL=your-supabase-url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set FCM_SERVER_KEY=your-fcm-server-key
```

### 3. Database Triggers

Kontrollera att triggers är aktiva:

```sql
-- Kontrollera triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

## 📊 Data Import och Validering

### 1. Verifiera Import

```sql
-- Kontrollera företag
SELECT 
  name,
  industry,
  employee_count,
  location
FROM companies 
ORDER BY name;

-- Kontrollera teams
SELECT 
  st.name as team_name,
  c.name as company_name,
  st.color_hex,
  st.shift_pattern
FROM shift_teams st
JOIN companies c ON st.company_id = c.id
ORDER BY c.name, st.name;
```

### 2. Testa RPC Funktioner

```sql
-- Testa kalenderfunktion
SELECT * FROM get_calendar_shifts('all', '2024-01-01', '2024-01-31');

-- Testa nästa skift
SELECT * FROM get_next_shift();

-- Testa team statistik
SELECT * FROM get_team_stats('team-id-here');
```

## 🔔 Push Notifications Setup

### 1. Firebase Konfiguration

1. Skapa Firebase projekt
2. Ladda ner `google-services.json` (Android) och `GoogleService-Info.plist` (iOS)
3. Konfigurera FCM

### 2. Expo Notifications

```typescript
// App.tsx
import * as Notifications from 'expo-notifications'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Registrera för push notifications
const registerForPushNotificationsAsync = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!')
    return
  }
  
  const token = (await Notifications.getExpoPushTokenAsync()).data
  return token
}
```

## 🧪 Testing

### 1. Unit Tests

```bash
# Kör tester
npm test

# Testa specifika komponenter
npm test -- --testNamePattern="LoveableCalendar"
npm test -- --testNamePattern="OnboardingFlow"
```

### 2. Integration Tests

```typescript
// tests/integration/calendar.test.ts
import { supabase } from '../lib/supabase'

describe('Calendar Integration', () => {
  test('should fetch shifts for all teams', async () => {
    const { data, error } = await supabase
      .rpc('get_calendar_shifts', {
        p_team_filter_id: 'all',
        p_start_date: '2024-01-01',
        p_end_date: '2024-01-31'
      })
    
    expect(error).toBeNull()
    expect(data).toBeDefined()
  })
})
```

### 3. E2E Tests

```bash
# Installera Detox för E2E testing
npm install -g detox-cli
detox init

# Kör E2E tester
detox test
```

## 🚀 Production Deployment

### 1. Supabase Production

```bash
# Skapa production projekt
supabase projects create skiftappen-prod

# Länka lokalt projekt
supabase link --project-ref your-project-ref

# Deploy till production
supabase db push
supabase functions deploy --project-ref your-project-ref
```

### 2. App Store Deployment

```bash
# Build för production
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit till stores
eas submit --platform ios
eas submit --platform android
```

### 3. CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

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
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Deploy to Supabase
        run: |
          supabase db push
          supabase functions deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          
      - name: Build and deploy app
        run: eas build --auto-submit
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## 📈 Monitoring och Analytics

### 1. Supabase Analytics

```sql
-- Skapa dashboard för användning
CREATE VIEW shift_analytics AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_shifts,
  COUNT(CASE WHEN shift_type = 'L' THEN 1 END) as free_days,
  COUNT(CASE WHEN is_my_shift = true THEN 1 END) as my_shifts
FROM shifts
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 2. Error Tracking

```typescript
// Integrera Sentry för error tracking
import * as Sentry from '@sentry/react-native'

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: __DEV__ ? 'development' : 'production',
})
```

## 🔒 Säkerhet

### 1. RLS Policies

Alla tabeller har RLS aktiverat med specifika policies för:
- Användare kan bara läsa sina egna data
- Admins kan hantera alla data
- Team-medlemmar kan se team-data

### 2. API Rate Limiting

```typescript
// Implementera rate limiting för edge functions
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minuter
  max: 100 // max 100 requests per window
}
```

### 3. Data Encryption

```sql
-- Aktivera encryption för känslig data
ALTER TABLE profiles 
ADD COLUMN encrypted_phone_number BYTEA;

-- Använd pgcrypto för encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## 📚 Dokumentation

### 1. API Dokumentation

Generera automatisk API dokumentation:

```bash
# Installera Swagger
npm install swagger-jsdoc swagger-ui-express

# Generera dokumentation
npm run docs:generate
```

### 2. Komponent Dokumentation

```typescript
/**
 * LoveableCalendar - Huvudkomponent för skiftschema
 * 
 * @component
 * @example
 * <LoveableCalendar />
 * 
 * @prop {string} selectedTeam - Vald team filter
 * @prop {function} onShiftSelect - Callback för skiftval
 */
```

## 🆘 Troubleshooting

### Vanliga Problem

1. **RLS Policy Errors**
   ```sql
   -- Kontrollera policies
   SELECT * FROM pg_policies WHERE tablename = 'shifts';
   ```

2. **Edge Function Timeouts**
   ```typescript
   // Öka timeout i edge functions
   const timeout = 30000 // 30 sekunder
   ```

3. **Push Notification Failures**
   ```typescript
   // Debug FCM
   console.log('FCM Response:', fcmResponse.status)
   ```

### Support

- Supabase Discord: #sweden
- GitHub Issues: [Repository Issues]
- Email: support@skiftappen.se

## 📋 Checklista för Deployment

- [ ] Database schema skapat
- [ ] Svenska företag importerade
- [ ] RPC funktioner aktiva
- [ ] Edge functions deployade
- [ ] Frontend komponenter integrerade
- [ ] Push notifications konfigurerade
- [ ] RLS policies verifierade
- [ ] Testing slutfört
- [ ] Production miljö konfigurerad
- [ ] Monitoring aktiverat
- [ ] Dokumentation uppdaterad

---

**Status**: ✅ Komplett Loveable-optimerad implementation
**Version**: 1.0.0
**Senast uppdaterad**: 2024-01-15 