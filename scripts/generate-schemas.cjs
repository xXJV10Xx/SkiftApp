const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
(async () => {
  const res = await fetch('https://www.skiftschema.se/');
  const html = await res.text();
  const $ = cheerio.load(html);
  const schemas = [];
  $('#schemaList .schema-item').each((i, el) => {
    const title = $(el).find('h4').text().trim();
    const schemaSlug = $(el).find('a').attr('href').trim().split('/').pop();
    const teams = [];
    $(el).find('.team-list span').each((_, t) => teams.push(t.innerText.trim()));
    schemas.push({ title, schema: schemaSlug, teams });
  });
  fs.writeFileSync('scripts/schemas.json', JSON.stringify(schemas, null, 2));
  console.log('✅ Wrote schemas.json with', schemas.length, 'entries');
})();
