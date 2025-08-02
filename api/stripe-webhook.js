import { buffer } from 'micro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { 
  api: { 
    bodyParser: false 
  } 
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let event;
  
  try {
    const body = await buffer(req);
    event = stripe.webhooks.constructEvent(
      body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { user_id, purchase_type } = session.metadata;

      if (!user_id || !purchase_type) {
        console.error('Missing metadata in session:', session.id);
        return res.status(400).json({ error: 'Missing metadata' });
      }

      // Uppdatera användarprofil baserat på köptyp
      const updateData = {};
      
      if (purchase_type === 'export') {
        updateData.has_paid_export = true;
      } else {
        // Prenumerationsköp
        updateData.is_premium = true;
        updateData.premium_type = purchase_type;
        updateData.premium_started_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user_id);

      if (error) {
        console.error('Database update error:', error);
        return res.status(500).json({ error: 'Database update failed' });
      }

      console.log(`Successfully updated user ${user_id} for ${purchase_type}`);
    }

    // Hantera prenumerationsavslut
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      
      // Hitta användare baserat på customer ID
      const { data: sessions } = await stripe.checkout.sessions.list({
        customer: subscription.customer,
        limit: 100
      });

      for (const session of sessions.data) {
        if (session.metadata?.user_id) {
          await supabase
            .from('users')
            .update({ 
              is_premium: false,
              premium_ended_at: new Date().toISOString()
            })
            .eq('id', session.metadata.user_id);
          break;
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}