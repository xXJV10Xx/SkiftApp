import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4242;

// Stripe initialization
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

// Supabase initialization
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Email transporter
const emailTransporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Middleware
app.use(cors({ 
  origin: [process.env.FRONTEND_URL, 'http://localhost:3000', 'exp://localhost:8081'],
  credentials: true 
}));

// Webhook endpoint needs raw body
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Create Stripe Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { user_id, email } = req.body;

    if (!user_id || !email) {
      return res.status(400).json({ error: 'user_id and email are required' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'sek',
          product_data: {
            name: 'SkiftApp Premium',
            description: 'Kalenderexport och premium-funktioner',
            images: ['https://via.placeholder.com/300x200?text=SkiftApp+Premium'],
          },
          unit_amount: 9900, // 99 kr
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        user_id: user_id
      },
      // Enable Apple Pay and Google Pay
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
      // Automatic tax calculation (optional)
      automatic_tax: { enabled: false },
    });

    console.log(`Checkout session created for user ${user_id}: ${session.id}`);
    res.json({ url: session.url, session_id: session.id });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe Webhook Handler
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Received webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object.id);
        break;
      
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object.id);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }

  res.status(200).json({ received: true });
});

// Handle successful checkout
async function handleCheckoutCompleted(session) {
  const userId = session.metadata.user_id;
  const customerEmail = session.customer_email;
  
  console.log(`Processing completed checkout for user: ${userId}`);

  try {
    // Update user premium status in Supabase
    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_premium: true,
        premium_activated_at: new Date().toISOString(),
        stripe_customer_id: session.customer,
        stripe_session_id: session.id
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error updating user premium status:', error);
      throw error;
    }

    console.log(`User ${userId} upgraded to premium successfully`);

    // Send confirmation email
    await sendPremiumConfirmationEmail(customerEmail, userId);

  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
    throw error;
  }
}

// Send premium confirmation email
async function sendPremiumConfirmationEmail(email, userId) {
  try {
    const mailOptions = {
      from: `"SkiftApp" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Välkommen till SkiftApp Premium!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">🎉 Tack för ditt köp!</h1>
            <p style="color: #64748b; font-size: 18px;">Du har nu tillgång till alla premium-funktioner</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
            <h2 style="color: #1e293b; margin-top: 0;">Dina nya premium-funktioner:</h2>
            <ul style="color: #475569; line-height: 1.6;">
              <li>📅 <strong>Kalenderexport</strong> - Exportera dina skift till Google Calendar & Apple Calendar</li>
              <li>🔄 <strong>Automatisk synkronisering</strong> - Dina skift uppdateras automatiskt</li>
              <li>📊 <strong>Avancerad statistik</strong> - Se detaljerad statistik över dina arbetstider</li>
              <li>🎨 <strong>Anpassade teman</strong> - Personalisera appens utseende</li>
              <li>🚫 <strong>Reklamfritt</strong> - Ingen reklam i appen</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${process.env.FRONTEND_URL}" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Öppna SkiftApp
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 14px;">
            <p>Har du frågor? Svara på detta mail så hjälper vi dig!</p>
            <p>Tack för att du använder SkiftApp 💙</p>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`Premium confirmation email sent to: ${email}`);

  } catch (error) {
    console.error('Error sending confirmation email:', error);
    // Don't throw here - email failure shouldn't break the payment flow
  }
}

// Get user premium status
app.get('/user/:userId/premium-status', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('users')
      .select('is_premium, premium_activated_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user premium status:', error);
      return res.status(500).json({ error: 'Failed to fetch premium status' });
    }

    res.json({
      is_premium: data?.is_premium || false,
      premium_activated_at: data?.premium_activated_at
    });

  } catch (error) {
    console.error('Error in premium status endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SkiftApp Stripe server running on port ${PORT}`);
  console.log(`📧 Email configured: ${process.env.EMAIL_USER}`);
  console.log(`💳 Stripe configured: ${process.env.STRIPE_SECRET_KEY ? 'Yes' : 'No'}`);
  console.log(`🗄️  Supabase configured: ${process.env.SUPABASE_URL ? 'Yes' : 'No'}`);
});

export default app;