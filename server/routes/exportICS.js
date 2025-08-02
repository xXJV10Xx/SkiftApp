const express = require('express');
const router = express.Router();
const { createEvents } = require('ics');

router.get('/export.ics', async (req, res) => {
  const shifts = [ // hämta från Supabase här istället
    { title: 'Förmiddag', start: [2025, 8, 3, 6, 0], duration: { hours: 8 } },
    { title: 'Eftermiddag', start: [2025, 8, 4, 14, 0], duration: { hours: 8 } }
  ];

  const { error, value } = createEvents(shifts);

  if (error) {
    return res.status(500).send(error);
  }

  res.setHeader('Content-Type', 'text/calendar');
  res.send(value);
});

module.exports = router;