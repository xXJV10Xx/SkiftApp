const puppeteer = require('puppeteer-core');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const schemas = require('./schemas.json');
const delay = ms => new Promise(r => setTimeout(r, ms));
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const br = await puppeteer.launch({ args:['--no-sandbox','--disable-setuid-sandbox'], headless:true });
  const page = await br.newPage();
  const out = [];

  for (const { title, schema, teams } of schemas) {
    for (const team of teams) {
      const url = `https://www.skiftschema.se/schema/${schema}/${team}`;
      console.log('→', url);
      try {
        await page.goto(url, { waitUntil:'domcontentloaded' });
        await delay(500);
        const $ = cheerio.load(await page.content());
        $('.dag').each((i, el) => {
          const date = $(el).find('.datum').text().trim();
          const shift = $(el).find('.skiftkod').text().trim();
          const time = $(el).find('.tid').text().trim() || null;
          if (date && shift) out.push({ company: title, department: title, team, date, shift, time, source_url:url, scraped_at: new Date().toISOString() });
        });
      } catch(e) { console.error('✘', url, e.message); }
    }
  }

  console.log('Found', out.length, 'entries');
  if (out.length) {
    const { error } = await supabase.from('shifts').insert(out);
    if (error) console.error('Supabase error', error.message);
    else console.log('✅ Uploaded to Supabase');
  }
  await br.close();
})();