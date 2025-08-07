const puppeteer = require('puppeteer');

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
        datum: cells[0]?.innerText.trim(),
        skift: cells[1]?.innerText.trim(),
        lag: cells[2]?.innerText.trim()
      };
    });
  });

  console.log(schema);

  await browser.close();
})();

