# 🚀 SkiftApp Stripe Server

Node.js server för att hantera Stripe Checkout och webhooks för SkiftApp Premium.

## 🛠️ Setup

### 1. Installation

```bash
npm install
```

### 2. Environment Variables

Skapa `.env` fil:

```env
STRIPE_SECRET_KEY=sk_test_XXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXX
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=https://your-app.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Starta Server

```bash
# Development
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### POST /create-checkout-session

Skapar Stripe Checkout session.

**Request:**
```json
{
  "user_id": "uuid",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "session_id": "cs_..."
}
```

### POST /webhook

Stripe webhook endpoint för att hantera betalningar.

**Headers:**
- `stripe-signature`: Webhook signature

### GET /user/:userId/premium-status

Hämta användares premium-status.

**Response:**
```json
{
  "is_premium": true,
  "premium_activated_at": "2024-01-01T00:00:00Z"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🔧 Configuration

### Stripe

1. Skapa konto på [Stripe Dashboard](https://dashboard.stripe.com)
2. Hämta API keys från Developers > API keys
3. Skapa webhook för `checkout.session.completed`
4. Aktivera Apple Pay & Google Pay

### Supabase

1. Kör SQL schema från `supabase-schema.sql`
2. Hämta service role key från Settings > API
3. Konfigurera RLS policies

### Email

Gmail App Password:
1. Aktivera 2FA på Gmail
2. Generera App Password
3. Använd i EMAIL_PASS

## 🧪 Testing

### Stripe Test Cards

```
Success: 4242424242424242
Decline: 4000000000000002
3D Secure: 4000000000003220
```

### Webhook Testing

```bash
# Installera Stripe CLI
stripe listen --forward-to localhost:4242/webhook

# Test webhook
stripe trigger checkout.session.completed
```

## 🚀 Deployment

### Railway

```bash
# Anslut till Railway
railway login
railway init
railway add
railway deploy
```

### Heroku

```bash
# Skapa app
heroku create skiftapp-stripe

# Sätt env vars
heroku config:set STRIPE_SECRET_KEY=sk_...

# Deploy
git push heroku main
```

### Vercel

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "stripe-server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/stripe-server.js"
    }
  ]
}
```

## 📊 Monitoring

### Logs

```bash
# Development
npm run dev

# Production with PM2
pm2 start stripe-server.js --name "stripe-server"
pm2 logs stripe-server
```

### Health Check

```bash
curl http://localhost:4242/health
```

## 🔐 Security

### Best Practices

- ✅ Webhook signature verification
- ✅ Environment variables för secrets
- ✅ CORS konfiguration
- ✅ Error handling
- ✅ Request validation

### Production Checklist

- [ ] HTTPS aktiverat
- [ ] Environment variables säkra
- [ ] Webhook endpoint säker
- [ ] Error logging konfigurerat
- [ ] Rate limiting (om nödvändigt)

## 🐛 Troubleshooting

### Vanliga Problem

**Webhook Verification Failed:**
```
Error: Webhook signature verification failed
```
- Kontrollera STRIPE_WEBHOOK_SECRET
- Verifiera endpoint URL i Stripe Dashboard

**Supabase Connection Error:**
```
Error: Invalid API key
```
- Kontrollera SUPABASE_SERVICE_ROLE_KEY
- Verifiera Supabase URL

**Email Sending Failed:**
```
Error: Invalid login
```
- Kontrollera Gmail App Password
- Verifiera EMAIL_USER och EMAIL_PASS

### Debug Mode

```bash
# Sätt debug environment
DEBUG=* npm run dev
```

## 📈 Performance

### Optimizations

- Connection pooling för Supabase
- Error retry logic
- Request timeout handling
- Memory usage monitoring

### Metrics

- Response times
- Success rates
- Error rates
- Memory usage

---

## 📞 Support

- **Stripe Support**: [https://support.stripe.com](https://support.stripe.com)
- **Supabase Support**: [https://supabase.com/support](https://supabase.com/support)
- **Node.js Docs**: [https://nodejs.org/docs](https://nodejs.org/docs)