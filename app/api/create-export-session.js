import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, userEmail } = req.body;

    if (type !== 'calendar-export') {
      return res.status(400).json({ error: 'Invalid export type' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'sek',
          product_data: { 
            name: 'Kalenderexport',
            description: 'Exportera ditt skiftschema som ICS-fil'
          },
          unit_amount: 9900, // 99 SEK
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: userEmail,
      metadata: {
        export_type: 'calendar',
        user_email: userEmail,
      },
      success_url: `${process.env.EXPO_PUBLIC_APP_URL || 'https://localhost:3000'}/export-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.EXPO_PUBLIC_APP_URL || 'https://localhost:3000'}/calendar`,
    });

    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}