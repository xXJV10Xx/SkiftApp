import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { user_id, type, email } = req.body;
    
    if (!user_id || !type || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const isSubscription = type !== 'export';
    
    // Priser i öre (SEK)
    let unitAmount;
    let recurring = null;
    
    if (isSubscription) {
      switch (type) {
        case 'annual':
          unitAmount = 20500; // 205 kr/år
          recurring = { interval: 'year' };
          break;
        case 'semiannual':
          unitAmount = 10800; // 108 kr för 6 månader
          recurring = { interval: 'month', interval_count: 6 };
          break;
        case 'monthly':
        default:
          unitAmount = 3900; // 39 kr/månad
          recurring = { interval: 'month' };
          break;
      }
    } else {
      unitAmount = 9900; // 99 kr för export
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'apple_pay', 'google_pay'],
      mode: isSubscription ? 'subscription' : 'payment',
      line_items: [{
        price_data: {
          currency: 'sek',
          product_data: { 
            name: isSubscription ? 'Premium abonnemang' : 'Kalenderexport' 
          },
          unit_amount: unitAmount,
          ...(recurring && { recurring })
        },
        quantity: 1,
      }],
      customer_email: email,
      metadata: { 
        user_id, 
        purchase_type: type 
      },
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}