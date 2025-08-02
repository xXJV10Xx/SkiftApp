# Stripe Integration Guide - Skiftappen

## Översikt

Detta paket innehåller en komplett Stripe-integration för Skiftappen med:
- 🔄 Prenumerationer (månadsvis, halvår, årlig)
- 💳 Engångsbetalning för kalenderexport
- 🆓 7-dagars gratis trial
- 📱 React Native-komponenter
- 🔗 Supabase-integration

## Installation

### 1. Installera dependencies

```bash
npm install stripe @supabase/supabase-js expo-web-browser expo-file-system expo-sharing micro
```

### 2. Lägg till Stripe SDK (för React Native)

```bash
npm install @stripe/stripe-react-native
```

## Projektstruktur

```
/
├── api/
│   ├── create-checkout-session.js    # Skapar Stripe checkout
│   └── stripe-webhook.js             # Webhook för betalningsbekräftelser
├── components/
│   ├── SubscriptionScreen.tsx        # Prenumerationsskärm
│   └── CalendarExport.tsx            # Export-funktionalitet
├── hooks/
│   └── useSubscription.ts            # Hook för prenumerationsstatus
├── database/
│   └── subscription_schema.sql       # Databasschema
└── .env.example                      # Miljövariabler
```

## Setup-steg

### 1. Databasschema

Kör SQL-koden i `database/subscription_schema.sql` i din Supabase SQL-editor:

```sql
-- Lägg till prenumerationskolumner
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_paid_export BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS premium_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS premium_started_at TIMESTAMPTZ;
```

### 2. Miljövariabler

Kopiera `.env.example` till `.env` och fyll i dina värden:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLIENT_URL=https://your-app.com
```

### 3. API-endpoints

#### För Next.js:
Placera API-filerna i `pages/api/` eller `app/api/`

#### För Expo/React Native:
Använd en backend-lösning som Vercel, Netlify eller egen server

### 4. Integrera komponenter

#### I din app:

```tsx
import SubscriptionScreen from './components/SubscriptionScreen';
import CalendarExport from './components/CalendarExport';
import { useSubscription } from './hooks/useSubscription';

function MyApp() {
  const { subscriptionStatus } = useSubscription();
  
  return (
    <View>
      {/* Visa prenumerationsskärm */}
      <SubscriptionScreen />
      
      {/* Visa export om användaren har tillgång */}
      {subscriptionStatus.hasExportAccess && (
        <CalendarExport shifts={userShifts} />
      )}
    </View>
  );
}
```

## Användning

### Prenumerationshantering

```tsx
import { useSubscription } from './hooks/useSubscription';

function PremiumFeature() {
  const { checkPremiumAccess, subscriptionStatus } = useSubscription();
  
  const handlePremiumAction = () => {
    if (checkPremiumAccess()) {
      // Utför premium-funktion
      console.log('Premium-användare!');
    }
  };
  
  return (
    <View>
      <Text>
        {subscriptionStatus.isTrialActive 
          ? `${subscriptionStatus.trialDaysLeft} dagar kvar av trial`
          : subscriptionStatus.hasPremiumAccess 
            ? 'Premium aktiv' 
            : 'Prenumeration krävs'
        }
      </Text>
      <Button onPress={handlePremiumAction} title="Premium-funktion" />
    </View>
  );
}
```

### Reklam för icke-premium användare

```tsx
function ShowAdIfNeeded() {
  const { showAdIfNeeded } = useSubscription();
  
  useEffect(() => {
    // Visa reklam för icke-premium användare
    const shouldShowAd = showAdIfNeeded();
    if (shouldShowAd) {
      // Reklam visas automatiskt via Alert
    }
  }, []);
  
  return null;
}
```

### Kalenderexport

```tsx
import CalendarExport from './components/CalendarExport';

function CalendarScreen() {
  const shifts = [
    {
      id: '1',
      date: '2024-01-15',
      start_time: '08:00',
      end_time: '16:00',
      position: 'Kassör',
      location: 'ICA Maxi'
    }
  ];
  
  return (
    <CalendarExport 
      shifts={shifts} 
      companyName="ICA Maxi Malmö" 
    />
  );
}
```

## Prissättning

| Plan | Pris | Beskrivning |
|------|------|-------------|
| Trial | Gratis | 7 dagar, alla funktioner |
| Månadsvis | 39 kr/mån | Ingen bindning |
| Halvår | 108 kr | 6 månader, spara 126 kr |
| Årlig | 205 kr/år | Spara 263 kr |
| Export | 99 kr | Engångsköp |

## Säkerhet

### API-säkerhet
- ✅ Validera webhook-signaturer
- ✅ Använd HTTPS för alla endpoints
- ✅ Lagra API-nycklar som miljövariabler
- ✅ Validera användardata

### Datahantering
- ✅ GDPR-kompatibel
- ✅ Krypterad dataöverföring
- ✅ Minimal datainsamling
- ✅ Användarkontroll över data

## Testing

### Test-kortnummer (Stripe test-miljö)
- **Lyckad**: 4242 4242 4242 4242
- **Misslyckad**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

### Test-scenario
1. Skapa testkonto
2. Starta 7-dagars trial
3. Testa prenumerationsköp
4. Testa export-köp
5. Verifiera webhook-hantering

## Deployment

### Produktionschecklista
- [ ] Stripe live-nycklar konfigurerade
- [ ] Webhook-endpoints tillgängliga
- [ ] SSL-certifikat aktiverat
- [ ] Databas-backup konfigurerad
- [ ] Monitoring aktiverat
- [ ] Juridiska sidor uppdaterade

### Miljöer
- **Development**: Test-nycklar, localhost
- **Staging**: Test-nycklar, staging-domain
- **Production**: Live-nycklar, produktionsdomän

## Monitoring

### Viktiga metriker
- Prenumerationskonvertering
- Churn rate (avhopp)
- Export-köp
- Webhook-framgång
- Betalningsfel

### Alerts
- Misslyckade betalningar
- Webhook-timeout
- Höga felfrekvenser
- Säkerhetshot

## Support och troubleshooting

### Vanliga problem

**"Webhook fungerar inte"**
```bash
# Testa webhook lokalt med ngrok
ngrok http 3000
# Uppdatera webhook URL i Stripe Dashboard
```

**"Betalning skapas inte"**
- Kontrollera API-nycklar
- Verifiera webhook-signatur
- Kolla databas-uppdatering

**"Export fungerar inte"**
- Kontrollera filbehörigheter
- Verifiera .ics-format
- Testa med färre skift

### Debugging

```javascript
// Aktivera debug-logging
console.log('Stripe event:', event.type);
console.log('User data:', userData);
console.log('Subscription status:', subscriptionStatus);
```

## Roadmap

### Nästa funktioner
- 🔄 Prenumerationshantering i appen
- 📧 E-postnotifikationer
- 🎯 A/B-testning av priser
- 📊 Avancerad analytics
- 🌍 Internationalisering

### Tekniska förbättringar
- Offline-support för export
- Push-notifikationer
- Automatisk backup
- Prestanda-optimering

## Kontakt

För support eller frågor:
- 📧 E-post: support@skiftappen.se
- 📱 Discord: [Skiftappen Community]
- 🐛 Issues: GitHub Issues

---

*Skapad för Skiftappen - Stripe Integration v1.0*