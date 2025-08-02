import Stripe from 'stripe';
import { buffer } from 'micro';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const user_id = session.metadata.user_id;

    // Uppdatera premium-status
    await supabase
      .from('users')
      .update({ is_premium: true })
      .eq('id', user_id);

    // Hämta användarinfo för e-post
    const { data: userData } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', user_id)
      .single();

    // Skicka bekräftelsemail
    if (userData?.email) {
      try {
        await fetch(`${process.env.CLIENT_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: userData.email,
            subject: '🎉 Välkommen till Skiftappen Premium!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #16a34a;">🎉 Välkommen till Premium!</h2>
                <p>Hej ${userData.name || 'där'}!</p>
                <p>Tack för ditt köp av Kalenderexport för Skiftappen! Din betalning på 99 kr har genomförts och du har nu tillgång till alla premiumfunktioner.</p>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #16a34a; margin-top: 0;">✨ Vad du nu kan göra:</h3>
                  <ul style="color: #166534;">
                    <li>📅 Exportera ditt skiftschema till Google Calendar</li>
                    <li>📱 Synka med Apple Calendar</li>
                    <li>🔔 Få påminnelser om kommande skift</li>
                    <li>🚫 Ingen reklam längre</li>
                  </ul>
                </div>
                <p>Logga in i appen för att börja använda dina nya funktioner!</p>
              </div>
            `
          })
        });
      } catch (emailError) {
        console.error('Kunde inte skicka bekräftelsemail:', emailError);
      }
    }
  }

  res.status(200).json({ received: true });
}