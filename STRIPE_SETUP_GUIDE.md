# Stripe Setup Guide för Skiftappen

## 1. Skapa Stripe-konto

1. Gå till [stripe.com](https://stripe.com) och skapa ett konto
2. Verifiera ditt företag/identitet (krävs för att ta emot betalningar)
3. Aktivera betalningsmetoder: Kort, Apple Pay, Google Pay

## 2. Hämta API-nycklar

### Test-miljö
1. Gå till **Developers > API keys** i Stripe Dashboard
2. Kopiera:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

### Produktion
1. Aktivera "Live mode" i Stripe Dashboard
2. Hämta live-nycklar (pk_live_... och sk_live_...)

## 3. Konfigurera Webhooks

1. Gå till **Developers > Webhooks** i Stripe Dashboard
2. Klicka "Add endpoint"
3. URL: `https://your-domain.com/api/stripe-webhook`
4. Välj events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Kopiera **Signing secret** (whsec_...)

## 4. Miljövariabler

Lägg till i din `.env`-fil:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=https://your-domain.com
```

## 5. Testa betalningar

### Test-kortnummer (endast i test-miljö):
- **Lyckad betalning**: 4242 4242 4242 4242
- **Misslyckad betalning**: 4000 0000 0000 0002
- **Kräver 3D Secure**: 4000 0025 0000 3155

### Test-datum: Vilket som helst framtida datum
### Test-CVC: Vilka 3 siffror som helst

## 6. Produktionskonfiguration

### Innan du går live:
1. ✅ Verifiera företagsinformation
2. ✅ Konfigurera skattehantering
3. ✅ Sätt upp automatiska utbetalningar
4. ✅ Testa webhook-endpoints
5. ✅ Uppdatera till live API-nycklar

### Säkerhet:
- Använd HTTPS för alla webhook-endpoints
- Validera webhook-signaturer
- Lagra API-nycklar säkert (miljövariabler)
- Logga alla transaktioner

## 7. Priser och valutor

Aktuella priser (i öre för SEK):
- **Månatlig**: 3900 (39 kr)
- **Halvår**: 10800 (108 kr)
- **Årlig**: 20500 (205 kr)
- **Export**: 9900 (99 kr)

## 8. Hantera prenumerationer

### Avbryta prenumeration:
```javascript
const subscription = await stripe.subscriptions.update(
  'sub_xxx',
  { cancel_at_period_end: true }
);
```

### Ändra prenumerationsplan:
```javascript
const subscription = await stripe.subscriptions.update(
  'sub_xxx',
  {
    items: [{
      id: subscription.items.data[0].id,
      price: 'new_price_id',
    }]
  }
);
```

## 9. Monitoring och support

### Dashboard:
- Övervaka betalningar i Stripe Dashboard
- Sätt upp notifikationer för misslyckade betalningar
- Granska dispute/chargeback-ärenden

### Logs:
- Logga alla webhook-events
- Spara transaktionshistorik i databasen
- Övervaka fel och timeout

## 10. Juridiska krav

### GDPR/Integritet:
- Informera användare om datahantering
- Tillåt användare att radera sin data
- Hantera rätten att bli glömd

### Avtalsvillkor:
- Tydliga prenumerationsvillkor
- Återbetalningspolicy
- Avbokningsregler

## Troubleshooting

### Vanliga problem:

**Webhook fungerar inte:**
- Kontrollera URL är tillgänglig från internet
- Verifiera webhook-signatur
- Kolla att rätt events är aktiverade

**Betalning misslyckas:**
- Kontrollera API-nycklar
- Verifiera att belopp är i rätt format (öre)
- Testa med test-kortnummer

**Prenumeration skapas inte:**
- Kontrollera metadata skickas korrekt
- Verifiera databas-uppdatering i webhook
- Kolla att user_id existerar

### Support:
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Discord/Slack communities för utvecklare