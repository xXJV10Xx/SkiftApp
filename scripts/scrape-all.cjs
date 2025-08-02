const puppeteer = require('puppeteer-core');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const schemas = require('./schemas.json');
const delay = ms => new Promise(r => setTimeout(r, ms));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const br = await puppeteer.launch({ headless: true, args:['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await br.newPage();
  const out = [];

  for (let entry of schemas) {
    for (let team of entry.teams) {
      const url = `https://www.skiftschema.se/schema/${entry.schema}/${team}`;
      console.log('Scraping', url);
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await delay(500);
        const $ = cheerio.load(await page.content());
        $('.dag').each((_, el) => {
          const date = $(el).find('.datum').text().trim();
          const shift = $(el).find('.skiftkod').text().trim();
          if (date && shift) {
            out.push({
              company: entry.title,
              team: team.toString(),
              date,
              type: shift,
              source_url: url,
              scraped_at: new Date().toISOString()
            });
          }
        });
      } catch (e) { console.error('Error:', url, e.message); }
    }
  }
  console.log('Total:', out.length);
  if (out.length) {
    const { error } = await supabase.from('shifts').insert(out);
    if (error) console.error("Supabase error:", error.message);
    else console.log("Uploaded to Supabase");
  }
  await br.close();
})();
