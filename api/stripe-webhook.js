// api/stripe-webhook.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const user_id = session.metadata.user_id;
      const feature = session.metadata.feature;

      console.log(`Payment completed for user ${user_id}, feature: ${feature}`);

      if (feature === 'calendar_export') {
        // Update user's calendar export status
        const { data, error } = await supabase
          .from('users')
          .update({ calendar_export_paid: true })
          .eq('id', user_id);

        if (error) {
          console.error('Supabase update error:', error);
          return res.status(500).json({ error: 'Failed to update user status' });
        }

        console.log(`Successfully updated calendar export status for user ${user_id}`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Important: Disable body parsing for webhooks
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}