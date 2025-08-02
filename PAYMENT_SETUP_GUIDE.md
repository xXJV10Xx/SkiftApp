# SkiftApp Payment System Setup Guide

This guide will help you set up the complete payment and subscription system for SkiftApp using Stripe and Supabase.

## 🏗️ Architecture Overview

The payment system includes:
- **Stripe Integration**: Handles payments and subscriptions
- **Supabase Database**: Stores user subscription status
- **React Native Components**: UI for subscription management
- **Webhook System**: Processes payment confirmations

## 📋 Prerequisites

- Supabase project set up
- Stripe account (test mode for development)
- Node.js and npm/yarn installed
- React Native development environment

## 🔧 Setup Steps

### 1. Database Setup

Run the SQL migration in your Supabase SQL editor:

```sql
-- Copy and paste the content from supabase-migrations/add-subscription-fields.sql
```

This will add the necessary columns and functions to your users table.

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for webhooks)
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `STRIPE_WEBHOOK_SECRET`: Webhook endpoint secret from Stripe
- `CLIENT_URL`: Your app's URL for redirect after payment

### 3. Stripe Configuration

#### Create Products and Prices
1. Go to Stripe Dashboard → Products
2. Create products for:
   - Monthly Premium (39 SEK/month)
   - Semi-annual Premium (108 SEK/6 months)
   - Annual Premium (205 SEK/year)
   - One-time Export (99 SEK)

#### Set up Webhooks
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe-webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook secret to your `.env` file

### 4. Deploy API Endpoints

The API endpoints need to be deployed to handle payments:
- `/api/create-checkout-session.js` - Creates Stripe checkout sessions
- `/api/stripe-webhook.js` - Handles Stripe webhooks

For Vercel deployment:
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`
3. Set environment variables in Vercel dashboard

### 5. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- `stripe` - Stripe SDK
- `@supabase/auth-helpers-react` - Supabase auth helpers
- `expo-file-system` - File operations
- `expo-sharing` - File sharing
- `micro` - Webhook body parsing

### 6. Component Integration

#### Basic Usage

```jsx
import SubscriptionScreen from './components/SubscriptionScreen';
import PremiumWrapper from './components/PremiumWrapper';
import CalendarExportView from './components/CalendarExportView';

// Subscription management
<SubscriptionScreen />

// Protect premium features
<PremiumWrapper requirePremium={true}>
  <PremiumFeature />
</PremiumWrapper>

// Calendar export with payment gate
<CalendarExportView 
  shifts={userShifts}
  onExportComplete={() => console.log('Export completed')}
/>
```

#### Advanced Usage

```jsx
// Show ads for non-premium users
<PremiumWrapper showAdPopup={true}>
  <MainAppContent />
</PremiumWrapper>

// Premium-only feature
<PremiumWrapper requirePremium={true}>
  <AdvancedFeature />
</PremiumWrapper>
```

## 💳 Pricing Structure

- **Monthly**: 39 SEK/month
- **Semi-annual**: 108 SEK (18 SEK/month, 54% savings)
- **Annual**: 205 SEK (17 SEK/month, 56% savings)
- **One-time Export**: 99 SEK

## 🎯 Features

### Premium Features
- ✨ Ad-free experience
- 📅 Unlimited calendar export
- 🔄 Automatic synchronization
- 📱 Priority support
- 🎨 Custom themes

### Trial Period
- 7-day free trial for all new users
- Full access to premium features during trial
- Automatic trial tracking

### Payment Options
- Credit/Debit Cards
- Apple Pay
- Google Pay
- Automatic tax calculation
- Swedish Krona (SEK) currency

## 🔒 Security

- All payments processed by Stripe
- Webhook signature verification
- Supabase Row Level Security (RLS)
- Environment variable protection
- Service role key separation

## 🧪 Testing

### Test Cards (Stripe Test Mode)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0000 0000 3220`

### Test Webhooks
Use Stripe CLI to test webhooks locally:
```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

## 📱 Mobile Considerations

- Uses `expo-web-browser` for Stripe Checkout
- Native sharing for calendar files
- Optimized for iOS and Android
- Handles app state transitions

## 🚀 Deployment Checklist

### Development
- [ ] Database migration completed
- [ ] Environment variables set
- [ ] Stripe test mode configured
- [ ] Webhook endpoint accessible
- [ ] Components integrated

### Production
- [ ] Switch to Stripe live mode
- [ ] Update webhook URLs
- [ ] Set production environment variables
- [ ] Test payment flow end-to-end
- [ ] Enable automatic tax collection

## 🔧 Troubleshooting

### Common Issues

**Webhook not receiving events**
- Check webhook URL is accessible
- Verify webhook secret matches
- Check Stripe dashboard for delivery attempts

**Payment not updating user status**
- Check webhook processing logs
- Verify user_id in session metadata
- Check Supabase service role permissions

**Export not working**
- Verify file system permissions
- Check sharing capability on device
- Ensure user has export access

### Debug Commands

```bash
# Check webhook deliveries
stripe events list --limit 10

# Test webhook locally
stripe listen --forward-to localhost:3000/api/stripe-webhook

# View Supabase logs
# Go to Supabase Dashboard → Logs
```

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs)

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Stripe and Supabase logs
3. Test with Stripe test cards
4. Verify environment variables
5. Check webhook endpoint accessibility

## 🔄 Updates and Maintenance

### Regular Tasks
- Monitor failed payments
- Update subscription statuses
- Review webhook logs
- Check trial conversions
- Update pricing if needed

### Security Updates
- Rotate webhook secrets periodically
- Review API key permissions
- Update dependencies regularly
- Monitor for security advisories