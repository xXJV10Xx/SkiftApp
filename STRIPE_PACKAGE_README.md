# 🧩 Stripe Payment Package för Skiftappen

Ett komplett, produktionsklart paket för att integrera Stripe-betalningar i din React Native-app med Supabase-backend.

## ✨ Funktioner

- **💳 Prenumerationer**: Månadsvis (39 kr), Halvår (108 kr), Årlig (205 kr)
- **📅 Kalenderexport**: Engångsköp (99 kr) för .ics-export
- **🆓 Gratis trial**: 7 dagar med alla funktioner
- **🔄 Webhook-hantering**: Automatisk uppdatering av användarprofiler
- **📱 React Native-komponenter**: Redo att användas
- **🎨 Modern UI**: Responsiv design med ThemedComponents
- **🔒 Säkerhet**: GDPR-kompatibel, krypterad datahantering

## 📦 Paketinnehåll

```
├── 🌐 Backend (API)
│   ├── create-checkout-session.js    # Stripe checkout-session
│   └── stripe-webhook.js             # Webhook för betalningar
│
├── 🗄️ Databas
│   └── subscription_schema.sql       # Supabase-schema
│
├── 📱 Frontend (React Native)
│   ├── SubscriptionScreen.tsx        # Prenumerationsskärm
│   ├── CalendarExport.tsx            # Export-funktionalitet
│   └── useSubscription.ts            # Prenumerations-hook
│
└── 📚 Dokumentation
    ├── STRIPE_SETUP_GUIDE.md         # Stripe-konfiguration
    ├── STRIPE_INTEGRATION_GUIDE.md   # Integrations-guide
    └── .env.example                  # Miljövariabler
```

## 🚀 Snabbstart

### 1. Installation

```bash
# Installera dependencies
npm install stripe @stripe/stripe-react-native @supabase/auth-helpers-react expo-web-browser expo-file-system expo-sharing micro

# Uppdatera package.json (redan gjort i detta paket)
```

### 2. Databas-setup

Kör i Supabase SQL-editor:

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_paid_export BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ DEFAULT now();
```

### 3. Miljövariabler

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLIENT_URL=https://your-app.com
```

### 4. Använd komponenter

```tsx
import SubscriptionScreen from './components/SubscriptionScreen';
import { useSubscription } from './hooks/useSubscription';

function App() {
  const { subscriptionStatus } = useSubscription();
  
  return (
    <View>
      <SubscriptionScreen />
      {subscriptionStatus.hasExportAccess && <CalendarExport />}
    </View>
  );
}
```

## 💰 Prissättning

| 📋 Plan | 💰 Pris | 📝 Beskrivning |
|---------|----------|----------------|
| 🆓 Trial | Gratis | 7 dagar, alla funktioner |
| 📅 Månadsvis | 39 kr/mån | Ingen bindning |
| 💎 Halvår | 108 kr | Spara 126 kr (6 mån) |
| 🏆 Årlig | 205 kr/år | Spara 263 kr - Bäst! |
| 📤 Export | 99 kr | Engångsköp |

## 🎯 Användningsscenarier

### Premium-funktioner
```tsx
const { checkPremiumAccess } = useSubscription();

const handlePremiumFeature = () => {
  if (checkPremiumAccess()) {
    // Utför premium-funktion
  }
  // Annars visas automatisk popup för prenumeration
};
```

### Reklam för gratisanvändare
```tsx
const { showAdIfNeeded } = useSubscription();

useEffect(() => {
  const shouldShowAd = showAdIfNeeded();
  // Returnerar true om reklam visades
}, []);
```

### Kalenderexport
```tsx
<CalendarExport 
  shifts={userShifts} 
  companyName="ICA Maxi Malmö" 
/>
```

## 🛠️ Teknisk arkitektur

### Backend Flow
```
1. Frontend → API → Stripe Checkout
2. Användare betalar
3. Stripe → Webhook → Supabase
4. Frontend uppdateras automatiskt
```

### Säkerhet
- ✅ Webhook-signaturvalidering
- ✅ HTTPS-only endpoints
- ✅ Miljövariabler för API-nycklar
- ✅ Input-validering
- ✅ GDPR-kompatibel

## 🧪 Testing

### Test-kortnummer
- **✅ Lyckad**: 4242 4242 4242 4242
- **❌ Misslyckad**: 4000 0000 0000 0002
- **🔐 3D Secure**: 4000 0025 0000 3155

### Test-scenario
1. Skapa testkonto
2. Testa 7-dagars trial
3. Köp prenumeration
4. Köp export
5. Verifiera webhook

## 📊 Monitoring

### Viktiga metriker
- 📈 Konverteringsgrad (trial → betald)
- 📉 Churn rate
- 💳 Betalningsframgång
- 🔄 Webhook-prestanda

## 🚨 Troubleshooting

### Vanliga problem

**Webhook fungerar inte**
```bash
# Testa lokalt med ngrok
ngrok http 3000
```

**Betalning skapas inte**
- Kontrollera API-nycklar
- Verifiera webhook-signatur
- Kolla databasanslutning

**Export fungerar inte**
- Kontrollera filbehörigheter
- Verifiera .ics-format
- Testa med färre skift

## 📋 Deployment Checklist

### Före produktion
- [ ] Stripe live-nycklar
- [ ] SSL-certifikat
- [ ] Webhook-endpoints
- [ ] Databas-backup
- [ ] Monitoring-setup
- [ ] Juridiska sidor

## 🔮 Roadmap

### Nästa funktioner
- 🔄 In-app prenumerationshantering
- 📧 E-postnotifikationer
- 🎯 A/B-testning av priser
- 📊 Detaljerad analytics
- 🌍 Fler valutor och språk

### Tekniska förbättringar
- ⚡ Offline-support
- 📲 Push-notifikationer
- 🔄 Automatisk backup
- 🚀 Prestanda-optimering

## 📞 Support

### Dokumentation
- 📖 [Stripe Setup Guide](./STRIPE_SETUP_GUIDE.md)
- 🔧 [Integration Guide](./STRIPE_INTEGRATION_GUIDE.md)
- 🌐 [Stripe Documentation](https://stripe.com/docs)

### Kontakt
- 📧 E-post: support@skiftappen.se
- 💬 Discord: Skiftappen Community
- 🐛 Issues: GitHub Issues

## 📄 Licens

Detta paket är skapat specifikt för Skiftappen och innehåller produktionsklar kod för Stripe-integration.

---

## 🎉 Slutsats

Detta paket ger dig allt du behöver för att implementera betalningar i din app:

✅ **Komplett backend** med Stripe + Supabase  
✅ **Färdiga React Native-komponenter**  
✅ **Säker webhook-hantering**  
✅ **7-dagars gratis trial**  
✅ **Kalenderexport-funktionalitet**  
✅ **Produktionsklar kod**  
✅ **Omfattande dokumentation**  

**Klistra in koden i Cursor/Loveable och börja ta betalt redan idag! 🚀**

*Skapad med ❤️ för Skiftappen-communityn*