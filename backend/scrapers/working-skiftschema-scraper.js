#!/usr/bin/env node

/**
 * Working Skiftschema.se Scraper - Based on investigation findings
 * Extracts shift schedules using correct FullCalendar selectors
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class WorkingSkiftSchemaScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'https://skiftschema.se';
    this.allData = [];
    this.errors = [];
    this.scrapedCount = 0;
  }

  async initialize() {
    console.log('🚀 Initializing working skiftschema.se scraper...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    this.page.setDefaultTimeout(30000);
  }

  async extractShiftSchedule(url, companyName, teamName = '') {
    try {
      console.log(`📅 Extracting: ${companyName} ${teamName} (${url})`);
      
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      await this.page.waitForSelector('.fc-view-container', { timeout: 15000 });
      await this.page.waitForTimeout(2000); // Wait for events to render
      
      const scheduleData = await this.page.evaluate(() => {
        const data = {
          shifts: [],
          metadata: {
            extractedAt: new Date().toISOString(),
            shiftTypes: new Set(),
            dateRange: { start: null, end: null }
          }
        };
        
        // Find all calendar cells with dates
        const dateCells = document.querySelectorAll('td.fc-day[data-date]');
        
        dateCells.forEach(cell => {
          const date = cell.getAttribute('data-date');
          
          // Look for event containers - this is where shift data is stored
          const eventContainers = cell.querySelectorAll('.fc-event-container .fc-event');
          
          eventContainers.forEach(event => {
            const content = event.textContent?.trim();
            const title = event.querySelector('.fc-title, .fc-event-title')?.textContent?.trim();
            const time = event.querySelector('.fc-time')?.textContent?.trim();
            
            // Extract shift type from Swedish text
            let shiftType = null;
            let shiftName = null;
            let timeRange = null;
            
            if (content) {
              // Parse Swedish shift names to single letters
              if (content.includes('Förmiddag') || content.includes('06:00-14:00')) {
                shiftType = 'F';
                shiftName = 'Förmiddag';
                timeRange = '06:00-14:00';
              } else if (content.includes('Eftermiddag') || content.includes('14:00-22:00')) {
                shiftType = 'E';
                shiftName = 'Eftermiddag';
                timeRange = '14:00-22:00';
              } else if (content.includes('Natt') || content.includes('22:00-06:00')) {
                shiftType = 'N';
                shiftName = 'Natt';
                timeRange = '22:00-06:00';
              } else if (content.includes('Ledigt') || content.includes('Ledig')) {
                shiftType = 'L';
                shiftName = 'Ledigt';
                timeRange = null;
              } else {
                // Try to extract direct letter codes
                const letterMatch = content.match(/^[ABCDEFNFL]$/);
                if (letterMatch) {
                  shiftType = letterMatch[0];
                  shiftName = content;
                }
              }
              
              if (shiftType) {
                data.shifts.push({
                  date: date,
                  shiftType: shiftType,
                  shiftName: shiftName,
                  timeRange: timeRange,
                  originalText: content,
                  title: title,
                  time: time
                });
                
                data.metadata.shiftTypes.add(shiftType);
                
                // Update date range
                if (!data.metadata.dateRange.start || date < data.metadata.dateRange.start) {
                  data.metadata.dateRange.start = date;
                }
                if (!data.metadata.dateRange.end || date > data.metadata.dateRange.end) {
                  data.metadata.dateRange.end = date;
                }
              }
            }
          });
        });
        
        // Convert Set to Array
        data.metadata.shiftTypes = Array.from(data.metadata.shiftTypes);
        data.metadata.totalShifts = data.shifts.length;
        
        return data;
      });
      
      const result = {
        company: companyName,
        team: teamName,
        url: url,
        ...scheduleData,
        extractedAt: new Date().toISOString()
      };
      
      this.scrapedCount++;
      console.log(`   ✅ Extracted ${scheduleData.shifts.length} shifts (${scheduleData.metadata.shiftTypes.join(', ')})`);
      
      return result;
      
    } catch (error) {
      console.error(`   ❌ Error extracting ${companyName} ${teamName}:`, error.message);
      this.errors.push({
        company: companyName,
        team: teamName,
        url: url,
        error: error.message
      });
      return null;
    }
  }

  async scrapeCompanyTeams(companyUrl, companyName) {
    console.log(`\n🏭 Scraping company: ${companyName}`);
    
    try {
      // First get the main page to find team links
      await this.page.goto(companyUrl, { waitUntil: 'networkidle2' });
      await this.page.waitForSelector('.fc-view-container', { timeout: 15000 });
      
      const teamLinks = await this.page.evaluate(() => {
        const links = [];
        const teamElements = document.querySelectorAll('a[href*="/schema/"]');
        
        teamElements.forEach(link => {
          const href = link.href;
          const text = link.textContent?.trim();
          
          // Filter for team-specific links (not duplicates)
          if (text && href && !links.find(l => l.href === href)) {
            links.push({ text, href });
          }
        });
        
        return links;
      });
      
      console.log(`   📋 Found ${teamLinks.length} team variations`);
      
      const companyData = {
        company: companyName,
        baseUrl: companyUrl,
        teams: [],
        summary: {
          totalTeams: 0,
          totalShifts: 0,
          shiftTypes: new Set()
        }
      };
      
      // Extract data for each team
      for (const teamLink of teamLinks.slice(0, 6)) { // Limit to avoid too many requests
        const teamData = await this.extractShiftSchedule(teamLink.href, companyName, teamLink.text);
        
        if (teamData && teamData.shifts.length > 0) {
          companyData.teams.push(teamData);
          companyData.summary.totalTeams++;
          companyData.summary.totalShifts += teamData.shifts.length;
          
          teamData.metadata.shiftTypes.forEach(type => {
            companyData.summary.shiftTypes.add(type);
          });
        }
        
        // Be respectful to the server
        await this.page.waitForTimeout(1500);
      }
      
      companyData.summary.shiftTypes = Array.from(companyData.summary.shiftTypes);
      
      console.log(`   📊 Company summary: ${companyData.summary.totalTeams} teams, ${companyData.summary.totalShifts} total shifts`);
      
      return companyData;
      
    } catch (error) {
      console.error(`   💥 Error scraping company ${companyName}:`, error.message);
      this.errors.push({
        company: companyName,
        url: companyUrl,
        error: error.message,
        type: 'company'
      });
      return null;
    }
  }

  async scrapeTargetCompanies() {
    console.log('🎯 Scraping target Swedish industrial companies...');
    
    const targetCompanies = [
      { name: 'SSAB Borlänge 5-skift', url: 'https://skiftschema.se/schema/ssab_5skift/' },
      { name: 'SSAB 4+7 skift', url: 'https://skiftschema.se/schema/ssab_4_7skift/' },
      { name: 'Boliden Aitik Gruva K3', url: 'https://skiftschema.se/schema/boliden_aitik_gruva_k3/' },
      { name: 'Boliden Aitik K2', url: 'https://skiftschema.se/schema/boliden_aitik_k2/' },
      { name: 'Boliden Garpenberg', url: 'https://skiftschema.se/schema/boliden_garpenberg_anrikningverk/' },
      { name: 'Sandvik Mining 2-skift', url: 'https://skiftschema.se/schema/sandvik_mining_2skift/' },
      { name: 'Sandvik MT 2-skift', url: 'https://skiftschema.se/schema/sandvik_mt_2skift/' },
      { name: 'Ovako Hofors Stålverk', url: 'https://skiftschema.se/schema/ovako_hofors_stalverk_4skift/' },
      { name: 'Stora Enso Fors', url: 'https://skiftschema.se/schema/stora_enso_fors_5skift/' },
      { name: 'ABB HVC 5-skift', url: 'https://skiftschema.se/schema/abb_hvc_5skift/' }
    ];
    
    for (const company of targetCompanies) {
      const companyData = await this.scrapeCompanyTeams(company.url, company.name);
      
      if (companyData) {
        this.allData.push(companyData);
      }
      
      // Save progress periodically
      if (this.allData.length % 3 === 0) {
        await this.saveProgress();
      }
    }
    
    console.log(`\n✅ Completed scraping ${this.allData.length} companies`);
  }

  async saveProgress() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const progressFile = path.join(__dirname, `../data/scraping-progress-${timestamp}.json`);
    
    const progressData = {
      timestamp: new Date().toISOString(),
      companiesScraped: this.allData.length,
      totalShifts: this.allData.reduce((sum, c) => sum + c.summary.totalShifts, 0),
      errors: this.errors.length,
      data: this.allData
    };
    
    await fs.writeFile(progressFile, JSON.stringify(progressData, null, 2));
    console.log(`💾 Progress saved: ${this.allData.length} companies, ${progressData.totalShifts} shifts`);
  }

  async saveResults() {
    console.log('💾 Saving final results...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(__dirname, '../data/scraped');
    
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate comprehensive results
    const results = {
      metadata: {
        scrapedAt: new Date().toISOString(),
        totalCompanies: this.allData.length,
        totalShifts: this.allData.reduce((sum, c) => sum + c.summary.totalShifts, 0),
        totalTeams: this.allData.reduce((sum, c) => sum + c.summary.totalTeams, 0),
        errors: this.errors.length,
        uniqueShiftTypes: [...new Set(this.allData.flatMap(c => c.summary.shiftTypes))]
      },
      companies: this.allData,
      errors: this.errors,
      statistics: this.generateStatistics()
    };
    
    // Save complete data
    const mainFile = path.join(outputDir, `complete-shift-data-${timestamp}.json`);
    await fs.writeFile(mainFile, JSON.stringify(results, null, 2));
    
    // Create app-ready format
    const appData = this.createAppReadyFormat();
    const appFile = path.join(outputDir, `app-ready-shifts-${timestamp}.json`);
    await fs.writeFile(appFile, JSON.stringify(appData, null, 2));
    
    // Create SSAB-specific data for integration
    const ssabData = this.createSSABIntegrationData();
    const ssabFile = path.join(outputDir, `ssab-integration-data-${timestamp}.json`);
    await fs.writeFile(ssabFile, JSON.stringify(ssabData, null, 2));
    
    console.log(`📁 Results saved to ${outputDir}/`);
    console.log(`📊 Final statistics:`);
    console.log(`   🏭 Companies: ${results.metadata.totalCompanies}`);
    console.log(`   👥 Teams: ${results.metadata.totalTeams}`);
    console.log(`   📅 Total shifts: ${results.metadata.totalShifts}`);
    console.log(`   🔤 Shift types: ${results.metadata.uniqueShiftTypes.join(', ')}`);
    
    return results;
  }

  createAppReadyFormat() {
    const appData = {
      companies: [],
      shiftPatterns: {},
      metadata: {
        extractedAt: new Date().toISOString(),
        totalCompanies: this.allData.length
      }
    };
    
    this.allData.forEach(company => {
      const companyEntry = {
        name: company.company,
        teams: company.teams.map(team => ({
          name: team.team,
          url: team.url,
          shiftPattern: this.extractShiftPattern(team.shifts),
          shiftTypes: team.metadata.shiftTypes,
          dateRange: team.metadata.dateRange,
          totalShifts: team.shifts.length
        }))
      };
      
      appData.companies.push(companyEntry);
      
      // Create pattern library
      company.teams.forEach(team => {
        const pattern = this.extractShiftPattern(team.shifts);
        const patternKey = `${company.company}-${team.team}`;
        appData.shiftPatterns[patternKey] = {
          pattern: pattern,
          cycleLength: pattern.length,
          shiftTypes: team.metadata.shiftTypes
        };
      });
    });
    
    return appData;
  }

  createSSABIntegrationData() {
    const ssabCompanies = this.allData.filter(c => 
      c.company.toLowerCase().includes('ssab')
    );
    
    const ssabData = {
      companies: ssabCompanies,
      patterns: {},
      mappingGuide: {
        'F': { name: 'Förmiddag', time: '06:00-14:00' },
        'E': { name: 'Eftermiddag', time: '14:00-22:00' },
        'N': { name: 'Natt', time: '22:00-06:00' },
        'L': { name: 'Ledigt', time: null }
      },
      integrationNotes: 'Data extracted from skiftschema.se for SSAB teams. Patterns can be integrated into the existing SSAB calculation system.'
    };
    
    ssabCompanies.forEach(company => {
      company.teams.forEach(team => {
        const pattern = this.extractShiftPattern(team.shifts);
        ssabData.patterns[`${company.company}_${team.team}`] = pattern;
      });
    });
    
    return ssabData;
  }

  extractShiftPattern(shifts) {
    if (!shifts || shifts.length === 0) return [];
    
    // Sort shifts by date
    const sortedShifts = shifts.sort((a, b) => a.date.localeCompare(b.date));
    
    // Extract just the shift types to find repeating pattern
    const shiftSequence = sortedShifts.map(s => s.shiftType);
    
    // Try to find repeating cycle (common cycles: 3, 4, 5, 6, 7, 14, 21 days)
    const cycleLengths = [3, 4, 5, 6, 7, 14, 21];
    
    for (const cycleLength of cycleLengths) {
      if (shiftSequence.length >= cycleLength * 2) {
        const firstCycle = shiftSequence.slice(0, cycleLength);
        const secondCycle = shiftSequence.slice(cycleLength, cycleLength * 2);
        
        if (JSON.stringify(firstCycle) === JSON.stringify(secondCycle)) {
          return firstCycle;
        }
      }
    }
    
    // If no clear pattern, return first 7 days or all if less
    return shiftSequence.slice(0, Math.min(7, shiftSequence.length));
  }

  generateStatistics() {
    const stats = {
      companiesScraped: this.allData.length,
      totalTeams: this.allData.reduce((sum, c) => sum + c.summary.totalTeams, 0),
      totalShifts: this.allData.reduce((sum, c) => sum + c.summary.totalShifts, 0),
      shiftTypeDistribution: {},
      patternLengths: {},
      errorRate: (this.errors.length / (this.allData.length + this.errors.length) * 100).toFixed(2) + '%'
    };
    
    // Analyze shift type distribution
    this.allData.forEach(company => {
      company.summary.shiftTypes.forEach(type => {
        stats.shiftTypeDistribution[type] = (stats.shiftTypeDistribution[type] || 0) + 1;
      });
    });
    
    return stats;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.scrapeTargetCompanies();
      const results = await this.saveResults();
      
      return results;
      
    } catch (error) {
      console.error('💥 Scraping failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// CLI execution
if (require.main === module) {
  const scraper = new WorkingSkiftSchemaScraper();
  
  scraper.run()
    .then(results => {
      console.log('\n🎉 Scraping completed successfully!');
      console.log(`📈 Final results: ${results.metadata.totalCompanies} companies, ${results.metadata.totalShifts} shifts`);
    })
    .catch(error => {
      console.error('💥 Scraping failed:', error);
      process.exit(1);
    });
}

module.exports = WorkingSkiftSchemaScraper;