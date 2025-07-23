import fs from 'fs'
import puppeteer from 'puppeteer'

const BASE_URL = 'https://skiftschema.se/'
const YEARS = Array.from({ length: 11 }, (_, i) => 2020 + i)
const results: any[] = []

async function scrapeAll() {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()

  await page.goto(BASE_URL, { waitUntil: 'networkidle0' })
  const companies = await page.$$eval('#schemaSelect option', options =>
    options
      .map(o => o.getAttribute('value'))
      .filter(v => v && v.trim() !== '')
  )

  for (const company of companies) {
    for (const year of YEARS) {
      const baseUrl = `${BASE_URL}Home/Schedule?type=${company}&start=${year}-01-01`
      await page.goto(baseUrl, { waitUntil: 'networkidle0' })
      await page.waitForSelector('.team-tab')

      const shiftTeams = await page.$$eval('.team-tab', tabs =>
        tabs.map(tab => ({
          id: tab.getAttribute('data-team'),
          name: tab.textContent?.trim() || ''
        })).filter(t => t.id)
      )

      for (const team of shiftTeams) {
        const teamUrl = `${baseUrl}&team=${team.id}`
        await page.goto(teamUrl, { waitUntil: 'networkidle0' })
        await page.waitForSelector('.day-cell')

        const schedule = await page.$$eval('.day-cell', cells =>
          cells.map(cell => ({
            datum: cell.getAttribute('data-date'),
            skift: cell.textContent?.trim()
          })).filter(s => s.datum && s.skift)
        )

        results.push({
          företag: company.toUpperCase(),
          år: year,
          skiftlag: team.name,
          schema: schedule
        })

        console.log(`✅ ${company.toUpperCase()} - ${team.name} - ${year} (${schedule.length} dagar)`)
      }
    }
  }

  await browser.close()
  fs.writeFileSync('./skiftscheman_alla_företag_2020_2030.json', JSON.stringify(results, null, 2))
  console.log('🎉 Klart! JSON sparad som skiftscheman_alla_företag_2020_2030.json')
}

scrapeAll() 