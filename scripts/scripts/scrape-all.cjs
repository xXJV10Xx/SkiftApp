#!/usr/bin/env node

const puppeteer = require('puppeteer-core');
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Root URL
const BASE_URL = 'https://www.skiftschema.se/';

async function getAllScheduleLinks(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  const links = await page.$$eval('a', anchors =>
    anchors
      .map(a => a.href)
      .filter(href => href.includes('/schema/'))
  );
  return [...new Set(links)];
}

async function scrapeSchedulePage(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const schedule = await page.$$eval('.schema-calendar tr', rows =>
    rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td')).map(td => td.innerText.trim());
      return cells;
    }).filter(row => row.length > 0)
  );

  return schedule;
}

async function uploadToSupabase(company, department, team, data) {
  const payload = data.map(entry => ({
    company,
    department,
    team,
    raw: JSON.stringify(entry),
    scraped_at: new Date().toISOString()
  }));

  const { error } = await supabase.from('shift_schedules').insert(payload);
  if (error) console.error('Upload failed:', error.message);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/chromium-browser' // ändra vid behov
  });

  const page = await browser.newPage();

  console.log('[✓] Hämtar alla länkar...');
  const allLinks = await getAllScheduleLinks(page);

  for (const url of allLinks) {
    try {
      console.log(`→ Scrapar: ${url}`);
      const parts = url.replace(BASE_URL + 'schema/', '').split('/');
      const [companySlug, teamId] = parts;
      const schedule = await scrapeSchedulePage(page, url);
      await uploadToSupabase(companySlug, 'default', `lag-${teamId}`, schedule);
    } catch (err) {
      console.warn(`Fel vid ${url}:`, err.message);
    }
  }

  await browser.close();
  console.log('[✓] Klar.');
})();
