import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { user_id, email, type } = req.body;
    
    if (!user_id || !email || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const isSubscription = type !== 'export';

    // Define pricing
    const pricing = {
      monthly: 3900,     // 39 SEK
      semiannual: 10800, // 108 SEK
      annual: 20500,     // 205 SEK
      export: 9900       // 99 SEK
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'apple_pay', 'google_pay'],
      mode: isSubscription ? 'subscription' : 'payment',
      line_items: [{
        price_data: {
          currency: 'sek',
          product_data: { 
            name: isSubscription ? 'SkiftApp Premium' : 'Kalenderexport',
            description: isSubscription 
              ? `Premium prenumeration - ${type === 'annual' ? 'Årlig' : type === 'semiannual' ? 'Halvårlig' : 'Månadsvis'}`
              : 'Exportera ditt skiftschema till kalender'
          },
          unit_amount: pricing[type] || pricing.export,
          ...(isSubscription && { 
            recurring: { 
              interval: type === 'annual' ? 'year' : type === 'semiannual' ? 'month' : 'month',
              interval_count: type === 'semiannual' ? 6 : 1
            } 
          })
        },
        quantity: 1,
      }],
      customer_email: email,
      metadata: { 
        user_id, 
        type,
        app: 'skiftapp'
      },
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}