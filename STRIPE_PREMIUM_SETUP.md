# 🚀 Stripe Premium Setup - Skiftappen

Komplett implementering av Stripe-baserat premiumsystem för Skiftappen.

## 📋 Vad som ingår

### ✅ Grundläggande Stripe-integration
- **`/api/create-checkout.js`** - Skapar Stripe checkout-sessioner
- **`/api/stripe-webhook.js`** - Hanterar betalningsbekräftelser
- **`/components/BuyPremium.js`** - Köp-knapp för frontend

### ✅ Extra funktioner
- **💌 E-postbekräftelse** - Automatiska välkomstmail efter köp
- **📩 Premium Popup** - Smart popup som visas för icke-premium användare
- **🔒 UI-låsning** - Komponenter som låser funktioner baserat på premium-status

## 🛠 Installation & Setup

### 1. Miljövariabler
Lägg till dessa i din `.env`-fil:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# E-post (valfritt - för SendGrid)
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@yourapp.com

# Andra
CLIENT_URL=http://localhost:3000
```

### 2. Supabase-databas
Lägg till `is_premium` kolumn i din users-tabell:

```sql
ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
```

### 3. Stripe Webhook
1. Gå till Stripe Dashboard → Webhooks
2. Lägg till endpoint: `https://yourapp.com/api/stripe-webhook`
3. Välj event: `checkout.session.completed`
4. Kopiera webhook secret till `STRIPE_WEBHOOK_SECRET`

### 4. NPM-paket
Installera nödvändiga paket:

```bash
npm install stripe @sendgrid/mail micro
```

## 🎯 Användning

### Grundläggande köp-knapp
```jsx
import BuyPremium from './components/BuyPremium';

function MyComponent() {
  return <BuyPremium />;
}
```

### Premium-låst innehåll
```jsx
import PremiumGate from './components/PremiumGate';

function CalendarExport() {
  return (
    <PremiumGate feature="Kalenderexport">
      <div>
        {/* Detta innehåll visas bara för premium-användare */}
        <button>Exportera till kalender</button>
      </div>
    </PremiumGate>
  );
}
```

### Anpassat låst innehåll
```jsx
import PremiumGate from './components/PremiumGate';
import BuyPremium from './components/BuyPremium';

function Notifications() {
  return (
    <PremiumGate 
      feature="Påminnelser"
      fallback={
        <div className="text-center p-4">
          <h3>🔔 Påminnelser kräver Premium</h3>
          <BuyPremium />
        </div>
      }
    >
      <div>
        {/* Premium-innehåll här */}
      </div>
    </PremiumGate>
  );
}
```

### Premium-status hook
```jsx
import { usePremium } from './components/PremiumGate';

function MyComponent() {
  const { isPremium, loading } = usePremium();
  
  if (loading) return <div>Laddar...</div>;
  
  return (
    <div>
      {isPremium ? (
        <div>✨ Premium-innehåll</div>
      ) : (
        <div>📢 Reklam här</div>
      )}
    </div>
  );
}
```

### Automatisk popup
```jsx
import PremiumPopup from './components/PremiumPopup';

function App() {
  return (
    <div>
      <PremiumPopup /> {/* Visas automatiskt för icke-premium */}
      {/* Resten av din app */}
    </div>
  );
}
```

## 📧 E-postbekräftelser

E-postbekräftelser skickas automatiskt via webhook när betalning genomförs.

### Anpassa e-postmall
Redigera HTML-mallen i `api/stripe-webhook.js`:

```javascript
html: \`
  <div style="font-family: Arial, sans-serif;">
    <h2>Välkommen till Premium!</h2>
    <!-- Din anpassade mall här -->
  </div>
\`
```

### Byt e-posttjänst
Standardimplementeringen använder SendGrid. För att byta:

1. Redigera `/api/send-email.js`
2. Byt ut SendGrid-koden mot din tjänst (Mailgun, AWS SES, etc.)

## 🎨 Anpassning

### Ändra pris
I `/api/create-checkout.js`:

```javascript
unit_amount: 9900, // 99.00 SEK (i ören)
```

### Ändra valuta
```javascript
currency: 'sek', // eller 'usd', 'eur', etc.
```

### Anpassa popup-timing
I `/components/PremiumPopup.js`:

```javascript
setTimeout(() => setShowPopup(true), 5000); // 5 sekunder
```

```javascript
if (count < 3) { // Max 3 gånger per dag
```

## 🔧 Felsökning

### Webhook fungerar inte
1. Kontrollera att `STRIPE_WEBHOOK_SECRET` är korrekt
2. Testa webhook med Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe-webhook`

### E-post skickas inte
1. Kontrollera `SENDGRID_API_KEY` och `FROM_EMAIL`
2. Verifiera din avsändaradress i SendGrid
3. Kolla server-loggar för felmeddelanden

### Premium-status uppdateras inte
1. Kontrollera Supabase-anslutning
2. Verifiera att `is_premium` kolumnen finns
3. Kontrollera att `user_id` skickas korrekt i metadata

## 📱 Testning

### Testbetalningar
Använd Stripes testkort:
- **Lyckat kort:** `4242 4242 4242 4242`
- **Misslyckat kort:** `4000 0000 0000 0002`

### Testa webhook lokalt
```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
stripe trigger checkout.session.completed
```

## 🚀 Deployment

### Vercel
1. Lägg till miljövariabler i Vercel Dashboard
2. Uppdatera `CLIENT_URL` till din produktions-URL
3. Uppdatera Stripe webhook-URL

### Andra plattformar
Samma principer gäller - se till att alla miljövariabler är konfigurerade.

## 📊 Funktioner

| Funktion | Status | Beskrivning |
|----------|--------|-------------|
| ✅ Stripe Checkout | Klar | Säker betalning med kort, Google Pay, Apple Pay |
| ✅ Webhook | Klar | Automatisk premium-aktivering |
| ✅ E-postbekräftelse | Klar | Välkomstmail efter köp |
| ✅ Premium Popup | Klar | Smart marknadsföring för icke-premium |
| ✅ UI-låsning | Klar | Flexibel komponent för att låsa funktioner |
| ✅ Premium Hook | Klar | Enkel status-kontroll i komponenter |

## 🎉 Resultat

När allt är uppsatt får du:
- 💳 **Direktbetalning** via Stripe (kort, Google Pay, Apple Pay)
- 🔄 **Automatisk aktivering** - `is_premium = true` i Supabase
- 📧 **E-postbekräftelse** till kunden
- 🚫 **Reklamfri upplevelse** för premium-användare
- 🔒 **Låsta funktioner** som lockar till uppgradering
- 📊 **Flexibel premium-kontroll** i hela appen

Total implementeringstid: **~30 minuter** ⚡