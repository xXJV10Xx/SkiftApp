const puppeteerCore = require('puppeteer-core');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

(async () => {
  const browser = await puppeteerCore.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });
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

  await supabase.from('schedules').delete().neq('id', '');

  for (const item of schema) {
    await supabase.from('schedules').insert([
      {
        date: item.date,
        shift: item.shift,
        team: item.team
      }
    ]);
  }

  console.log('✅ Skiftdata sparat i Supabase!');
  await browser.close();
})();
