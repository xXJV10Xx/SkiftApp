require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const googleAuth = require('./googleAuth');
const calendar = require('./calendar');

app.use(cors());
app.use(express.json());
app.use(googleAuth);
app.use(calendar);

app.get('/', (req, res) => {
  res.json({ message: 'SkiftApp Backend API is running!' });
});

app.listen(process.env.PORT, () =>
  console.log(`✅ Server running on http://localhost:${process.env.PORT}`)
);