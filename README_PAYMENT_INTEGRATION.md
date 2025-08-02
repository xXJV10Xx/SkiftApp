# Payment Integration - Skiftappen

## Översikt

Detta dokument beskriver den kompletta betalningsintegration som implementerats i Skiftappen med stöd för Stripe, Apple Pay och Google Pay. Systemet inkluderar prenumerationshantering, betalningshistorik, fakturering och exportfunktionalitet.

## Funktioner

### ✅ Implementerade funktioner

- **Stripe Integration**: Fullständig Stripe-integration för kortbetalningar
- **Apple Pay**: Säker betalning med Apple Pay på iOS-enheter
- **Google Pay**: Google Pay-integration för Android-enheter
- **Prenumerationshantering**: Skapa, uppdatera och avsluta prenumerationer
- **Betalningshistorik**: Visa och filtrera alla betalningar
- **Fakturering**: Automatisk fakturagenerering och hantering
- **Export**: Exportera betalningsdata i CSV, JSON och PDF-format
- **Säkerhet**: SSL-kryptering och säker datahantering via Supabase

### 📋 Prenumerationsplaner

1. **Starter** - 99 SEK/månad
   - Upp till 10 anställda
   - Grundläggande schemaläggning
   - Chattfunktion
   - Mobilapp
   - Email support

2. **Professional** - 199 SEK/månad (Populär)
   - Upp till 50 anställda
   - Avancerad schemaläggning
   - Chattfunktion
   - Rapporter och analys
   - Mobilapp
   - Prioriterad support

3. **Enterprise** - 399 SEK/månad
   - Obegränsat antal anställda
   - Avancerad schemaläggning
   - Chattfunktion
   - Rapporter och analys
   - API-åtkomst
   - Anpassade integrationer
   - Dedikerad support

## Teknisk arkitektur

### Databas (Supabase)

Nya tabeller för betalningshantering:

```sql
-- Prenumerationer
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  stripe_subscription_id TEXT,
  plan_name TEXT NOT NULL,
  plan_price INTEGER NOT NULL,
  billing_period TEXT NOT NULL,
  employee_limit INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Betalningar
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SEK',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  description TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Betalningsmetoder
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  stripe_payment_method_id TEXT,
  type TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fakturor
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_invoice_id TEXT,
  invoice_number TEXT NOT NULL,
  amount_due INTEGER NOT NULL,
  amount_paid INTEGER DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SEK',
  status TEXT NOT NULL DEFAULT 'draft',
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Komponenter

#### PaymentCard
Huvudkomponent för betalningar som stöder alla tre betalningsmetoder:
- Kortinmatning med Stripe CardField
- Apple Pay-integration
- Google Pay-integration
- Automatisk detektering av tillgängliga betalningsmetoder

#### SubscriptionPlanCard
Visar prenumerationsplaner med:
- Prisvisning
- Funktionslista
- Populär-märkning
- Nuvarande plan-indikering

#### Skärmar
- `subscription.tsx`: Huvudskärm för prenumerationshantering
- `payments/history.tsx`: Betalningshistorik med filtrering och export

### Services

#### PaymentService
Centraliserad service för alla betalningsoperationer:
- Prenumerationshantering
- Betalningsprocessing
- Statistik och rapporter
- Export-funktionalitet

#### Stripe Configuration
Konfiguration för alla Stripe-relaterade funktioner:
- Initialisering
- Betalningsintents
- Prenumerationer
- Betalningsmetoder

## Installation och konfiguration

### 1. Miljövariabler

Lägg till följande i din `.env`-fil:

```env
# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_STRIPE_MERCHANT_ID=merchant.com.skiftappen.app

# API
EXPO_PUBLIC_API_URL=https://your-api-url.com

# Supabase (redan konfigurerat)
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Dependencies

Alla nödvändiga dependencies är redan installerade:

```json
{
  "@stripe/stripe-react-native": "^0.37.2",
  "stripe": "^14.15.0",
  "react-native-payments": "^0.7.0",
  "expo-apple-authentication": "^6.4.2"
}
```

### 3. iOS-konfiguration

Apple Pay kräver:
- Apple Developer Account
- Merchant ID registrering
- Entitlements konfiguration (redan gjort i app.json)

### 4. Android-konfiguration

Google Pay kräver:
- Google Pay API aktivering
- Merchant registrering
- Permissions konfiguration (redan gjort i app.json)

## Användning

### Prenumerationshantering

