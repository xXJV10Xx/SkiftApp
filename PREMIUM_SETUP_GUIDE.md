# 🎯 Premium Setup Guide för Skiftappen

Detta dokument beskriver hur du konfigurerar och aktiverar premium-funktionerna i Skiftappen.

## 📋 Översikt

Premium-systemet inkluderar:
- ✅ Stripe-integration för betalningar
- ✅ Apple Pay & Google Pay support
- ✅ Supabase för prenumerationshantering
- ✅ Premium-lås för funktioner
- ✅ Reklamhantering
- ✅ 7 dagars gratis provperiod

## 🚀 Steg-för-steg Setup

### 1. Supabase Database Setup

Kör detta SQL-script i din Supabase SQL Editor:

```sql
-- Kör innehållet från supabase_subscription_setup.sql
```

### 2. Stripe Configuration

1. **Skapa Stripe-konto:**
   - Gå till [stripe.com](https://stripe.com)
   - Skapa konto och verifiera

2. **Hämta API-nycklar:**
   - Dashboard → Developers → API keys
   - Kopiera Secret key och Publishable key

3. **Konfigurera Webhooks:**
   - Dashboard → Developers → Webhooks
   - Lägg till endpoint: `https://your-domain.com/api/webhook`
   - Välj events: 
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`

### 3. Miljövariabler

Skapa `.env` fil baserad på `.env.example`:

```bash
# Kopiera exempel-filen
cp .env.example .env

# Redigera med dina värden
```

### 4. Dependencies Installation

```bash
# Installera nya dependencies
npm install

# För iOS (Apple Pay)
cd ios && pod install && cd ..

# För Android, lägg till i android/app/build.gradle:
# implementation 'com.google.android.gms:play-services-wallet:19.1.0'
```

### 5. App Configuration

#### iOS (Apple Pay):
1. Lägg till i `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.skiftappen.app",
          "enableGooglePay": false
        }
      ]
    ]
  }
}
```

2. Konfigurera Apple Developer Account:
   - Aktivera Apple Pay capability
   - Skapa Merchant ID

#### Android (Google Pay):
1. Lägg till i `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "",
          "enableGooglePay": true
        }
      ]
    ]
  }
}
```

### 6. API Endpoints Setup

API-endpoints är redan skapade:
- `/api/webhook.js` - Stripe webhook handler
- `/api/create-checkout-session.js` - Skapar betalningssession

Dessa behöver deployas till en server (Vercel, Netlify, etc.)

## 🔧 Användning

### Premium-lås

Använd `PremiumLock`-komponenten för att låsa funktioner:

```tsx
import { PremiumLock } from '../components/PremiumLock';

<PremiumLock 
  feature="Avancerad funktion" 
  description="Beskrivning av funktionen"
>
  <YourPremiumComponent />
</PremiumLock>
```

### Reklam

Använd `AdBanner`-komponenten för att visa reklam:

```tsx
import { AdBanner } from '../components/AdBanner';

<AdBanner position="bottom" size="banner" />
```

### Prenumerationsstatus

Använd `useSubscription`-hook:

```tsx
import { useSubscription } from '../context/SubscriptionContext';

function MyComponent() {
  const { isPremium, isTrialActive, trialDaysLeft } = useSubscription();
  
  if (isPremium) {
    return <PremiumContent />;
  }
  
  return <FreeContent />;
}
```

## 💰 Prissättning

Aktuella priser (konfigurerbar i `/api/create-checkout-session.js`):
- **Månad:** 39 kr/månad
- **Halvår:** 108 kr (5% rabatt)
- **År:** 205 kr (10% rabatt)

## 🧪 Testning

### Stripe Test Mode
- Använd test-nycklar från Stripe Dashboard
- Test-kortnummer: `4242 4242 4242 4242`
- Använd valfritt CVC och framtida datum

### Webhook Testing
```bash
# Installera Stripe CLI
stripe listen --forward-to localhost:3000/api/webhook

# Testa webhook
stripe trigger checkout.session.completed
```

## 🚀 Deployment

1. **API Endpoints:**
   - Deploy till Vercel/Netlify
   - Uppdatera webhook URL i Stripe

2. **App:**
   - Build för production
   - Uppdatera miljövariabler till production-värden

3. **Stripe:**
   - Aktivera live mode
   - Uppdatera API-nycklar till live-nycklar

## 🔒 Säkerhet

- ✅ Webhook-signatur verifiering
- ✅ Row Level Security (RLS) i Supabase
- ✅ Server-side prenumerationsvalidering
- ✅ Säker hantering av API-nycklar

## 📱 Plattformsspecifikt

### iOS App Store
- Konfigurera In-App Purchase om önskad som alternativ
- Apple tar 30% provision på In-App Purchases
- Stripe tar ~2.9% + 3 kr per transaktion

### Google Play Store  
- Konfigurera Google Play Billing om önskad som alternativ
- Google tar 30% provision på Play Billing
- Stripe tar ~2.9% + 3 kr per transaktion

## 🆘 Troubleshooting

### Vanliga problem:

1. **Webhook fungerar inte:**
   - Kontrollera webhook URL
   - Verifiera webhook secret
   - Kolla server-loggar

2. **Betalning fungerar inte:**
   - Kontrollera API-nycklar
   - Verifiera test/live mode
   - Kolla Stripe Dashboard för fel

3. **Premium-status uppdateras inte:**
   - Kontrollera real-time prenumerationer i Supabase
   - Verifiera webhook-hantering
   - Kolla databas-policies

### Debug-kommandon:
```bash
# Testa Supabase-anslutning
npm run test:supabase

# Testa Stripe-integration
npm run test:stripe

# Visa webhook-loggar
stripe logs tail
```

## 📞 Support

För frågor om premium-setup:
1. Kolla denna guide först
2. Sök i [Stripe dokumentation](https://stripe.com/docs)
3. Kolla [Supabase dokumentation](https://supabase.com/docs)
4. Skapa issue i GitHub repo

---

**🎉 Grattis! Du har nu ett komplett premium-system med Stripe, Apple Pay, Google Pay och Supabase!**