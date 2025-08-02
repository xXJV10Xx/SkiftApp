const { createEvents } = require('ics');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data, error } = await supabase
    .from('shift_schedules')
    .select('*');

  if (error) {
    console.error('❌ Kunde ej hämta data:', error);
    return;
  }

  const events = data.map(e => ({
    title: e.title,
    start: [
      new Date(e.start_time).getFullYear(),
      new Date(e.start_time).getMonth() + 1,
      new Date(e.start_time).getDate(),
      new Date(e.start_time).getHours(),
      new Date(e.start_time).getMinutes()
    ],
    end: [
      new Date(e.end_time).getFullYear(),
      new Date(e.end_time).getMonth() + 1,
      new Date(e.end_time).getDate(),
      new Date(e.end_time).getHours(),
      new Date(e.end_time).getMinutes()
    ],
    location: e.location || '',
  }));

  createEvents(events, (err, value) => {
    if (err) return console.log(err);
    fs.writeFileSync('exported.ics', value);
    console.log('📤 Export klar: exported.ics');
  });
})();