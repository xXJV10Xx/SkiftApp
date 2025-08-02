import Stripe from 'stripe';
import { supabase } from '../../lib/supabase';

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
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      if (session.metadata?.export_type === 'calendar') {
        try {
          // Find user by email and update export access
          const { data: employees, error: findError } = await supabase
            .from('employees')
            .select('id, email')
            .eq('email', session.metadata.user_email)
            .single();

          if (findError) {
            console.error('Error finding user:', findError);
            break;
          }

          // Update export access
          const { error: updateError } = await supabase
            .from('employees')
            .update({ 
              has_paid_export: true,
              export_paid_at: new Date().toISOString()
            })
            .eq('id', employees.id);

          if (updateError) {
            console.error('Error updating export access:', updateError);
          } else {
            console.log(`Export access granted for user: ${session.metadata.user_email}`);
            
            // Send confirmation email
            await sendExportConfirmationEmail(session.metadata.user_email, session.id);
          }
        } catch (error) {
          console.error('Error processing export payment:', error);
        }
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
}

async function sendExportConfirmationEmail(email, sessionId) {
  try {
    // Import dynamically to avoid issues if not installed
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Kalenderexport - Betalning mottagen',
      html: `
        <h2>Tack för ditt köp!</h2>
        <p>Din betalning för kalenderexport har mottagits.</p>
        <p>Du kan nu exportera ditt skiftschema som ICS-fil direkt från appen.</p>
        <p>Transaktions-ID: ${sessionId}</p>
        <br>
        <p>Med vänliga hälsningar,<br>Skiftappen-teamet</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

// Disable body parsing for webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};