# 📊 Kalenderexport Implementation Guide

## Översikt
Implementering av betalfunktionalitet för kalenderexport med Stripe och e-postbekräftelser.

## 🚀 Funktioner

### ✅ Implementerat
- **Stripe Checkout**: Säker betalning för export-åtkomst (99 SEK)
- **Export-flagga**: Databas-spårning av betalda användare
- **ICS-generering**: Automatisk export av skiftschema till kalenderformat
- **E-postbekräftelser**: Automatiska bekräftelser vid lyckad betalning
- **Webhook-hantering**: Säker uppdatering av användarstatus
- **UI-låsning**: Visuell indikation av export-status

## 📁 Filstruktur

```
components/
├── CalendarToolbar.jsx          # Toolbar med export-knapp
screens/
├── Calendar.jsx                 # Huvudkalender med export-logik
app/
├── export-success.jsx           # Success-sida efter betalning
├── api/
│   ├── create-export-session.js # Stripe checkout session
│   ├── stripe-webhook.js        # Webhook-hantering
│   ├── check-export-access.js   # Kontrollera export-åtkomst
│   └── generate-export.js       # ICS-filgenerering
lib/
├── stripeExport.js             # Export-funktioner
database/
└── migrations/
    └── add_export_columns.sql   # Databas-migration
```

## 🔧 Setup-instruktioner

### 1. Databas-migration
Kör SQL-filen i Supabase SQL Editor:
```bash
database/migrations/add_export_columns.sql
```

### 2. Miljövariabler
Kopiera `.env.example` till `.env` och fyll i värdena:
```bash
cp .env.example .env
```

### 3. Stripe-konfiguration
1. Skapa Stripe-konto på https://stripe.com
2. Hämta API-nycklar från Dashboard
3. Konfigurera webhook-endpoint: `/api/stripe-webhook`
4. Lägg till webhook-events: `checkout.session.completed`

### 4. E-postkonfiguration
För Gmail:
1. Aktivera 2FA på Google-kontot
2. Generera App Password
3. Använd App Password som `SMTP_PASS`

## 🔄 Flöde

### Betalningsflöde:
1. Användare klickar "Exportera kalender (99 kr)"
2. Redirect till Stripe Checkout
3. Efter lyckad betalning → webhook aktiveras
4. Databas uppdateras med `has_paid_export = true`
5. E-postbekräftelse skickas
6. Användare redirectas till success-sida

### Export-flöde:
1. Kontrollera `has_paid_export` status
2. Om betald → generera ICS-fil direkt
3. Om ej betald → visa betalningsalternativ

## 🛡️ Säkerhet

- **Webhook-verifiering**: Stripe-signatur valideras
- **RLS-policies**: Supabase Row Level Security
- **Input-validering**: Alla API-endpoints validerar input
- **Error-hantering**: Omfattande felhantering

## 📧 E-postmallar

E-postbekräftelser skickas automatiskt med:
- Bekräftelse av köp
- Transaktions-ID
- Instruktioner för export

## 🧪 Testning

### Stripe Test Mode:
- Använd test-nycklar (`pk_test_` och `sk_test_`)
- Testkort: `4242 4242 4242 4242`
- Datum: Framtida datum
- CVC: Valfri 3-siffrigt nummer

### Webhook-testning:
```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

## 🚀 Deployment

1. **Miljövariabler**: Sätt production-värden
2. **Stripe**: Byt till live-nycklar
3. **Webhook**: Uppdatera endpoint-URL
4. **SMTP**: Konfigurera production e-postserver

## 📊 Prissättning

- **Export-åtkomst**: 99 SEK (engångsbetalning)
- **Stripe-avgift**: ~3% + 1.80 SEK per transaktion
- **Netto**: ~94 SEK per försäljning

## 🔍 Felsökning

### Vanliga problem:
- **Webhook 400**: Kontrollera webhook-secret
- **E-post fungerar inte**: Verifiera SMTP-inställningar
- **Export misslyckas**: Kontrollera användarstatus i databas

### Loggar:
- Stripe Dashboard för betalningsloggar
- Supabase Logs för databas-fel
- Server-loggar för webhook-händelser

## 📈 Framtida förbättringar

- **Prenumerationsmodell**: Månadsvis betalning
- **Team-export**: Export för hela team
- **Anpassade format**: PDF, Excel-export
- **Automatisk synkronisering**: Direktintegration med externa kalendrar