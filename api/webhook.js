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
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { subscription, customer, metadata } = session;

        await supabase
          .from('subscriptions')
          .update({
            is_active: true,
            stripe_customer_id: customer,
            stripe_subscription_id: subscription
          })
          .eq('user_id', metadata.user_id);
        
        console.log('Subscription activated for user:', metadata.user_id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        
        await supabase
          .from('subscriptions')  
          .update({
            is_active: true
          })
          .eq('stripe_subscription_id', invoice.subscription);
        
        console.log('Subscription renewed:', invoice.subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        
        await supabase
          .from('subscriptions')
          .update({
            is_active: false
          })
          .eq('stripe_subscription_id', invoice.subscription);
        
        console.log('Subscription deactivated due to payment failure:', invoice.subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        await supabase
          .from('subscriptions')
          .update({
            is_active: false
          })
          .eq('stripe_subscription_id', subscription.id);
        
        console.log('Subscription cancelled:', subscription.id);
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