```typescript
import { paymentService } from '../lib/payment-service';

// Skapa prenumeration
const subscription = await paymentService.createCompanySubscription(
  companyId,
  planId,
  paymentMethodId
);

// Uppdatera prenumeration
await paymentService.updateCompanySubscription(
  subscriptionId,
  newPlanId
);

// Avsluta prenumeration
await paymentService.cancelCompanySubscription(subscriptionId);
```

### Betalningsprocessing

```typescript
// Processera betalning
const payment = await paymentService.processPayment(
  companyId,
  amount,
  currency,
  paymentMethod,
  description
);
```

### Export av data

```typescript
// Exportera betalningsdata
const csvData = await paymentService.exportPaymentData(
  companyId,
  'csv',
  dateFrom,
  dateTo
);
```

## Säkerhet

### Implementerade säkerhetsåtgärder

1. **SSL/TLS-kryptering**: All kommunikation är krypterad
2. **Stripe Security**: PCI DSS-kompatibel betalningshantering
3. **Apple Pay Security**: Säker autentisering med Touch ID/Face ID
4. **Google Pay Security**: Tokeniserade betalningar
5. **Supabase RLS**: Row Level Security för databas
6. **Environment Variables**: Känslig data i miljövariabler

### Rekommendationer

- Använd alltid HTTPS i produktion
- Implementera rate limiting för API-anrop
- Logga alla betalningsaktiviteter
- Regelbunden säkerhetsgenomgång
- Backup av betalningsdata

## Testing

### Stripe Test Cards

```
Visa: 4242424242424242
Mastercard: 5555555555554444
American Express: 378282246310005
Declined: 4000000000000002
```

### Apple Pay Testing

- Använd iOS Simulator med test Apple ID
- Lägg till testkort i Wallet

### Google Pay Testing

- Använd Android Emulator
- Konfigurera test Google Pay-konto

## Deployment

### Produktionschecklista

- [ ] Uppdatera Stripe keys till production
- [ ] Konfigurera Apple Pay merchant ID
- [ ] Aktivera Google Pay production API
- [ ] Sätt upp webhooks för Stripe
- [ ] Konfigurera monitoring och alerts
- [ ] Testa alla betalningsflöden
- [ ] Backup-strategi för betalningsdata

### Environment-specifik konfiguration

```typescript
// lib/config.ts
export const CONFIG = {
  STRIPE_PUBLISHABLE_KEY: __DEV__ 
    ? process.env.EXPO_PUBLIC_STRIPE_TEST_KEY
    : process.env.EXPO_PUBLIC_STRIPE_LIVE_KEY,
  API_URL: __DEV__
    ? 'http://localhost:3000'
    : 'https://api.skiftappen.com'
};
```

## Monitoring och Analytics

### Implementerade metrics

- Betalningsframgång/misslyckanden
- Prenumerationskonvertering
- Genomsnittligt betalningsbelopp
- Populära betalningsmetoder
- Churn rate

### Rekommenderade verktyg

- Stripe Dashboard för betalningsövervakning
- Supabase Analytics för databasstatistik
- Sentry för felrapportering
- Google Analytics för användaranalys

## Support och underhåll

### Vanliga problem

1. **Apple Pay fungerar inte**: Kontrollera merchant ID och entitlements
2. **Google Pay inte tillgänglig**: Verifiera API-konfiguration
3. **Stripe fel**: Kontrollera API-nycklar och webhooks
4. **Databas fel**: Verifiera Supabase-anslutning

### Loggning

```typescript
// Implementera strukturerad loggning
console.log('[PAYMENT]', {
  action: 'payment_initiated',
  companyId,
  amount,
  method: paymentMethod,
  timestamp: new Date().toISOString()
});
```

## Framtida förbättringar

### Planerade funktioner

- [ ] Automatisk fakturering via email
- [ ] Rabattkoder och kampanjer
- [ ] Flera valutor
- [ ] Återbetalningshantering
- [ ] Avancerad rapportering
- [ ] API för tredjepartsintegrationer
- [ ] Mobil kvittohantering
- [ ] Påminnelser för förfallna betalningar

### Tekniska förbättringar

- [ ] Offline-stöd för betalningsdata
- [ ] Real-time betalningsuppdateringar
- [ ] Avancerad caching
- [ ] Performance-optimering
- [ ] A/B-testning av betalningsflöden

## Kontakt

För teknisk support eller frågor om betalningsintegration:
- Email: tech@skiftappen.com
- Dokumentation: https://docs.skiftappen.com
- GitHub Issues: https://github.com/skiftappen/issues

---

*Denna dokumentation uppdaterades senast: 2024-12-19*