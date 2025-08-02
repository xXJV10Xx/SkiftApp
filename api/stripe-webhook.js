import Stripe from 'stripe';
import { supabase } from '../lib/supabaseClient';
import { sendExportSuccessEmail } from '../lib/emailService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Hantera lyckad betalning
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      // Hämta användarens e-post från sessionen
      const customerEmail = session.customer_details?.email;
      
      if (!customerEmail) {
        console.error('No customer email found in session');
        return res.status(400).json({ error: 'No customer email' });
      }

      // Uppdatera användarens export-flagga i Supabase
      const { data: user, error: updateError } = await supabase
        .from('users')
        .update({ has_paid_export: true })
        .eq('email', customerEmail)
        .select('first_name, last_name')
        .single();

      if (updateError) {
        console.error('Error updating user export flag:', updateError);
        return res.status(500).json({ error: 'Database update failed' });
      }

      // Skicka bekräftelse-e-post
      const userName = user ? `${user.first_name} ${user.last_name}`.trim() : 'Kund';
      await sendExportSuccessEmail(customerEmail, userName);

      console.log('Export access granted for:', customerEmail);
      
    } catch (error) {
      console.error('Error processing payment success:', error);
      return res.status(500).json({ error: 'Processing failed' });
    }
  }

  res.status(200).json({ received: true });
}

// Viktigt: Disable body parsing för Stripe webhooks
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};