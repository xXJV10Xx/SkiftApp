import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

interface ShiftSchedule {
  företag: string;
  år: number;
  skiftlag: string;
  schema: Array<{
    datum: string;
    skift: string;
  }>;
}

// Import our existing companies data
import { SHIFT_TYPES, calculateShiftForDate } from './data/companies';

// Define companies manually based on the data structure
const companies = [
  {
    id: 'VOLVO',
    name: 'VOLVO',
    shifts: ['VOLVO_3SKIFT'],
    teams: ['Lag 1', 'Lag 2', 'Lag 3', 'Lag 4']
  },
  {
    id: 'SCA',
    name: 'SCA',
    shifts: ['SCA_3SKIFT'],
    teams: ['A', 'B', 'C', 'D']
  },
  {
    id: 'SSAB',
    name: 'SSAB',
    shifts: ['SSAB_3SKIFT'],
    teams: ['1', '2', '3', '4']
  },
  {
    id: 'BOLIDEN',
    name: 'BOLIDEN',
    shifts: ['BOLIDEN_3SKIFT'],
    teams: ['Alpha', 'Beta', 'Gamma', 'Delta']
  },
  {
    id: 'SKANSKA',
    name: 'SKANSKA',
    shifts: ['SKANSKA_DAG'],
    teams: ['Lag 1', 'Lag 2', 'Lag 3']
  },
  {
    id: 'SANDVIK',
    name: 'SANDVIK',
    shifts: ['SANDVIK_3SKIFT'],
    teams: ['Team A', 'Team B', 'Team C', 'Team D']
  },
  {
    id: 'BARILLA',
    name: 'BARILLA SVERIGE',
    shifts: ['BARILLA_5SKIFT'],
    teams: ['1', '2', '3', '4', '5']
  },
  {
    id: 'AGA_AVESTA',
    name: 'AGA AVESTA',
    shifts: ['AGA_6SKIFT'],
    teams: ['A', 'B', 'C', 'D', 'E', 'F']
  },
  {
    id: 'ABB_HVDC',
    name: 'ABB HVDC',
    shifts: ['ABB_5SKIFT'],
    teams: ['1', '2', '3', '4', '5']
  },
  {
    id: 'AVESTA_6VECKOR',
    name: 'AVESTA 6-VECKORS',
    shifts: ['AVESTA_6VECKOR'],
    teams: ['1', '2', '3', '4', '5', '6']
  },
  {
    id: 'ARCTIC_PAPER',
    name: 'ARCTIC PAPER GRYCKSBO',
    shifts: ['ARCTIC_3SKIFT'],
    teams: ['1', '2', '3', '4', '5']
  },
  {
    id: 'UDDEHOLM',
    name: 'UDDEHOLM TOOLING',
    shifts: ['UDDEHOLM_2SKIFT'],
    teams: ['1', '2', '3']
  },
  {
    id: 'VOESTALPINE',
    name: 'VOESTALPINE PRECISION STRIP',
    shifts: ['VOESTALPINE_2SKIFT'],
    teams: ['A', 'B']
  }
];

async function generateShiftSchedulesFromData(): Promise<ShiftSchedule[]> {
  const allSchedules: ShiftSchedule[] = [];
  const currentYear = new Date().getFullYear();
  
  console.log('Generating shift schedules from existing data...');
  
  for (const company of companies) {
    console.log(`Processing company: ${company.name}`);
    
    for (const team of company.teams) {
      console.log(`Processing team: ${team}`);
      
      // Process 5 years back and 5 years forward
      for (let year = currentYear - 5; year <= currentYear + 5; year++) {
        console.log(`Processing year: ${year} for ${company.name} - ${team}`);
        
        const yearSchedule: Array<{ datum: string; skift: string }> = [];
        
        // Generate schedule for each day of the year
        for (let month = 0; month < 12; month++) {
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          
          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            
            // Calculate shift for this date using the companies data
            const shiftType = SHIFT_TYPES[company.shifts[0]];
            if (shiftType) {
              const shift = calculateShiftForDate(
                date,
                shiftType,
                team,
                new Date('2025-01-18')
              );
              
              if (shift) {
                yearSchedule.push({
                  datum: dateString,
                  skift: shift.code
                });
              }
            }
          }
        }
        
        if (yearSchedule.length > 0) {
          allSchedules.push({
            företag: company.name,
            år: year,
            skiftlag: team,
            schema: yearSchedule
          });
        }
      }
    }
  }
  
  return allSchedules;
}

