# 💳 Stripe Integration Guide - Kalenderexport (99 SEK)

## 📋 Översikt

Denna guide beskriver hur du sätter upp Stripe-betalningar för kalenderexport-funktionen i Skiftappen.

## 🔧 1. Stripe Dashboard Setup

### Skapa Stripe-konto och konfigurera

1. **Gå till [Stripe Dashboard](https://dashboard.stripe.com/)**
2. **Skapa nytt konto** eller logga in
3. **Aktivera Test Mode** för utveckling

### Hämta API-nycklar

1. Gå till **Developers → API keys**
2. Kopiera:
   - **Publishable key** (börjar med `pk_test_`)
   - **Secret key** (börjar med `sk_test_`)

### Skapa Webhook Endpoint

1. Gå till **Developers → Webhooks**
2. Klicka **Add endpoint**
3. **Endpoint URL**: `https://dinapp.se/api/stripe-webhook`
4. **Events to send**:
   - `checkout.session.completed`
5. Kopiera **Webhook signing secret** (börjar med `whsec_`)

## 🔐 2. Miljövariabler

Skapa/uppdatera `.env`-filen:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_din_secret_key_här
STRIPE_WEBHOOK_SECRET=whsec_din_webhook_secret_här

# Supabase (för webhook)
SUPABASE_URL=https://fsefeherdbtsddqimjco.supabase.co
SUPABASE_SERVICE_ROLE_KEY=din_service_role_key_här

# App URL
EXPO_PUBLIC_APP_URL=https://dinapp.se
```

## 🗄️ 3. Supabase Database Update

Kör följande SQL i Supabase SQL Editor:

```sql
-- Lägg till calendar_export_paid kolumn till users-tabellen
ALTER TABLE users ADD COLUMN IF NOT EXISTS calendar_export_paid BOOLEAN DEFAULT FALSE;

-- Uppdatera befintliga användare (valfritt)
UPDATE users SET calendar_export_paid = FALSE WHERE calendar_export_paid IS NULL;
```

## 📁 4. API Endpoints

### `/api/checkout.js` - Skapa betalningssession
```javascript
// Redan implementerad - skapar Stripe Checkout session för 99 SEK
```

### `/api/stripe-webhook.js` - Webhook för betalningsbekräftelse
```javascript
// Redan implementerad - uppdaterar Supabase när betalning är klar
```

## 🎨 5. Frontend Integration

### Betalningsknapp-komponent

```javascript
import { supabase } from '../lib/supabase';

const PaymentButton = ({ user }) => {
  const handlePayment = async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  if (user.calendar_export_paid) {
    return <Text>✅ Kalenderexport är aktiverad</Text>;
  }

  return (
    <Button 
      onPress={handlePayment}
      title="Lås upp kalenderexport – 99 kr"
    />
  );
};
```

## 🧪 6. Testning

### Test Cards (Stripe Test Mode)

```
Successful payment: 4242 4242 4242 4242
Declined payment: 4000 0000 0000 0002
```

### Testa flödet

1. **Klicka på betalningsknappen**
2. **Fyll i testkort-info**
3. **Slutför betalning**
4. **Kontrollera Supabase** - `calendar_export_paid` ska vara `true`
5. **Verifiera webhook** i Stripe Dashboard → Webhooks → Logs

## 🚀 7. Production Setup

### Byt till Live Mode

1. **Stripe Dashboard** → Toggle till **Live mode**
2. **Uppdatera API keys** till live keys (`pk_live_` och `sk_live_`)
3. **Skapa ny webhook** för production URL
4. **Uppdatera miljövariabler** i production

### Säkerhet

- ✅ **Webhook signature verification** - implementerad
- ✅ **Environment variables** - säkra nycklar
- ✅ **HTTPS required** - för webhooks
- ✅ **Supabase RLS** - säker databasåtkomst

## 📊 8. Monitoring

### Stripe Dashboard
- **Payments** - se alla transaktioner
- **Webhooks** - övervaka webhook-anrop
- **Logs** - felsök problem

### Supabase Dashboard
- **Database** - kontrollera `users.calendar_export_paid`
- **Logs** - se webhook-uppdateringar

## ❓ 9. Troubleshooting

### Vanliga problem

**Webhook fungerar inte:**
- Kontrollera endpoint URL
- Verifiera webhook secret
- Kolla Stripe webhook logs

**Betalning går igenom men användare uppdateras inte:**
- Kontrollera Supabase service role key
- Verifiera user_id i metadata
- Kolla Supabase logs

**CORS-fel:**
- Lägg till domain i Stripe dashboard
- Kontrollera API endpoint konfiguration

## ✅ Status

- ✅ **Stripe Checkout** - 99 SEK betalning
- ✅ **Webhook integration** - automatisk uppdatering
- ✅ **Supabase integration** - `calendar_export_paid` kolumn
- ✅ **Error handling** - robust felhantering
- ✅ **Security** - webhook verification + RLS

**Nästa steg:** Implementera kalenderexport-funktionalitet (steg 2)