#!/usr/bin/env node

/**
 * Skiftschema.se Comprehensive Scraper
 * Extracts all companies, departments, and shift schedules from skiftschema.se
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class SkiftSchemaScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'https://skiftschema.se';
    this.companies = [];
    this.allSchedules = [];
    this.errors = [];
    this.scrapedCount = 0;
    this.totalUrls = 0;
  }

  async initialize() {
    console.log('🚀 Initializing Skiftschema.se scraper...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for production
      defaultViewport: { width: 1920, height: 1080 },
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

    this.page = await this.browser.newPage();
    
    // Set user agent to avoid blocking
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Set reasonable timeout
    this.page.setDefaultTimeout(30000);
  }

  async discoverAllCompanies() {
    console.log('🔍 Discovering all companies and shift teams...');
    
    try {
      await this.page.goto(this.baseUrl);
      
      // Extract all company links from the main page
      const companies = await this.page.evaluate(() => {
        const links = [];
        
        // Look for all schema links
        const schemaLinks = document.querySelectorAll('a[href*="/schema/"]');
        
        schemaLinks.forEach(link => {
          const href = link.href;
          const match = href.match(/\/schema\/([^\/]+)/);
          if (match) {
            const companyId = match[1];
            const text = link.textContent?.trim() || '';
            
            links.push({
              companyId,
              url: href,
              displayName: text,
              fullUrl: href
            });
          }
        });
        
        return links;
      });

      console.log(`📊 Found ${companies.length} company links`);
      
      // Group by company and extract shift teams
      const companyMap = new Map();
      
      companies.forEach(item => {
        const baseCompany = item.companyId.replace(/_(a|b|c|d|e|f|1|2|3|4|5)$/i, '');
        
        if (!companyMap.has(baseCompany)) {
          companyMap.set(baseCompany, {
            companyId: baseCompany,
            displayName: item.displayName.split(' - ')[0] || baseCompany,
            shifts: [],
            urls: []
          });
        }
        
        const company = companyMap.get(baseCompany);
        
        // Extract shift identifier
        const shiftMatch = item.url.match(/\/schema\/[^\/]+\/(.+)$/);
        const shift = shiftMatch ? shiftMatch[1] : 'main';
        
        company.shifts.push(shift);
        company.urls.push(item.url);
      });
      
      this.companies = Array.from(companyMap.values());
      this.totalUrls = companies.length;
      
      console.log(`🏭 Discovered ${this.companies.length} unique companies with ${this.totalUrls} total shift schedules`);
      
      return this.companies;
      
    } catch (error) {
      console.error('❌ Error discovering companies:', error);
      this.errors.push({ type: 'discovery', error: error.message });
      return [];
    }
  }

  async scrapeShiftSchedule(url, companyName = '', shift = '') {
    try {
      console.log(`📅 Scraping: ${companyName} - ${shift} (${url})`);
      
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      
      // Wait for FullCalendar to load
      await this.page.waitForSelector('.fc-view-container, .fc-day-grid', { timeout: 15000 });
      
      // Additional wait for content to stabilize
      await this.delay(2000);
      
      const scheduleData = await this.page.evaluate(() => {
        const data = {
          schedule: [],
          metadata: {
            scrapedAt: new Date().toISOString(),
            shiftTypes: new Set(),
            patterns: [],
            hasFullCalendar: false,
            teamTabs: []
          }
        };
        
        // Check if FullCalendar is present
        data.metadata.hasFullCalendar = !!document.querySelector('.fc-view-container');
        
        // Extract team navigation links if available
        const teamLinks = document.querySelectorAll('a[href*="/schema/"]');
        teamLinks.forEach(link => {
          const href = link.href;
          const text = link.textContent?.trim();
          if (text && href) {
            data.metadata.teamTabs.push({ text, href });
          }
        });
        
        // Extract calendar data using FullCalendar selectors
        const dateCells = document.querySelectorAll('td.fc-day[data-date], .fc-day-top[data-date]');
        
        dateCells.forEach((cell, index) => {
          const dateAttr = cell.getAttribute('data-date');
          
          // Look for shift events within this date cell
          const shiftEvents = cell.querySelectorAll('.fc-event, .fc-content');
          
          if (shiftEvents.length > 0) {
            shiftEvents.forEach(event => {
              const text = event.textContent?.trim();
              const classList = Array.from(event.classList);
              
              // Extract shift type from text or classes
              let shiftType = text?.match(/^[ABCDEFNFL]$/)?.[0];
              if (!shiftType && text) {
                // Check for common Swedish shift patterns
                shiftType = text.match(/^(dag|natt|fm|em|helg|fri|ledigt)$/i)?.[0];
              }
              
              data.schedule.push({
                index,
                date: dateAttr,
                shiftType: shiftType || text,
                element: event.tagName,
                classes: classList,
                text: text,
                hasEvent: true
              });
              
              if (shiftType) {
                data.metadata.shiftTypes.add(shiftType);
              }
            });
          } else {
            // Check if the cell itself contains shift information
            const cellText = cell.textContent?.trim();
            const cellClasses = Array.from(cell.classList);
            
            // Look for shift indicators in cell classes or text
            const shiftFromClass = cellClasses.find(cls => 
              /^(dag|natt|fm|em|helg|fri|a|b|c|d|e|f|n|fl|shift)$/i.test(cls)
            );
            
            let shiftType = cellText?.match(/^[ABCDEFNFL]$/)?.[0] || shiftFromClass;
            
            if (dateAttr) {
              data.schedule.push({
                index,
                date: dateAttr,
                shiftType: shiftType || null,
                element: cell.tagName,
                classes: cellClasses,
                text: cellText,
                hasEvent: false
              });
              
              if (shiftType) {
                data.metadata.shiftTypes.add(shiftType);
              }
            }
          }
        });
        
        // If no data found with FullCalendar selectors, try alternative selectors
        if (data.schedule.length === 0) {
          console.log('No FullCalendar data found, trying alternative selectors...');
          
          // Try table-based approach
          const tableRows = document.querySelectorAll('table tr, .schedule-row, .calendar-row');
          tableRows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td, .day-cell, .shift-cell');
            cells.forEach((cell, cellIndex) => {
              const text = cell.textContent?.trim();
              const classList = Array.from(cell.classList);
              
              // Look for shift patterns in text
              const shiftMatch = text?.match(/^[ABCDEFNFL]$|^(dag|natt|fm|em|helg|fri|ledigt)$/i);
              
              if (shiftMatch) {
                data.schedule.push({
                  index: `${rowIndex}-${cellIndex}`,
                  date: null, // No date info in table format
                  shiftType: shiftMatch[0],
                  element: cell.tagName,
                  classes: classList,
                  text: text,
                  hasEvent: false,
                  tableFormat: true
                });
                
                data.metadata.shiftTypes.add(shiftMatch[0]);
              }
            });
          });
        }
        
        // Convert Set to Array for JSON serialization
        data.metadata.shiftTypes = Array.from(data.metadata.shiftTypes);
        
        // Extract calendar headers for day mapping
        const headers = [];
        document.querySelectorAll('.fc-day-header, th, .calendar-header, .day-header').forEach(header => {
          const text = header.textContent?.trim();
          if (text && /^(mån|tis|ons|tor|fre|lör|sön|måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag)/i.test(text)) {
            headers.push(text);
          }
        });
        
        data.metadata.weekHeaders = headers;
        
        return data;
      });
      
      // Add metadata about the scraping
      scheduleData.metadata.url = url;
      scheduleData.metadata.company = companyName;
      scheduleData.metadata.shift = shift;
      scheduleData.metadata.scheduleLength = scheduleData.schedule.length;
      
      this.scrapedCount++;
      console.log(`✅ Scraped ${companyName} - ${shift} (${scheduleData.schedule.length} entries) [${this.scrapedCount}/${this.totalUrls}]`);
      
      // If this is a multi-team company (like SSAB), try to scrape individual team data
      if (scheduleData.metadata.teamTabs.length > 1 && shift === 'main') {
        console.log(`🔄 Found ${scheduleData.metadata.teamTabs.length} team tabs, scraping individual teams...`);
        scheduleData.teamSchedules = await this.scrapeTeamTabs(scheduleData.metadata.teamTabs, companyName);
      }
      
      return scheduleData;
      
    } catch (error) {
      console.error(`❌ Error scraping ${url}:`, error.message);
      this.errors.push({
        type: 'scraping',
        url,
        company: companyName,
        shift,
        error: error.message
      });
      return null;
    }
  }

  async scrapeTeamTabs(teamTabs, companyName) {
    const teamSchedules = [];
    
    for (const tab of teamTabs.slice(0, 5)) { // Limit to first 5 teams to avoid infinite loops
      try {
        console.log(`   📋 Scraping team tab: ${tab.text} (${tab.href})`);
        
        await this.page.goto(tab.href, { waitUntil: 'networkidle2' });
        await this.page.waitForSelector('.fc-view-container, .fc-day-grid', { timeout: 10000 });
        await this.delay(2000);
        
        const teamData = await this.page.evaluate(() => {
          const schedule = [];
          const shiftTypes = new Set();
          
          // Extract team-specific schedule data
          const dateCells = document.querySelectorAll('td.fc-day[data-date], .fc-day-top[data-date]');
          
          dateCells.forEach((cell, index) => {
            const dateAttr = cell.getAttribute('data-date');
            const shiftEvents = cell.querySelectorAll('.fc-event, .fc-content');
            
            if (shiftEvents.length > 0) {
              shiftEvents.forEach(event => {
                const text = event.textContent?.trim();
                let shiftType = text?.match(/^[ABCDEFNFL]$/)?.[0] || 
                              text?.match(/^(dag|natt|fm|em|helg|fri|ledigt)$/i)?.[0];
                
                if (shiftType) {
                  schedule.push({
                    date: dateAttr,
                    shiftType: shiftType,
                    text: text
                  });
                  shiftTypes.add(shiftType);
                }
              });
            }
          });
          
          return {
            schedule,
            shiftTypes: Array.from(shiftTypes),
            totalEntries: schedule.length
          };
        });
        
        teamSchedules.push({
          team: tab.text,
          url: tab.href,
          ...teamData
        });
        
        console.log(`     ✅ Team ${tab.text}: ${teamData.totalEntries} shift entries`);
        
      } catch (error) {
        console.error(`     ❌ Error scraping team ${tab.text}:`, error.message);
        this.errors.push({
          type: 'team-scraping',
          team: tab.text,
          url: tab.href,
          company: companyName,
          error: error.message
        });
      }
    }
    
    return teamSchedules;
  }

  async scrapeAllSchedules() {
    console.log('🔄 Starting comprehensive schedule scraping...');
    
    if (this.companies.length === 0) {
      await this.discoverAllCompanies();
    }
    
    for (const company of this.companies) {
      console.log(`\n🏭 Processing company: ${company.displayName}`);
      
      const companySchedules = [];
      
      for (const url of company.urls) {
        // Extract shift from URL
        const shiftMatch = url.match(/\/([^\/]+)$/);
        const shift = shiftMatch ? shiftMatch[1] : 'main';
        
        const scheduleData = await this.scrapeShiftSchedule(url, company.displayName, shift);
        
        if (scheduleData) {
          companySchedules.push(scheduleData);
        }
        
        // Add delay to be respectful to the server
        await this.delay(1000);
      }
      
      this.allSchedules.push({
        company: company.displayName,
        companyId: company.companyId,
        shifts: company.shifts,
        schedules: companySchedules,
        totalShifts: companySchedules.length
      });
      
      // Save progress periodically
      if (this.allSchedules.length % 10 === 0) {
        await this.saveProgress();
      }
    }
    
    console.log(`\n🎉 Scraping completed! Processed ${this.scrapedCount} schedules from ${this.companies.length} companies`);
  }

  async saveProgress() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const progressFile = path.join(__dirname, `scraping-progress-${timestamp}.json`);
    
    const progressData = {
      timestamp: new Date().toISOString(),
      scrapedCount: this.scrapedCount,
      totalUrls: this.totalUrls,
      companies: this.companies.length,
      allSchedules: this.allSchedules,
      errors: this.errors,
      statistics: this.generateStatistics()
    };
    
    await fs.writeFile(progressFile, JSON.stringify(progressData, null, 2));
    console.log(`💾 Progress saved to ${progressFile}`);
  }

  async saveResults() {
    console.log('💾 Saving results...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(__dirname, '../data/scraped');
    
    // Create output directory
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    // Save complete dataset
    const completeData = {
      metadata: {
        scrapedAt: new Date().toISOString(),
        totalCompanies: this.companies.length,
        totalSchedules: this.scrapedCount,
        totalUrls: this.totalUrls,
        errors: this.errors.length
      },
      companies: this.companies,
      schedules: this.allSchedules,
      errors: this.errors,
      statistics: this.generateStatistics()
    };
    
    const completeFile = path.join(outputDir, `complete-skiftschema-data-${timestamp}.json`);
    await fs.writeFile(completeFile, JSON.stringify(completeData, null, 2));
    
    // Save companies list separately
    const companiesFile = path.join(outputDir, `companies-${timestamp}.json`);
    await fs.writeFile(companiesFile, JSON.stringify(this.companies, null, 2));
    
    // Save processed schedules for app integration
    const processedSchedules = this.processSchedulesForApp();
    const appDataFile = path.join(outputDir, `app-ready-schedules-${timestamp}.json`);
    await fs.writeFile(appDataFile, JSON.stringify(processedSchedules, null, 2));
    
    // Save statistics
    const statsFile = path.join(outputDir, `statistics-${timestamp}.json`);
    await fs.writeFile(statsFile, JSON.stringify(this.generateStatistics(), null, 2));
    
    console.log(`✅ Results saved to ${outputDir}/`);
    console.log(`📁 Files created:`);
    console.log(`   - ${completeFile}`);
    console.log(`   - ${companiesFile}`);
    console.log(`   - ${appDataFile}`);
    console.log(`   - ${statsFile}`);
    
    return {
      completeData,
      processedSchedules,
      statistics: this.generateStatistics()
    };
  }

  processSchedulesForApp() {
    console.log('🔄 Processing schedules for app integration...');
    
    const appSchedules = [];
    
    this.allSchedules.forEach(companyData => {
      companyData.schedules.forEach(schedule => {
        if (schedule && schedule.schedule.length > 0) {
          // Extract shift pattern
          const pattern = this.extractShiftPattern(schedule.schedule);
          
          appSchedules.push({
            company: companyData.company,
            companyId: companyData.companyId,
            shift: schedule.metadata.shift,
            url: schedule.metadata.url,
            shiftTypes: schedule.metadata.shiftTypes,
            pattern: pattern,
            cycleLength: pattern.length,
            metadata: {
              scrapedAt: schedule.metadata.scrapedAt,
              totalEntries: schedule.schedule.length,
              hasDateMapping: schedule.metadata.weekHeaders?.length > 0
            }
          });
        }
      });
    });
    
    return appSchedules;
  }

  extractShiftPattern(scheduleEntries) {
    // Extract repeating shift pattern from schedule data
    const shifts = scheduleEntries
      .map(entry => entry.shiftType)
      .filter(type => type && type.length <= 3) // Filter valid shift codes
      .slice(0, 50); // Take first 50 entries to find pattern
    
    if (shifts.length === 0) return [];
    
    // Try to find repeating cycle (common cycles: 3, 4, 5, 6, 7, 14, 21 days)
    const cycleLengths = [3, 4, 5, 6, 7, 14, 21];
    
    for (const cycleLength of cycleLengths) {
      if (shifts.length >= cycleLength * 2) {
        const firstCycle = shifts.slice(0, cycleLength);
        const secondCycle = shifts.slice(cycleLength, cycleLength * 2);
        
        if (JSON.stringify(firstCycle) === JSON.stringify(secondCycle)) {
          return firstCycle;
        }
      }
    }
    
    // If no clear pattern, return first 7 days
    return shifts.slice(0, Math.min(7, shifts.length));
  }

  generateStatistics() {
    const stats = {
      totalCompanies: this.companies.length,
      totalSchedules: this.scrapedCount,
      successRate: this.totalUrls > 0 ? (this.scrapedCount / this.totalUrls * 100).toFixed(2) + '%' : '0%',
      errors: this.errors.length,
      errorRate: this.totalUrls > 0 ? (this.errors.length / this.totalUrls * 100).toFixed(2) + '%' : '0%',
      companiesByScheduleCount: {},
      shiftTypesDistribution: {},
      patternsFound: 0
    };
    
    // Analyze companies by schedule count
    this.allSchedules.forEach(company => {
      const count = company.totalShifts;
      stats.companiesByScheduleCount[count] = (stats.companiesByScheduleCount[count] || 0) + 1;
    });
    
    // Analyze shift types distribution
    this.allSchedules.forEach(company => {
      company.schedules.forEach(schedule => {
        if (schedule && schedule.metadata.shiftTypes) {
          schedule.metadata.shiftTypes.forEach(type => {
            stats.shiftTypesDistribution[type] = (stats.shiftTypesDistribution[type] || 0) + 1;
          });
        }
      });
    });
    
    return stats;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.discoverAllCompanies();
      await this.scrapeAllSchedules();
      const results = await this.saveResults();
      
      console.log('\n📊 Final Statistics:');
      const stats = this.generateStatistics();
      console.log(JSON.stringify(stats, null, 2));
      
      return results;
      
    } catch (error) {
      console.error('💥 Fatal error:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// CLI execution
if (require.main === module) {
  const scraper = new SkiftSchemaScraper();
  
  scraper.run()
    .then(results => {
      console.log('\n🎉 Scraping completed successfully!');
      console.log(`📈 Scraped ${results.statistics.totalSchedules} schedules from ${results.statistics.totalCompanies} companies`);
    })
    .catch(error => {
      console.error('💥 Scraping failed:', error);
      process.exit(1);
    });
}

module.exports = SkiftSchemaScraper;