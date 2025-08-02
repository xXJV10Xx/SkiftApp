const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { amount, currency, userId, featureType } = req.body;

    // Validate required fields
    if (!amount || !currency || !userId || !featureType) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Validate amount (should be 9900 öre for calendar export)
    if (featureType === 'calendar_export' && amount !== 9900) {
      res.status(400).json({ error: 'Invalid amount for calendar export' });
      return;
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, has_calendar_export')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if user already has calendar export access
    if (featureType === 'calendar_export' && user.has_calendar_export) {
      res.status(400).json({ error: 'User already has calendar export access' });
      return;
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      metadata: {
        userId: userId,
        featureType: featureType,
        userEmail: user.email,
        userName: user.full_name
      },
      description: `${featureType === 'calendar_export' ? 'Kalender Export' : 'Premium Feature'} - ${user.full_name}`,
      receipt_email: user.email,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store payment intent in database
    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: amount,
        currency: currency.toUpperCase(),
        status: 'pending',
        feature_type: featureType
      });

    if (insertError) {
      console.error('Error storing payment transaction:', insertError);
      // Continue anyway, as the payment intent was created successfully
    }

    res.status(200).json({
      data: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      }
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};