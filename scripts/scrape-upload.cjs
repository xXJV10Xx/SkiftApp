// scrape-upload.cjs – Komplett Puppeteer/Supabase-skript
// Placera denna fil i mappen skiftappen/scripts/scrape-upload.cjs
// Skapa .env i projektroten med dina värden för SUPABASE_URL, SUPABASE_SERVICE_KEY och COMPANY_ID

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// Läs in miljövariabler
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const COMPANY_ID   = process.env.COMPANY_ID;
if (!SUPABASE_URL || !SUPABASE_KEY || !COMPANY_ID) {
  console.error('❌ Saknar SUPABASE_URL, SUPABASE_SERVICE_KEY eller COMPANY_ID i .env');
  process.exit(1);
}

// Initiera Supabase-klient
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Standardtider för skift
const SHIFT_TIMES = {
  'förmiddag':   { start: '06:00', end: '14:00' },
  'formiddag':   { start: '06:00', end: '14:00' },
  'eftermiddag': { start: '14:00', end: '22:00' },
  'natt':        { start: '22:00', end: '06:00' }
};

// Enkel pausfunktion
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('🔄 Startar scraping…');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page    = await browser.newPage();

  // Blockera bilder, stilar och typsnitt för snabbare laddning
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (['image', 'stylesheet', 'font'].includes(req.resourceType())) req.abort();
    else req.continue();
  });

  // Hämta teams från Supabase
  const { data: teams, error: teamError } = await supabase.from('teams').select('id,name');
  if (teamError) {
    console.error('❌ Kunde inte hämta teams:', teamError.message);
    await browser.close();
    process.exit(1);
  }
  const teamMap = {};
  teams.forEach(t => teamMap[t.name.toLowerCase()] = t.id);

  // Lista med URL:er att skrapa
  const urls = [
    'https://www.skiftschema.se/schema/ssab_ox_3skift/1',
    'https://www.skiftschema.se/schema/ssab_ox_3skift/2',
    'https://www.skiftschema.se/schema/ssab_ox_3skift/3',
    'https://www.skiftschema.se/schema/ssab_ox_3skift/4',
    'https://www.skiftschema.se/schema/ssab_ox_3skift/5'
  ];

  let processed = 0, skipped = 0, errors = 0;

  for (const url of urls) {
    try {
      console.log(`🔍 Bearbetar ${url}…`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const title = await page.title();
      console.log(`🧾 Sida: "${title}"`);

      // Vänta på tabellrader eller hoppa om ingen
      try {
        await page.waitForSelector('table tbody tr', { timeout: 7000 });
      } catch {
        console.warn(`⚠️ Inga schemarader på ${url}`);
        continue;
      }

      // Extrahera rader
      const rows = await page.$$eval('table tbody tr', trs =>
        trs.map(tr => {
          const cells = tr.querySelectorAll('td');
          return {
            date:       cells[1]?.innerText.trim(),
            weekday:    cells[2]?.innerText.trim(),
            shift_type: cells[3]?.innerText.trim()
          };
        })
      );
      console.log(`📊 Hittade ${rows.length} rader`);

      // Loopa över rader
      for (const row of rows) {
        const raw = row.shift_type?.toLowerCase().trim();
        if (!raw) {
          console.warn('⚠️ Skift-typ saknas – hoppar');
          skipped++;
          continue;
        }
        const teamId = teamMap[raw];
        if (!teamId) {
          console.warn(`⚠️ Okänt team för typ: "${raw}"`);
          skipped++;
          continue;
        }

        console.log(`➡️ URL: ${url}  |  Key: ${raw}`);

        // Normalisera datum
        let date = row.date;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          const now = new Date();
          date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(parseInt(row.date)).padStart(2,'0')}`;
        }

        // Uppdatera/insert (upsert) i Supabase
        const times = SHIFT_TIMES[raw] || { start: null, end: null };
        const { error: upsertError } = await supabase
          .from('shifts')
          .upsert([{
            date,
            shift_type: raw,
            team_id:    teamId,
            company_id: COMPANY_ID,
            start_time: times.start,
            end_time:   times.end,
            hours_worked: 8,
            user_id:    null,
            notes:      `${raw} / ${row.weekday}`,
            cycle_day:  null
          }], { onConflict: ['date','team_id','shift_type'] });

        if (upsertError) {
          console.error(`❌ Insert-fel: ${upsertError.message}`);
          errors++;
        } else {
          processed++;
        }
      }

      console.log(`✅ Klart för ${url}`);
      await wait(1000);
    } catch (e) {
      console.error(`❌ Fel vid ${url}: ${e.message}`);
      errors++;
    }
  }

  await browser.close();
  console.log('\n📈 Slutresultat:');
  console.log(`✅ Sparade: ${processed}`);
  console.log(`⚠️ Skippade: ${skipped}`);
  console.log(`❌ Fel: ${errors}`);
  process.exitCode = errors > 0 ? 1 : 0;
})();
