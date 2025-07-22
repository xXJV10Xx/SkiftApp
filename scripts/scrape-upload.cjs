const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('https://skiftschema.se');

  await page.waitForSelector('.btn-primary');
  await page.click('.btn-primary');
  await page.waitForSelector('.table');

  const schema = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.table tbody tr'));
    return rows.map(row => {
      const cells = row.querySelectorAll('td');
      return {
        date: cells[0]?.innerText.trim(),
        shift: cells[1]?.innerText.trim(),
        team: cells[2]?.innerText.trim()
      };
    });
  });

  // Rensa gamla poster (valfritt)
  await supabase.from('schedules').delete().neq('id', '');

  // Spara nya poster
  for (const item of schema) {
    await supabase.from('schedules').insert([
      {
        date: item.date,
        shift: item.shift,
        team: item.team
      }
    ]);
  }

  console.log('✅ Schemat är sparat i Supabase');
  await browser.close();
})();