async function scrapeExternalWebsite(): Promise<ShiftSchedule[]> {
  const browser = await puppeteer.launch({
    headless: false, // Set to true for production
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  
  // Navigate to the shift schedule website
  // Replace with actual URL
  await page.goto('https://skiftschema.se', { waitUntil: 'networkidle2' });
  
  const allSchedules: ShiftSchedule[] = [];
  const currentYear = new Date().getFullYear();
  
  try {
    // Get all companies from dropdown
    const companies = await page.evaluate(() => {
      const companySelect = document.querySelector('#schemaSelect') as HTMLSelectElement;
      if (!companySelect) return [];
      
      return Array.from(companySelect.options).map(option => ({
        name: option.textContent?.trim() || '',
        value: option.value
      }));
    });

    console.log(`Found ${companies.length} companies`);

    for (const company of companies) {
      if (!company.value) continue;
      
      console.log(`Processing company: ${company.name}`);
      
      // Select company
      await page.select('#schemaSelect', company.value);
      await page.waitForTimeout(2000); // Wait for page to load
      
      // Get teams for this company
      const teams = await page.evaluate(() => {
        const teamTabs = document.querySelectorAll('.team-tab');
        return Array.from(teamTabs).map(tab => 
          tab.textContent?.trim() || ''
        );
      });
      
      console.log(`Found ${teams.length} teams for ${company.name}`);
      
      for (const team of teams) {
        console.log(`Processing team: ${team}`);
        
        // Click on team tab
        await page.evaluate((teamName) => {
          const teamTabs = document.querySelectorAll('.team-tab');
          for (const tab of teamTabs) {
            if (tab.textContent?.trim() === teamName) {
              (tab as HTMLElement).click();
              break;
            }
          }
        }, team);
        
        await page.waitForTimeout(1000);
        
        // Process 5 years back and 5 years forward
        for (let year = currentYear - 5; year <= currentYear + 5; year++) {
          console.log(`Processing year: ${year} for ${company.name} - ${team}`);
          
          // Navigate to year (you may need to adjust selectors based on the actual website)
          await page.evaluate((targetYear) => {
            const yearSelect = document.querySelector('select[name="year"]') as HTMLSelectElement;
            if (yearSelect) {
              yearSelect.value = targetYear.toString();
              yearSelect.dispatchEvent(new Event('change'));
            }
          }, year);
          
          await page.waitForTimeout(1000);
          
          // Extract shift data for the entire year
          const yearSchedule = await page.evaluate((year) => {
            const schedule: Array<{ datum: string; skift: string }> = [];
            const dayCells = document.querySelectorAll('.day-cell');
            
            dayCells.forEach((cell, index) => {
              const date = new Date(year, 0, 1);
              date.setDate(date.getDate() + index);
              
              const shiftText = cell.textContent?.trim() || '';
              if (shiftText && shiftText !== '') {
                schedule.push({
                  datum: date.toISOString().split('T')[0],
                  skift: shiftText
                });
              }
            });
            
            return schedule;
          }, year);
          
          if (yearSchedule.length > 0) {
            allSchedules.push({
              företag: company.name,
              år: year,
              skiftlag: team,
              schema: yearSchedule
            });
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await browser.close();
  }
  
  return allSchedules;
}

async function main() {
  console.log('Starting shift schedule generation...');
  
  try {
    // Use our existing data to generate schedules
    const schedules = await generateShiftSchedulesFromData();
    
    // Save to JSON file
    const outputPath = path.join(process.cwd(), 'skiftschema-output.json');
    fs.writeFileSync(outputPath, JSON.stringify(schedules, null, 2));
    
    console.log(`✅ Successfully generated ${schedules.length} schedules`);
    console.log(`📁 Output saved to: ${outputPath}`);
    
    // Print summary
    const companies = [...new Set(schedules.map(s => s.företag))];
    const teams = [...new Set(schedules.map(s => s.skiftlag))];
    const years = [...new Set(schedules.map(s => s.år))];
    
    console.log('\n📊 Summary:');
    console.log(`Companies: ${companies.length}`);
    console.log(`Teams: ${teams.length}`);
    console.log(`Years: ${years.length} (${Math.min(...years)} - ${Math.max(...years)})`);
    console.log(`Total schedules: ${schedules.length}`);
    
    // Show sample data
    if (schedules.length > 0) {
      console.log('\n📋 Sample data:');
      const sample = schedules[0];
      console.log(`Company: ${sample.företag}`);
      console.log(`Team: ${sample.skiftlag}`);
      console.log(`Year: ${sample.år}`);
      console.log(`Shifts: ${sample.schema.length} days`);
      if (sample.schema.length > 0) {
        console.log(`First shift: ${sample.schema[0].datum} - ${sample.schema[0].skift}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in main:', error);
    process.exit(1);
  }
}

// Run the script
main(); 