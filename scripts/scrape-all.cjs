const puppeteer = require("puppeteer-core");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getAllCompanyLinks() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91 Safari/537.36"
  );
  await page.goto("https://www.skiftschema.se/", { waitUntil: "domcontentloaded" });

  const links = await page.$$eval("a", (as) =>
    as.map((a) => a.href).filter((href) => href.includes("/schema/"))
  );

  await browser.close();
  return [...new Set(links)]; // unika länkar
}

async function scrapeAndStore() {
  const links = await getAllCompanyLinks();
  console.log(`🔗 Hittade ${links.length} skiftschema-länkar`);

  for (const url of links) {
    const parts = url.split("/").filter(Boolean);
    const company = parts[3] || "okänd";
    const team = parts[4] || "lag";

    console.log(`📦 Bearbetar: ${company} / ${team}`);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const data = await page.evaluate(() => {
      const days = document.querySelectorAll(".day");
      const shifts = [];

      days.forEach((day) => {
        const date = day.getAttribute("data-date");
        const rows = day.querySelectorAll(".shift");

        rows.forEach((row) => {
          const shift_type = row.textContent.trim();
          shifts.push({ date, shift_type });
        });
      });

      return shifts;
    });

    await browser.close();

    // Spara till Supabase
    const { data: companyData, error: companyErr } = await supabase
      .from("companies")
      .upsert({ name: company }, { onConflict: "name" })
      .select("id")
      .single();

    const { data: teamData, error: teamErr } = await supabase
      .from("teams")
      .upsert({ name: team, company_id: companyData.id }, { onConflict: "name" })
      .select("id")
      .single();

    for (const shift of data) {
      await supabase.from("shifts").upsert({
        team_id: teamData.id,
        date: shift.date,
        shift_type: shift.shift_type,
        time_range:
          shift.shift_type === "F"
            ? "06:00–14:00"
            : shift.shift_type === "E"
            ? "14:00–22:00"
            : shift.shift_type === "N"
            ? "22:00–06:00"
            : null,
      });
    }

    console.log(`✅ Lagt in ${data.length} skift från ${company}/${team}`);
  }
}

scrapeAndStore();
