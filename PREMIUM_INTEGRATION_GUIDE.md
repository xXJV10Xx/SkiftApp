# 🎯 SkiftApp Premium Integration Guide

Komplett guide för att integrera Stripe-betalningar, premium-funktioner och popup-reklam i SkiftApp.

## 📋 Innehåll

1. [Server Setup](#server-setup)
2. [Supabase Setup](#supabase-setup)
3. [Frontend Integration](#frontend-integration)
4. [Testing](#testing)
5. [Deployment](#deployment)

## 🖥️ Server Setup

### 1. Installera Dependencies

```bash
cd server
npm install
```

### 2. Miljövariabler

Skapa `.env` i server-mappen:

```env
STRIPE_SECRET_KEY=sk_test_XXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXX
SUPABASE_URL=https://fsefeherdbtsddqimjco.supabase.co
SUPABASE_SERVICE_ROLE_KEY=DITT_SERVICE_ROLE_KEY
FRONTEND_URL=https://dinapp.se
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=din-email@gmail.com
EMAIL_PASS=ditt-app-lösenord
```

### 3. Starta Server

```bash
npm run dev
```

Servern körs på `http://localhost:4242`

## 🗄️ Supabase Setup

### 1. Kör SQL Schema

Kör innehållet i `server/supabase-schema.sql` i Supabase SQL Editor.

### 2. Verifiera Tabeller

Kontrollera att följande tabeller skapats:
- `users`
- `premium_features`
- `payments`

### 3. RLS Policies

Kontrollera att Row Level Security är aktiverad och policies är korrekt konfigurerade.

## 📱 Frontend Integration

### 1. Installera Dependencies

```bash
npm install @react-native-async-storage/async-storage expo-calendar expo-file-system expo-sharing expo-linear-gradient
```

### 2. Wrap App med PremiumProvider

```tsx
// App.tsx
import { PremiumProvider } from './components/PremiumProvider';

export default function App() {
  return (
    <PremiumProvider>
      {/* Din befintliga app */}
    </PremiumProvider>
  );
}
```

### 3. Använd Premium-komponenter

#### Låsa funktioner:

```tsx
import { PremiumGate } from './components/PremiumGate';

<PremiumGate
  feature="calendar_export"
  featureName="Kalenderexport"
  description="Exportera skift till kalender"
>
  <YourLockedComponent />
</PremiumGate>
```

#### Kalenderexport:

```tsx
import { CalendarExport } from './components/CalendarExport';

<CalendarExport
  shifts={yourShifts}
  onExportComplete={(success) => console.log('Export:', success)}
/>
```

#### Visa annonser manuellt:

```tsx
import { usePremium } from './components/PremiumProvider';

const { showAd } = usePremium();

// Visa premium-uppgradering
showAd('premium_upgrade');

// Visa feature-unlock för specifik funktion
showAd('feature_unlock', 'calendar_export');
```

## 🧪 Testing

### 1. Test Stripe Checkout

```bash
# Använd Stripe test cards
# Successful: 4242424242424242
# Declined: 4000000000000002
```

### 2. Test Webhook

```bash
# Använd Stripe CLI för att testa webhooks lokalt
stripe listen --forward-to localhost:4242/webhook
```

### 3. Test Premium Status

1. Genomför testköp
2. Kontrollera att `is_premium` uppdateras i Supabase
3. Verifiera att UI uppdateras automatiskt

## 🚀 Deployment

### 1. Server Deployment

#### Railway/Heroku:
```bash
# Sätt miljövariabler
# Deploya server
```

#### Vercel:
```bash
# Skapa vercel.json för serverless functions
# Deploya
```

### 2. Webhook URL

Uppdatera Stripe webhook URL till din produktions-server:
```
https://your-server.com/webhook
```

### 3. Frontend Environment

Uppdatera server URL i frontend:

```tsx
// I PremiumUpgradeModal.tsx
const response = await fetch('https://your-server.com/create-checkout-session', {
  // ...
});
```

## 🔧 Konfiguration

### Stripe Dashboard

1. **Products**: Skapa "SkiftApp Premium" produkt
2. **Webhooks**: Lägg till webhook för `checkout.session.completed`
3. **Payment Methods**: Aktivera Apple Pay & Google Pay

### Supabase Dashboard

1. **Database**: Verifiera tabeller och RLS
2. **API**: Hämta service role key
3. **Auth**: Konfigurera auth providers om nödvändigt

## 📊 Monitoring

### Server Logs

```bash
# Övervaka server-loggar
pm2 logs stripe-server

# Eller för development
npm run dev
```

### Stripe Dashboard

- Övervaka betalningar
- Kontrollera webhook-leveranser
- Analysera konverteringsstatistik

### Supabase Analytics

- Användartillväxt
- Premium-konvertering
- Funktionsanvändning

## 🐛 Troubleshooting

### Vanliga Problem

1. **Webhook Verification Failed**
   - Kontrollera webhook secret
   - Verifiera endpoint URL

2. **Premium Status Uppdateras Inte**
   - Kontrollera Supabase RLS policies
   - Verifiera real-time subscriptions

3. **Calendar Export Fungerar Inte**
   - Kontrollera app-behörigheter
   - Testa på olika enheter

### Debug Mode

Aktivera debug-läge i development:

```tsx
// Lägg till i början av din app
if (__DEV__) {
  console.log('Premium Debug Mode Enabled');
  // Visa extra logging
}
```

## 🎨 Anpassning

### Styling

Alla komponenter använder StyleSheet och kan anpassas:

```tsx
// Ändra färger i styles
const styles = StyleSheet.create({
  upgradeButton: {
    backgroundColor: '#your-color',
    // ...
  },
});
```

### Annonser

Anpassa annonsintervaller i `useAdManager.ts`:

```tsx
const AD_INTERVALS = {
  general: 3 * 60 * 1000, // 3 minuter istället för 5
  feature_unlock: 1 * 60 * 1000, // 1 minut istället för 2
  premium_upgrade: 5 * 60 * 1000, // 5 minuter istället för 10
};
```

## 📈 Analytics & Metrics

### Viktiga KPIs

1. **Conversion Rate**: Andel användare som uppgraderar
2. **ARPU**: Average Revenue Per User
3. **Feature Usage**: Vilka premium-funktioner används mest
4. **Ad Performance**: Click-through rate på annonser

### Tracking Events

```tsx
// Lägg till analytics tracking
const trackPremiumUpgrade = (userId: string) => {
  // Din analytics service
  analytics.track('Premium Upgrade', { userId });
};
```

## 🔐 Säkerhet

### Best Practices

1. **Webhook Verification**: Alltid verifiera Stripe webhooks
2. **Environment Variables**: Aldrig commit känslig data
3. **RLS Policies**: Korrekt konfigurerade Supabase policies
4. **HTTPS Only**: Använd endast HTTPS i produktion

### Security Checklist

- [ ] Webhook secrets konfigurerade
- [ ] Service role keys säkra
- [ ] RLS policies testade
- [ ] HTTPS aktiverat
- [ ] Error handling implementerat

## 📞 Support

### Dokumentation

- [Stripe Docs](https://stripe.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Expo Calendar](https://docs.expo.dev/versions/latest/sdk/calendar/)

### Community

- Stripe Discord
- Supabase Discord
- React Native Community

---

**🎉 Grattis! Du har nu ett komplett premium-system integrerat i SkiftApp!**

Systemet inkluderar:
- ✅ Stripe Checkout med Apple Pay & Google Pay
- ✅ Automatisk premium-aktivering via webhooks
- ✅ UI-låsning för premium-funktioner
- ✅ Smart popup-reklam system
- ✅ Kalenderexport till Google/Apple Calendar
- ✅ E-postbekräftelse efter köp
- ✅ Real-time premium status updates