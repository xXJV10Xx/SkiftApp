const puppeteer = require('puppeteer-core');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = 'https://www.skiftschema.se';

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

  const companies = await page.$$eval('.list-group-item > a', links =>
    links.map(link => ({
      name: link.innerText.trim(),
      url: link.href
    }))
  );

  for (const company of companies) {
    console.log(`📦 Hittar företag: ${company.name}`);
    const { data: companyData } = await supabase
      .from('companies')
      .insert({ name: company.name })
      .select()
      .single();

    await page.goto(company.url, { waitUntil: 'networkidle2' });

    const links = await page.$$eval('.list-group-item > a', els =>
      els.map(a => ({ name: a.innerText.trim(), url: a.href }))
    );

    for (const department of links) {
      console.log(`  🏢 Avdelning: ${department.name}`);
      const { data: departmentData } = await supabase
        .from('departments')
        .insert({ name: department.name, company_id: companyData.id })
        .select()
        .single();

      await page.goto(department.url, { waitUntil: 'networkidle2' });

      const teams = await page.$$eval('.list-group-item > a', els =>
        els.map(a => ({ name: a.innerText.trim(), url: a.href }))
      );

      for (const team of teams) {
        console.log(`    👥 Skiftlag: ${team.name}`);
        const { data: teamData } = await supabase
          .from('teams')
          .insert({ name: team.name, department_id: departmentData.id })
          .select()
          .single();

        await page.goto(team.url, { waitUntil: 'networkidle2' });

        const days = await page.$$eval('.day', els =>
          els.map(el => {
            const date = el.getAttribute('data-date');
            const type = el.innerText.trim()[0]; // F, E, N eller L
            return { date, type };
          })
        );

        const rows = days
          .filter(day => ['F', 'E', 'N', 'L'].includes(day.type))
          .map(day => ({
            team_id: teamData.id,
            date: day.date,
            shift_type: day.type
          }));

        if (rows.length) {
          await supabase.from('shifts').insert(rows);
          console.log(`      ✅ ${rows.length} skift sparade`);
        }
      }
    }
  }

  await browser.close();
}

run();
