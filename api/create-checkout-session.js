import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Priser i svenska öre (1 kr = 100 öre)
const PRICES = {
  monthly: 3900,    // 39 kr
  semiannual: 10800, // 108 kr (5% rabatt)
  annual: 20500     // 205 kr (10% rabatt)
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, user_id } = req.body;

    if (!plan || !user_id || !PRICES[plan]) {
      return res.status(400).json({ error: 'Invalid plan or user_id' });
    }

    // Skapa eller uppdatera subscription record
    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id,
        plan,
        is_active: false
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError);
      return res.status(500).json({ error: 'Database error' });
    }

    // Skapa Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'klarna'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'sek',
            product_data: {
              name: `Skiftappen Premium - ${getPlanDisplayName(plan)}`,
              description: 'Obegränsad tillgång till alla funktioner utan reklam'
            },
            unit_amount: PRICES[plan],
            recurring: {
              interval: getStripeInterval(plan),
              interval_count: getStripeIntervalCount(plan)
            }
          },
          quantity: 1
        }
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancelled`,
      metadata: {
        user_id,
        plan
      },
      customer_email: undefined, // Låt användaren fylla i
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      payment_method_options: {
        card: {
          setup_future_usage: 'off_session'
        }
      },
      // Aktivera Apple Pay och Google Pay
      payment_method_configuration: process.env.STRIPE_PAYMENT_METHOD_CONFIG_ID
    });

    res.status(200).json({ 
      session_url: session.url,
      session_id: session.id 
    });

  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}

function getPlanDisplayName(plan) {
  switch (plan) {
    case 'monthly': return 'Månad';
    case 'semiannual': return 'Halvår';
    case 'annual': return 'År';
    default: return plan;
  }
}

function getStripeInterval(plan) {
  switch (plan) {
    case 'monthly': return 'month';
    case 'semiannual': return 'month';
    case 'annual': return 'year';
    default: return 'month';
  }
}

function getStripeIntervalCount(plan) {
  switch (plan) {
    case 'monthly': return 1;
    case 'semiannual': return 6;
    case 'annual': return 1;
    default: return 1;
  }
}