import { buffer } from 'micro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);
  
  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received Stripe webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { subscription, customer, metadata } = session;

        console.log('Checkout session completed for user:', metadata?.user_id);

        // Uppdatera prenumerationsstatus
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: metadata?.user_id,
            is_active: true,
            stripe_customer_id: customer,
            stripe_subscription_id: subscription,
            plan: metadata?.plan,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error updating subscription:', error);
          return res.status(500).json({ error: 'Database update failed' });
        }

        console.log('Subscription activated successfully');
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        console.log('Subscription updated:', subscription.id);

        // Uppdatera prenumerationsstatus baserat på Stripe-status
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        
        const { error } = await supabase
          .from('subscriptions')
          .update({
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating subscription status:', error);
          return res.status(500).json({ error: 'Database update failed' });
        }

        console.log('Subscription status updated:', isActive);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        console.log('Subscription cancelled:', subscription.id);

        // Deaktivera prenumerationen
        const { error } = await supabase
          .from('subscriptions')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error deactivating subscription:', error);
          return res.status(500).json({ error: 'Database update failed' });
        }

        console.log('Subscription deactivated successfully');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        
        console.log('Payment failed for subscription:', invoice.subscription);

        // Optionellt: Skicka notifikation till användaren om misslyckad betalning
        // Detta kan implementeras senare med push-notifikationer
        
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}