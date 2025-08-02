import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Hantera olika event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const email = paymentIntent.receipt_email;

      if (email) {
        try {
          const { data, error } = await supabase
            .from('users')
            .update({ has_paid_export: true })
            .eq('email', email);

          if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Database update failed' });
          }

          console.log(`✅ Updated export permission for ${email}`);
        } catch (dbError) {
          console.error('Database operation failed:', dbError);
          return res.status(500).json({ error: 'Database operation failed' });
        }
      }
      break;

    case 'checkout.session.completed':
      const session = event.data.object;
      const customerEmail = session.customer_email;

      if (customerEmail) {
        try {
          const { data, error } = await supabase
            .from('users')
            .update({ has_paid_export: true })
            .eq('email', customerEmail);

          if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Database update failed' });
          }

          console.log(`✅ Updated export permission for ${customerEmail}`);
        } catch (dbError) {
          console.error('Database operation failed:', dbError);
          return res.status(500).json({ error: 'Database operation failed' });
        }
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}