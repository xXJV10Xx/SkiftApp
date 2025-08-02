// api/checkout.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'sek',
            product_data: {
              name: 'Kalenderexport (Google & Apple)',
              description: 'Lås upp kalenderexport för Google Calendar och Apple Calendar',
            },
            unit_amount: 9900, // 99 SEK
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.EXPO_PUBLIC_APP_URL || 'https://dinapp.se'}/success?user_id=${user_id}`,
      cancel_url: `${process.env.EXPO_PUBLIC_APP_URL || 'https://dinapp.se'}/cancel`,
      metadata: { 
        user_id,
        feature: 'calendar_export'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}