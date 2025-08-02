const puppeteer = require('puppeteer-core');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const delay = ms => new Promise(res => setTimeout(res, ms));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Komplett lista enligt skiftschema.se (81 scheman)  [oai_citation:0‡skiftschema.se](https://www.skiftschema.se/Home/About?utm_source=chatgpt.com)
const allSchemas = [
  { company: "ABB", department: "HVC", schema: "abb_hvc_5skift", teams: [1,2,3,4,5] },
  { company: "Aga", department: "Avesta", schema: "aga_avesta_6skift", teams: ["A","B","C","D","E","F"] },
  { company: "Arctic Paper", department: "Grycksbo", schema: "arcticpaper_grycksbo_3skift", teams:[1,2,3,4,5] },
  { company: "Avesta kommun", department: "Avesta", schema: "avesta_6veckors_nattschema", teams:[1,2,3,4,5,6] },
  { company: "Barilla Sverige", department: "Filipstad", schema: "barilla_filipstad_5skift", teams:[1,2,3,4,5] },
  { company: "Billerudkorsnäs", department: "Grums", schema: "billerudkorsnas_grums_3skift", teams:["A","B","C","D","E"] },
  { company: "Boliden", department: "Aitik K3", schema: "boliden_aitik_k3_5skift", teams:[1,2,3,4,5] },
  { company: "Boliden", department: "Aitik K2", schema: "boliden_aitik_k2_5skift", teams:[1,2,3] },
  { company: "Boliden", department: "Garpenberg", schema: "boliden_garpenberg_5skift", teams:["A","B","C","D","E"] },
  { company: "Borlänge Energi", department: "Borlänge", schema: "borlange_energi_5skift", teams:["A","B","C","D","E"] },
  { company: "Borlänge kommun", department: "Borlänge", schema: "borlange_kommun_poolskoterska", teams:[1] },
  { company: "Cambrex", department: "Karlskoga", schema: "cambrex_karlskoga_5skift", teams:["A","B","C","D","E"] },
  { company: "Dentsply", department: "Mölndal", schema: "dentsply_moland_5skift", teams:["Röda","Gröna","Lila","Blåa","Gula"] },
  { company: "Finess Hygiene AB", department: "Finess", schema: "finess_hygiene_5skift", teams:[1,2,3,4,5] },
  { company: "Kubal Sundsvall", department: "Sundsvall", schema: "kubal_sundsvall_6skift", teams:[1,2,3,4,5,6] },
  { company: "LKAB", department: "Malmberget", schema: "lkab_malmberget_5skift", teams:["A","B","C","D","E"] },
  { company: "LT Dalarna", department: "Privat 1", schema: "lt_dalarna_privat_1", teams:[1] },
  { company: "Nordic Carbide", department: "Sundsvall", schema: "nordiccarbide_sundsvall_6skift", teams:[1,2,3,4,5,6] },
  { company: "Nordic Paper", department: "Bäckhammar K3", schema: "nordicpaper_backhammar_k3", teams:[1] },
  { company: "Orica Gyttorp Exel", department: "Exel", schema: "orica_gyttorp_exel_5skift", teams:[1,2,3,4,5] },
  { company: "Orica Gyttorp Exel", department: "Exel", schema: "orica_gyttorp_exel_3skift", teams:[1,2,3,4] },
  { company: "Orica Gyttorp NPED", department: "NPED", schema: "orica_gyttorp_nped_3skift", teams:[1,2,3,4,5] },
  { company: "Orica Gyttorp Slangen", department: "Slangen", schema: "orica_gyttorp_slangen_5skift", teams:[1,2,3,4,5] },
  { company: "Orica Gyttorp Tändpärlan", department: "Tändpärlan", schema: "orica_gyttorp_tandparlan_3skift", teams:[1,2,3] },
  { company: "Outokumpu", department: "Avesta", schema: "outokumpu_avesta_5skift", teams:["A","B","C","D","E"] },
  { company: "Outokumpu", department: "Avesta", schema: "outokumpu_avesta_bredband_4skift", teams:["A","B","C","D"] },
  { company: "Ovako Hofors", department: "Rörverk", schema: "ovako_hofors_rorverk_4or5skift", teams:[1,2,3,4] },
  { company: "Ovako Hofors", department: "Stålverk", schema: "ovako_hofors_stalverk_4skift", teams:[1,2,3,4] },
  { company: "Ovako Hofors", department: "Valsverk 3‑skift", schema: "ovako_hofors_valsverk_3skift", teams:[1,2,3] },
  { company: "Ovako Hofors", department: "Valsverk 4‑skift", schema: "ovako_hofors_valsverk_4skift", teams:[1,2,3,4] },
  { company: "Ovako Hofors", department: "Valsverk 5‑skift", schema: "ovako_hofors_valsverk_5skift", teams:[1,2,3,4,5] },
  { company: "Preemraff", department: "Lysekil", schema: "preemraff_lysekil_5skift", teams:["A","B","C","D","E"] },
  { company: "Ryssviken", department: "Boendet", schema: "ryssviken_boendet", teams:[...Array(9).keys()].map(i=>i) },
  { company: "Sandvik Materials Technology", department: "2-skift", schema: "sandvik_mat_2skift", teams:[1,2,3] },
  { company: "Sandvik Materials Technology", department: "5-skift", schema: "sandvik_mat_5skift", teams:[1,2,3,4,5] },
  { company: "Sandvik Materials Technology", department: "5-skift (80)", schema: "sandvik_mat_5skift_80", teams:[1,2,3,4,5] },
  { company: "Sandvik Materials Technology", department: "el&mek", schema: "sandvik_mat_elmek_5skift", teams:[1,2,3,4,5] },
  { company: "Sandvik Materials Technology", department: "OFP-tekniker", schema: "sandvik_mat_ofp_tekniker", teams:[...Array(8).keys()].map(i=>i+1) },
  { company: "Sandvik Mining", department: "Mining 2-skift", schema: "sandvik_mining_2skift", teams:[1,2,3] },
  { company: "Scania CV AB", department: "Södertälje Transmission", schema: "scania_sodertalje_5skift", teams:[1,2,3,4,5] },
  { company: "Schneider Electric", department: "Schneider", schema: "schneider_electric_5skift", teams:[1,2,3,4,5] },
  { company: "Seco Tools Fagersta", department: "Fagersta", schema: "secotools_fagersta_2skift", teams:[1,2,3] },
  { company: "SKF AB", department: "SKF", schema: "skf_ab_5skift", teams:[1,2,3,4,5] },
  { company: "Skärnäs", department: "Hamn", schema: "skarnas_hamn_5skift", teams:["A","B","C","D","E"] },
  { company: "Skärnäs", department: "Terminal", schema: "skarnas_terminal", teams:["A","B","C","D","E"] },
  { company: "SSAB", department: "Borlänge 4,7-skift", schema: "ssab_borlange_47skift", teams:["A","B","C","D","E"] },
  { company: "SSAB", department: "Borlänge 5-skift", schema: "ssab_borlange_5skift", teams:["A","B","C","D","E"] },
  { company: "SSAB", department: "Borlänge Halvtid", schema: "ssab_borlange_halvtid", teams:[1] },
  { company: "SSAB", department: "Borlänge I3-skift", schema: "ssab_borlange_i3skift", teams:[1,2,3] },
  { company: "SSAB", department: "Luleå 12‑timmars", schema: "ssab_lulea_12timme", teams:[1,2,3,4,5] },
  { company: "SSAB", department: "Luleå 5-skift", schema: "ssab_lulea_5skift", teams:["A","B","C","D","E"] },
  { company: "SSAB", department: "Oxelösund 3-skift", schema: "ssab_ox_3skift", teams:["A","B","C","D","E"] },
  { company: "Stora Enso", department: "Fors 5-skift", schema: "storaenso_fors_5skift", teams:["A","B","C","D","E"] },
  { company: "Stora Enso", department: "Forshaga 3-skift", schema: "storaenso_forshaga_3skift", teams:["A","B","C"] },
  { company: "Stora Enso", department: "Kvarnsveden 3-skift", schema: "storaenso_kvarnsveden_3skift", teams:["A","B","C","D","E"] },
  { company: "Stora Enso", department: "Kvarnsveden v2", schema: "storaenso_kvarnsveden_v2", teams:["A","B","C","D","E"] },
  { company: "Stora Enso", department: "Kvarnsveden Pannhuset", schema: "storaenso_kvarnsveden_pannhuset_3skift", teams:[1,2,3,4,5,6] },
  { company: "Stora Enso", department: "Nymölla 3-skift", schema: "storaenso_nymolla_3skift", teams:["F","G","H"] },
  { company: "Stora Enso", department: "Nymölla 5-skift", schema: "storaenso_nymolla_5skift", teams:["A","B","C","D","E"] },
  { company: "Södra Cell", department: "Mönsterås", schema: "sodra_cell_monsteras_3skift", teams:["A","B","C","D","E","F"] },
  { company: "Truck Service AB", department: "Truck", schema: "truckservice_2skift", teams:["A","B","C"] },
  { company: "Uddeholm Tooling", department: "2-skift", schema: "uddeholm_2skift", teams:[1,2,3] },
  { company: "Uddeholm Tooling", department: "5-skift", schema: "uddeholm_5skift", teams:[1,2,3,4,5] },
  { company: "Uddeholm Tooling", department: "ESR 7‑5-skift", schema: "uddeholm_esr_7_5skift", teams:[1,2,3,4,5] },
  { company: "Uddeholm Tooling", department: "MBR 4-skift", schema: "uddeholm_mbr_4skift", teams:[1,2,3,4] },
  { company: "Uddeholm Tooling", department: "Pressen 4-skift", schema: "uddeholm_pressen_4skift", teams:[1,2,3,4] },
  { company: "Uddeholm Tooling", department: "Pressen 5-skift", schema: "uddeholm_pressen_5skift", teams:[1,2,3,4,5] },
  { company: "Uddeholm Tooling", department: "Stålverket 4-skift", schema: "uddeholm_stalverket_4skift", teams:[1,2,3,4] },
  { company: "Voestalpine Precision Strip", department: "2-skift", schema: "voestalpine_2skift", teams:["A","B","C"] },
  { company: "Voestalpine Precision Strip", department: "3-skift", schema: "voestalpine_3skift", teams:["A","B","C"] },
  { company: "Voestalpine Precision Strip", department: "4-skift", schema: "voestalpine_4skift", teams:["A","B","C","D"] },
  { company: "Voestalpine Precision Strip", department: "5-skift", schema: "voestalpine_5skift", teams:["A","B","C","D","E"] },
  { company: "Voestalpine Precision Strip", department: "K2 2+2", schema: "voestalpine_k2_2_2", teams:["A","B","C"] },
  { company: "Voestalpine Precision Strip", department: "K2 2+2B", schema: "voestalpine_k2_2_2b", teams:["A","B","C"] },
  { company: "Voestalpine Precision Strip", department: "K2 2+3+1", schema: "voestalpine_k2_2_3_1", teams:["A","B","C"] },
  { company: "Voestalpine Precision Strip", department: "K2 3+3", schema: "voestalpine_k2_3_3", teams:["A","B","C"] },
  { company: "Voestalpine Precision Strip", department: "K2 3+3B", schema: "voestalpine_k2_3_3b", teams:["A","B","C"] },
  { company: "Voestalpine Precision Strip", department: "Munkfors 4-skift", schema: "voestalpine_munkfors_4skift", teams:["A","B","C","D"] },
  { company: "Voestalpine Precision Strip", department: "Munkfors 5-skift", schema: "voestalpine_munkfors_5skift", teams:["A","B","C","D","E"] },
  { company: "Voestalpine Precision Strip", department: "Ständig Natt", schema: "voestalpine_standig_natt", teams:["A"] }
];

// Loop, scrape och upload...
(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox','--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const scraped = [];

  for (const firm of allSchemas) {
    for (const team of firm.teams) {
      const url = `https://www.skiftschema.se/schema/${firm.schema}/${team}`;
      console.log(`🔄 Scrapar: ${url}`);
      try {
        await page.goto(url, { waitUntil:'domcontentloaded' });
        await delay(1000);
        const $ = cheerio.load(await page.content());
        $('.dag').each((i, el) => {
          const date = $(el).find('.datum').text().trim();
          const shift = $(el).find('.skiftkod').text().trim();
          const time = $(el).find('.tid').text().trim();
          if (date && shift) scraped.push({
            company: firm.company,
            department: firm.department,
            team: `Lag ${team}`,
            date, shift, time: time||null, source_url: url, scraped_at: new Date().toISOString()
          });
        });
      } catch(e) { console.error(`Fel vid ${url}: ${e.message}`); }
      await delay(500);
    }
  }

  console.log(`📦 Totalt ${scraped.length} poster`);
  if (scraped.length > 0) {
    const { error } = await supabase.from('shifts').insert(scraped);
    if (error) console.error("Supabase-fel:", error.message);
    else console.log("✅ Data inskickad till Supabase");
  }
  await browser.close();
})();
