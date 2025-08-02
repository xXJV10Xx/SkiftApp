const fs = require('fs');
const ical = require('ical');
const { createClient } = require('@supabase/supabase-js');

// Miljövariabler
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Läs ICS-fil
const events = ical.parseFile('./shifts.ics');

// Iterera och skicka till Supabase
(async () => {
  for (const key in events) {
    const event = events[key];
    if (event.type === 'VEVENT') {
      const { summary, start, end, location } = event;

      const { error } = await supabase
        .from('shift_schedules')
        .insert({
          title: summary,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          location: location || null,
          source: 'ics-import',
        });

      if (error) console.error('❌ Fel vid import:', error.message);
      else console.log('✅ Importerat:', summary);
    }
  }
})();