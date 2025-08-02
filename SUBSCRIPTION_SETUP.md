# Prenumerationsfunktionalitet - Setup Guide

## 📋 Översikt

Detta guide beskriver hur du sätter upp komplett prenumerationsfunktionalitet med Stripe, Apple Pay, Google Pay och Supabase.

## 🗄️ Steg 1: Supabase Database Setup

### Skapa subscriptions-tabell

Kör denna SQL i Supabase SQL Editor:

```sql
-- Skapa subscriptions tabell
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  plan TEXT CHECK (plan IN ('monthly', 'semiannual', 'annual')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Skapa index för bättre prestanda
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);

-- Skapa RLS (Row Level Security) policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy för att användare bara kan se sina egna prenumerationer
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy för att användare kan uppdatera sina egna prenumerationer
CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy för service role (för webhooks)
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Skapa trigger för updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 💳 Steg 2: Stripe Setup

### 2.1 Skapa Stripe-konto
1. Gå till [stripe.com](https://stripe.com) och skapa konto
2. Aktivera test-läge för utveckling

### 2.2 Konfigurera betalningsmetoder
1. Gå till Stripe Dashboard > Settings > Payment methods
2. Aktivera:
   - Cards
   - Apple Pay
   - Google Pay
   - Klarna (valfritt)

### 2.3 Skapa produkter och priser
```javascript
// Exempel på hur du skapar priser via Stripe CLI eller Dashboard
stripe prices create \
  --unit-amount=3900 \
  --currency=sek \
  --recurring='{"interval":"month"}' \
  --product-data='{"name":"Skiftappen Premium - Månad"}'

stripe prices create \
  --unit-amount=10800 \
  --currency=sek \
  --recurring='{"interval":"month","interval_count":6}' \
  --product-data='{"name":"Skiftappen Premium - Halvår"}'

stripe prices create \
  --unit-amount=20500 \
  --currency=sek \
  --recurring='{"interval":"year"}' \
  --product-data='{"name":"Skiftappen Premium - År"}'
```

### 2.4 Konfigurera webhooks
1. Gå till Stripe Dashboard > Developers > Webhooks
2. Lägg till endpoint: `https://your-domain.com/api/webhook`
3. Välj events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`

## 🔧 Steg 3: Environment Variables

Kopiera `.env.example` till `.env.local` och fyll i dina värden:

```bash
cp .env.example .env.local
```

Fyll i följande värden:
- `NEXT_PUBLIC_SUPABASE_URL`: Din Supabase projekt-URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Din Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Din Supabase service role key
- `STRIPE_PUBLISHABLE_KEY`: Din Stripe publishable key
- `STRIPE_SECRET_KEY`: Din Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Din webhook signing secret
- `NEXT_PUBLIC_APP_URL`: Din app-URL

## 🚀 Steg 4: Deploy API Endpoints

### 4.1 Next.js API Routes
API-endpoints finns i `/api/` mappen:
- `webhook.js` - Hanterar Stripe webhooks
- `create-checkout-session.js` - Skapar checkout sessions

### 4.2 Deploy till Vercel/Netlify
```bash
# För Vercel
npm install -g vercel
vercel

# För Netlify
npm install -g netlify-cli
netlify deploy
```

## 📱 Steg 5: React Native Integration

### 5.1 Användning av komponenter

```tsx
// Visa prenumerationsskärm
import { router } from 'expo-router';

const handleUpgrade = () => {
  router.push('/subscription');
};

// Använda premium-lås
import PremiumLock from '../components/PremiumLock';

<PremiumLock 
  feature="Avancerad statistik"
  description="Se detaljerad statistik över dina arbetstimmar"
>
  <StatisticsComponent />
</PremiumLock>

// Visa reklam för icke-premium användare
import { BottomAd, InlineAd } from '../components/AdBanner';

// I botten av skärmen
<BottomAd />

// Mellan innehåll
<InlineAd style={{ marginVertical: 20 }} />
```

### 5.2 Använda Premium Context

```tsx
import { usePremium } from '../context/PremiumContext';

function MyComponent() {
  const { isPremium, subscription, trialDaysLeft } = usePremium();

  if (!isPremium) {
    return <UpgradePrompt />;
  }

  return <PremiumFeature />;
}
```

## 🧪 Steg 6: Testing

### 6.1 Stripe Test Cards
```
Successful payment: 4242 4242 4242 4242
Declined payment: 4000 0000 0000 0002
Requires authentication: 4000 0025 0000 3155
```

### 6.2 Webhook Testing
```bash
# Installera Stripe CLI
stripe listen --forward-to localhost:3000/api/webhook

# Testa webhook
stripe trigger checkout.session.completed
```

## 🔒 Steg 7: Säkerhet

### 7.1 Validera webhooks
Webhooks valideras automatiskt med `stripe.webhooks.constructEvent()`.

### 7.2 RLS Policies
Supabase RLS policies säkerställer att användare bara kan se sina egna prenumerationer.

### 7.3 Environment Variables
Håll känsliga nycklar i environment variables, aldrig i kod.

## 📊 Steg 8: Monitoring

### 8.1 Stripe Dashboard
Övervaka betalningar, prenumerationer och webhooks i Stripe Dashboard.

### 8.2 Supabase Dashboard
Övervaka databas och real-time subscriptions i Supabase Dashboard.

### 8.3 Logs
Kontrollera server-logs för webhook-fel och betalningsproblem.

## 🎯 Funktioner som ingår

### ✅ Implementerat
- [x] Stripe integration med Apple Pay/Google Pay
- [x] Supabase databas för prenumerationer
- [x] Premium context för React Native
- [x] Premium-lås komponenter
- [x] Reklamkomponenter för icke-premium
- [x] 7 dagars gratis trial
- [x] Real-time prenumerationsuppdateringar
- [x] Webhook hantering för betalningar
- [x] Svenska priser (SEK)
- [x] Responsive UI design

### 📋 Nästa steg
- [ ] E-postnotiser för skift (premium-funktion)
- [ ] Exportera till kalender (premium-funktion)
- [ ] Avancerad statistik (premium-funktion)
- [ ] Push-notiser för prenumerationsstatus
- [ ] Prenumerationshantering i inställningar
- [ ] Fakturahistorik
- [ ] Rabattkoder och kampanjer

## 🆘 Troubleshooting

### Problem: Webhook får 400-fel
**Lösning**: Kontrollera att `STRIPE_WEBHOOK_SECRET` är korrekt inställd.

### Problem: Prenumeration aktiveras inte
**Lösning**: Kontrollera att `user_id` skickas korrekt i metadata.

### Problem: Apple Pay/Google Pay fungerar inte
**Lösning**: Kontrollera att `STRIPE_PAYMENT_METHOD_CONFIG_ID` är inställd.

### Problem: Trial skapas inte automatiskt
**Lösning**: Kontrollera att `PremiumProvider` är korrekt implementerad.

## 📞 Support

För frågor och support:
- Stripe dokumentation: https://stripe.com/docs
- Supabase dokumentation: https://supabase.com/docs
- React Native dokumentation: https://reactnative.dev/docs