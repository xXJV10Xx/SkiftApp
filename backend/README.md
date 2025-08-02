# Stripe Backend Server

## Setup

1. Sätt dina Stripe-nycklar i `.env` filen i root-mappen:
```
STRIPE_PUBLISHABLE_KEY=pk_test_xxxx
STRIPE_SECRET_KEY=sk_test_xxxx
```

2. Installera beroenden (redan gjort):
```bash
npm install
```

## Starta servern

Från root-mappen:
```bash
./start-backend.sh
```

Eller manuellt:
```bash
cd backend
node server.js
```

Servern körs på port 4242.

## Endpoints

- `POST /create-payment-intent` - Skapar en betalningsintention för 99 SEK