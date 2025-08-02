const express = require('express');
const ics = require('ics');
const router = express.Router();
const ical = require('node-ical');

router.post('/import-ics', async (req, res) => {
  const { icsUrl } = req.body;

  try {
    const data = await ical.fromURL(icsUrl);

    const events = Object.values(data).filter(e => e.type === 'VEVENT');

    // 🛠️ Anpassa detta till din Supabase-schema
    const shifts = events.map(e => ({
      title: e.summary,
      date: e.start.toISOString().split('T')[0],
      time: e.start.toISOString().split('T')[1].slice(0, 5),
    }));

    // ✅ Skicka till Supabase
    // await supabase.from('shifts').insert(shifts);

    res.json({ imported: shifts.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to parse ICS' });
  }
});

module.exports = router;