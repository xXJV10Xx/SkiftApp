#!/usr/bin/env node

/**
 * Direct extraction using the exact method that worked in investigation
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function directExtractSSAB() {
  console.log('🎯 Direct extraction using proven method...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Test SSAB A-lag specifically
    const url = 'https://skiftschema.se/schema/ssab_5skift/A';
    console.log(`📅 Extracting from: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.fc-view-container', { timeout: 15000 });
    await page.waitForTimeout(3000); // Wait for events to render
    
    // Use the exact extraction code that worked in investigation
    const result = await page.evaluate(() => {
      const shifts = [];
      
      // Look for event containers in calendar cells
      const eventContainers = document.querySelectorAll('.fc-event-container');
      console.log(`Found ${eventContainers.length} event containers`);
      
      eventContainers.forEach((container, index) => {
        const events = container.querySelectorAll('.fc-event');
        console.log(`Container ${index} has ${events.length} events`);
        
        events.forEach((event, eventIndex) => {
          const content = event.textContent?.trim();
          const title = event.querySelector('.fc-title, .fc-event-title')?.textContent?.trim();
          const time = event.querySelector('.fc-time')?.textContent?.trim();
          
          // Get the date from the parent cell
          const parentCell = event.closest('td[data-date]');
          const date = parentCell ? parentCell.getAttribute('data-date') : null;
          
          console.log(`Event ${eventIndex}: "${content}" on ${date}`);
          
          if (content && date) {
            let shiftType = null;
            
            // Map Swedish text to shift codes
            if (content.includes('Förmiddag') || content.includes('06:00')) {
              shiftType = 'F';
            } else if (content.includes('Eftermiddag') || content.includes('14:00')) {
              shiftType = 'E';
            } else if (content.includes('Natt') || content.includes('22:00')) {
              shiftType = 'N';
            } else if (content.includes('Ledigt')) {
              shiftType = 'L';
            }
            
            shifts.push({
              date: date,
              shiftType: shiftType,
              content: content,
              title: title,
              time: time
            });
          }
        });
      });
      
      // Also try alternative approach - look for events directly
      const allEvents = document.querySelectorAll('.fc-event');
      console.log(`Total .fc-event elements found: ${allEvents.length}`);
      
      allEvents.forEach((event, index) => {
        const content = event.textContent?.trim();
        const parentCell = event.closest('td[data-date]');
        const date = parentCell ? parentCell.getAttribute('data-date') : null;
        
        console.log(`Direct event ${index}: "${content}" on ${date}`);
        
        if (content && date && !shifts.find(s => s.date === date && s.content === content)) {
          let shiftType = null;
          
          if (content.includes('Förmiddag') || content.includes('06:00')) {
            shiftType = 'F';
          } else if (content.includes('Eftermiddag') || content.includes('14:00')) {
            shiftType = 'E';
          } else if (content.includes('Natt') || content.includes('22:00')) {
            shiftType = 'N';
          } else if (content.includes('Ledigt')) {
            shiftType = 'L';
          }
          
          shifts.push({
            date: date,
            shiftType: shiftType,
            content: content,
            method: 'direct'
          });
        }
      });
      
      return {
        shifts: shifts,
        totalEventContainers: eventContainers.length,
        totalEvents: allEvents.length,
        extractedShifts: shifts.length
      };
    });
    
    console.log(`📊 Extraction results:`);
    console.log(`   Event containers found: ${result.totalEventContainers}`);
    console.log(`   Total events found: ${result.totalEvents}`);
    console.log(`   Shifts extracted: ${result.extractedShifts}`);
    
    if (result.shifts.length > 0) {
      console.log('\n🎉 SUCCESS! Found shift data:');
      
      // Group by shift type
      const byType = {};
      result.shifts.forEach(shift => {
        if (!byType[shift.shiftType]) byType[shift.shiftType] = [];
        byType[shift.shiftType].push(shift);
      });
      
      Object.keys(byType).forEach(type => {
        console.log(`   ${type}: ${byType[type].length} days`);
      });
      
      // Save the working data
      const outputDir = path.join(__dirname, '../data/scraped');
      await fs.mkdir(outputDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = path.join(outputDir, `working-extract-${timestamp}.json`);
      
      const outputData = {
        extractedAt: new Date().toISOString(),
        url: url,
        team: 'A-lag',
        company: 'SSAB Borlänge 5-skift',
        shifts: result.shifts,
        statistics: {
          totalShifts: result.shifts.length,
          shiftTypes: Object.keys(byType),
          dateRange: {
            start: Math.min(...result.shifts.map(s => s.date)),
            end: Math.max(...result.shifts.map(s => s.date))
          }
        }
      };
      
      await fs.writeFile(filename, JSON.stringify(outputData, null, 2));
      console.log(`💾 Data saved to: ${filename}`);
      
      return outputData;
      
    } else {
      console.log('❌ No shift data found - need to investigate further');
      
      // Take screenshot for debugging
      await page.screenshot({ 
        path: path.join(__dirname, '../data/debug-screenshot.png'),
        fullPage: true 
      });
      
      return null;
    }
    
  } finally {
    await browser.close();
  }
}

// Run the extraction
if (require.main === module) {
  directExtractSSAB()
    .then(result => {
      if (result) {
        console.log('\n✅ Direct extraction successful!');
        console.log(`📈 Extracted ${result.shifts.length} shifts for ${result.team}`);
      } else {
        console.log('\n❌ Direct extraction failed');
      }
    })
    .catch(error => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}

module.exports = { directExtractSSAB };