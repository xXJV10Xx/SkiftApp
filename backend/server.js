require('dotenv').config();
const express = require('express');
const app = express();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

app.use(cors());
app.use(express.json());

app.post('/create-payment-intent', async (req, res) => {
  const customer = await stripe.customers.create();

  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer.id },
    { apiVersion: '2023-08-16' }
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 9900,
    currency: 'sek',
    customer: customer.id,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.send({
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
  });
});

app.listen(4242, () => console.log('Servern körs på port 4242'));