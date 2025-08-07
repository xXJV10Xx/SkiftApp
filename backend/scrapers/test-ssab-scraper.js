#!/usr/bin/env node

/**
 * Test SSAB Scraper - Focused test for SSAB schedules
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class TestSSABScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'https://skiftschema.se';
  }

  async initialize() {
    console.log('🚀 Initializing SSAB test scraper...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Keep visible for debugging
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    this.page.setDefaultTimeout(30000);
  }

  async testSSABSchedule() {
    console.log('🔍 Testing SSAB 5-skift schedule...');
    
    try {
      // Test main SSAB page
      const url = 'https://skiftschema.se/schema/ssab_5skift/';
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      
      console.log('📄 Page loaded, waiting for FullCalendar...');
      
      // Wait for FullCalendar
      await this.page.waitForSelector('.fc-view-container, .fc-day-grid', { timeout: 15000 });
      
      // Take screenshot for debugging
      await this.page.screenshot({ 
        path: path.join(__dirname, '../data/ssab-main-page.png'),
        fullPage: true 
      });
      
      console.log('📸 Screenshot saved');
      
      // Extract initial data
      const mainData = await this.page.evaluate(() => {
        const data = {
          hasFullCalendar: !!document.querySelector('.fc-view-container'),
          title: document.title,
          url: window.location.href,
          teamTabs: [],
          dateCells: 0,
          shiftEvents: 0,
          weekHeaders: []
        };
        
        // Find team navigation
        const teamLinks = document.querySelectorAll('a[href*="/schema/ssab_5skift/"]');
        teamLinks.forEach(link => {
          const href = link.href;
          const text = link.textContent?.trim();
          if (text && href && !data.teamTabs.find(t => t.href === href)) {
            data.teamTabs.push({ text, href });
          }
        });
        
        // Count calendar elements
        data.dateCells = document.querySelectorAll('td.fc-day[data-date], .fc-day-top[data-date]').length;
        data.shiftEvents = document.querySelectorAll('.fc-event, .fc-content').length;
        
        // Extract headers
        document.querySelectorAll('.fc-day-header, th, .calendar-header').forEach(header => {
          const text = header.textContent?.trim();
          if (text) {
            data.weekHeaders.push(text);
          }
        });
        
        return data;
      });
      
      console.log('📊 Main page analysis:', JSON.stringify(mainData, null, 2));
      
      // Test individual team schedules
      const teamResults = [];
      
      for (const team of mainData.teamTabs.slice(0, 5)) {
        console.log(`\n🏷️  Testing team: ${team.text}`);
        
        try {
          await this.page.goto(team.href, { waitUntil: 'networkidle2' });
          await this.page.waitForSelector('.fc-view-container, .fc-day-grid', { timeout: 10000 });
          
          // Wait for potential AJAX data loading
          await this.page.waitForTimeout(3000);
          
          const teamData = await this.page.evaluate(() => {
            const result = {
              url: window.location.href,
              title: document.title,
              dateCells: 0,
              shiftEvents: 0,
              schedule: [],
              shiftTypes: new Set(),
              hasData: false
            };
            
            // Count elements
            const dateCells = document.querySelectorAll('td.fc-day[data-date], .fc-day-top[data-date]');
            result.dateCells = dateCells.length;
            
            // Extract schedule data
            dateCells.forEach((cell, index) => {
              const dateAttr = cell.getAttribute('data-date');
              
              // Check for events in cell
              const events = cell.querySelectorAll('.fc-event, .fc-content');
              result.shiftEvents += events.length;
              
              if (events.length > 0) {
                events.forEach(event => {
                  const text = event.textContent?.trim();
                  result.schedule.push({
                    date: dateAttr,
                    text: text,
                    hasEvent: true
                  });
                  
                  if (text) {
                    result.shiftTypes.add(text);
                    result.hasData = true;
                  }
                });
              } else {
                // Check cell content directly
                const cellText = cell.textContent?.trim();
                const cellClasses = Array.from(cell.classList);
                
                // Look for shift indicators
                if (cellText && dateAttr) {
                  const shiftMatch = cellText.match(/[ABCDEFNFL]|dag|natt|fm|em|helg|fri/i);
                  if (shiftMatch) {
                    result.schedule.push({
                      date: dateAttr,
                      text: cellText,
                      classes: cellClasses,
                      hasEvent: false
                    });
                    
                    result.shiftTypes.add(shiftMatch[0]);
                    result.hasData = true;
                  }
                }
              }
            });
            
            result.shiftTypes = Array.from(result.shiftTypes);
            return result;
          });
          
          teamResults.push({
            team: team.text,
            url: team.href,
            ...teamData
          });
          
          console.log(`   📈 ${team.text}: ${teamData.schedule.length} entries, ${teamData.shiftTypes.length} shift types`);
          console.log(`   🎯 Shift types found: ${teamData.shiftTypes.join(', ')}`);
          
          // Take screenshot of team page
          await this.page.screenshot({ 
            path: path.join(__dirname, `../data/ssab-team-${team.text.replace(/[^a-zA-Z0-9]/g, '')}.png`),
            fullPage: false 
          });
          
        } catch (error) {
          console.error(`   ❌ Error testing ${team.text}:`, error.message);
          teamResults.push({
            team: team.text,
            url: team.href,
            error: error.message
          });
        }
      }
      
      // Save results
      const results = {
        timestamp: new Date().toISOString(),
        mainData,
        teamResults,
        summary: {
          totalTeams: teamResults.length,
          teamsWithData: teamResults.filter(t => t.hasData).length,
          totalScheduleEntries: teamResults.reduce((sum, t) => sum + (t.schedule?.length || 0), 0)
        }
      };
      
      const resultsFile = path.join(__dirname, '../data/ssab-test-results.json');
      await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
      
      console.log('\n📊 Test Results Summary:');
      console.log(`   🏭 Teams tested: ${results.summary.totalTeams}`);
      console.log(`   ✅ Teams with data: ${results.summary.teamsWithData}`);
      console.log(`   📅 Total schedule entries: ${results.summary.totalScheduleEntries}`);
      console.log(`   💾 Results saved to: ${resultsFile}`);
      
      return results;
      
    } catch (error) {
      console.error('💥 Test failed:', error);
      throw error;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      const results = await this.testSSABSchedule();
      return results;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test
if (require.main === module) {
  const scraper = new TestSSABScraper();
  
  scraper.run()
    .then(results => {
      console.log('\n🎉 SSAB test completed successfully!');
      
      if (results.summary.teamsWithData > 0) {
        console.log('✅ Found shift data - scraper selectors are working!');
      } else {
        console.log('⚠️  No shift data found - may need to adjust selectors');
      }
    })
    .catch(error => {
      console.error('💥 SSAB test failed:', error);
      process.exit(1);
    });
}

module.exports = TestSSABScraper;