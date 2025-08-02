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

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let event;
  
  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      throw new Error('Missing stripe-signature header');
    }

    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { user_id, type } = session.metadata;
        
        if (!user_id || !type) {
          console.error('Missing metadata in checkout session:', session.metadata);
          break;
        }

        // Update user subscription status
        const updateData = {
          is_premium: type !== 'export',
          has_paid_export: type === 'export',
          ...(type !== 'export' && {
            subscription_type: type,
            subscription_status: 'active',
            subscription_started_at: new Date().toISOString()
          })
        };

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user_id);

        if (error) {
          console.error('Failed to update user subscription:', error);
        } else {
          console.log(`Successfully updated user ${user_id} with ${type} subscription`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        
        // Find user by email
        const { data: users, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', customer.email)
          .limit(1);

        if (error || !users?.length) {
          console.error('Failed to find user for subscription update:', customer.email);
          break;
        }

        const updateData = {
          subscription_status: subscription.status,
          is_premium: subscription.status === 'active'
        };

        await supabase
          .from('users')
          .update(updateData)
          .eq('id', users[0].id);

        console.log(`Updated subscription status for user ${users[0].id}: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        
        // Find user by email
        const { data: users, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', customer.email)
          .limit(1);

        if (error || !users?.length) {
          console.error('Failed to find user for subscription deletion:', customer.email);
          break;
        }

        const updateData = {
          subscription_status: 'cancelled',
          is_premium: false
        };

        await supabase
          .from('users')
          .update(updateData)
          .eq('id', users[0].id);

        console.log(`Cancelled subscription for user ${users[0].id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}