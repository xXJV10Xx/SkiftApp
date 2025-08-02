const puppeteer = require("puppeteer-core");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Exempel på företag (du kommer få hela listan när scraping fungerar)
const companies = [
  { name: "SSAB", url: "https://www.skiftschema.se/schema/ssab_ox_3skift" },
  { name: "Ovako", url: "https://www.skiftschema.se/schema/ovako_hofors" },
  { name: "Outokumpu", url: "https://www.skiftschema.se/schema/outokumpu_tornios" }
  // TODO: Den riktiga listan hämtas i steg 3
];

async function runScraper() {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/usr/bin/google-chrome",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

  for (const company of companies) {
    console.log("🔍 Scraping: ", company.name);
    await page.goto(company.url, { waitUntil: "domcontentloaded" });

    const teams = await page.$$eval('.team-card a', links =>
      links.map(link => ({
        team: link.textContent.trim(),
        href: link.href
      }))
    );

    for (const { team, href } of teams) {
      await page.goto(href, { waitUntil: "networkidle2" });

      const skiftschema = await page.$$eval("table td", tds => {
        return Array.from(tds).map(td => td.innerText.trim());
      });

      const today = new Date();
      for (let i = 0; i < skiftschema.length; i++) {
        const raw = skiftschema[i];
        const type = raw.toUpperCase();
        const valid = ["F", "E", "N", "L"].includes(type);
        if (!valid) continue;

        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const shift_time = {
          F: "06:00-14:00",
          E: "14:00-22:00",
          N: "22:00-06:00",
          L: "-"
        }[type];

        await supabase.from("shifts").insert({
          company: company.name,
          location: company.url.split("/")[4] || null,
          team,
          date: date.toISOString().split("T")[0],
          shift_type: type,
          shift_time
        });
      }

      console.log(`✅ ${company.name} ${team} importerat`);
    }
  }

  await browser.close();
}

runScraper().then(() => {
  console.log("✅ Allt klart");
  process.exit(0);
}).catch((err) => {
  console.error("❌ Fel:", err);
  process.exit(1);
});
