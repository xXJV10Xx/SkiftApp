import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Prisdefinitioner för olika abonnemang
const PRICES = {
  monthly: {
    amount: 3900, // 39 kr i öre
    currency: 'sek',
    interval: 'month',
    interval_count: 1
  },
  semiannual: {
    amount: 10800, // 108 kr i öre (5% rabatt)
    currency: 'sek',
    interval: 'month',
    interval_count: 6
  },
  annual: {
    amount: 20500, // 205 kr i öre (10% rabatt)
    currency: 'sek',
    interval: 'year',
    interval_count: 1
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, user_id } = req.body;

    if (!plan || !user_id) {
      return res.status(400).json({ error: 'Plan and user_id are required' });
    }

    if (!PRICES[plan]) {
      return res.status(400).json({ error: 'Invalid plan selected' });
    }

    // Kontrollera om användaren redan har en aktiv prenumeration
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .single();

    if (existingSubscription) {
      return res.status(400).json({ error: 'User already has an active subscription' });
    }

    const priceData = PRICES[plan];

    // Skapa eller hämta Stripe-produkt
    const product = await stripe.products.create({
      name: `Skiftappen ${plan === 'monthly' ? 'Månad' : plan === 'semiannual' ? 'Halvår' : 'År'}`,
      description: `Premium-prenumeration för Skiftappen - ${plan}`,
    });

    // Skapa Stripe-pris
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: priceData.amount,
      currency: priceData.currency,
      recurring: {
        interval: priceData.interval,
        interval_count: priceData.interval_count,
      },
    });

    // Skapa checkout-session med Apple Pay och Google Pay support
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'klarna'], // Lägg till fler betalningsmetoder för Sverige
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
      metadata: {
        user_id: user_id,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          user_id: user_id,
          plan: plan,
        },
      },
      // Aktivera Apple Pay och Google Pay
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
      // Lägg till customer email om tillgängligt
      customer_email: req.body.email || undefined,
      // Lägg till trial om önskat (7 dagar gratis)
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id: user_id,
          plan: plan,
        },
      },
    });

    // Skapa en pending subscription i databasen
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user_id,
        is_active: false, // Blir true när betalningen går igenom
        plan: plan,
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dagar från nu
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error creating pending subscription:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json({ 
      session_url: session.url,
      session_id: session.id 
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}