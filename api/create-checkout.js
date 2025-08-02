import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { user_id, email } = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'sek',
          unit_amount: 9900,
          product_data: {
            name: 'Kalenderexport – Skiftappen',
          },
        },
        quantity: 1,
      },
    ],
    customer_email: email,
    success_url: `${process.env.CLIENT_URL}/premium-success`,
    cancel_url: `${process.env.CLIENT_URL}/premium-cancel`,
    metadata: { user_id }
  });

  res.status(200).json({ url: session.url });
}