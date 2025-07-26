const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Import teams data from teams-array.js
const TEAMS = require('../teams-array.js');

// Shift time mappings
const SHIFT_TIMES = {
  'F': { start: '06:00', end: '14:00' }, // Förmiddag
  'E': { start: '14:00', end: '22:00' }, // Eftermiddag  
  'N': { start: '22:00', end: '06:00' }, // Natt
  'L': { start: null, end: null }        // Ledigt
};

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function scrapeTeamSchedule(team) {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log(`🔍 Scraping ${team.company} ${team.team}...`);
    
    await page.goto(team.url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for calendar to load
    await page.waitForSelector('.day, .fc-day', { timeout: 10000 });
    
    // Extract shift data
    const shifts = await page.evaluate(() => {
      const shiftData = [];
      
      // Try different selectors for calendar days
      const dayElements = document.querySelectorAll('.day, .fc-day, [data-date]');
      
      dayElements.forEach(dayEl => {
        // Get date from data attribute or text content
        let dateStr = dayEl.getAttribute('data-date') || 
                     dayEl.getAttribute('data-day') ||
                     dayEl.querySelector('[data-date]')?.getAttribute('data-date');
        
        if (!dateStr) {
          // Try to extract from text content or other attributes
          const dateMatch = dayEl.textContent?.match(/\d{4}-\d{2}-\d{2}/);
          if (dateMatch) dateStr = dateMatch[0];
        }
        
        if (!dateStr) return;
        
        // Find shift indicator in this day
        const shiftEl = dayEl.querySelector('.shift, .fc-event-title, .calendar-shift') ||
                       dayEl.querySelector('[class*="shift"]') ||
                       dayEl;
        
        if (shiftEl) {
          const shiftText = shiftEl.textContent?.trim() || '';
          
          // Extract shift type (F, E, N, L)
          const shiftMatch = shiftText.match(/[FENL]/i);
          if (shiftMatch) {
            const shiftType = shiftMatch[0].toUpperCase();
            
            shiftData.push({
              date: dateStr,
              shift_type: shiftType,
              raw_text: shiftText
            });
          }
        }
      });
      
      return shiftData;
    });
    
    console.log(`  📅 Found ${shifts.length} shift entries`);
    
    // Process and enhance shift data
    const processedShifts = shifts.map(shift => ({
      team_id: team.id,
      date: shift.date,
      shift_type: shift.shift_type,
      start_time: SHIFT_TIMES[shift.shift_type]?.start,
      end_time: SHIFT_TIMES[shift.shift_type]?.end,
      raw_data: shift.raw_text
    }));
    
    return processedShifts;
    
  } catch (error) {
    console.error(`❌ Error scraping ${team.company} ${team.team}:`, error.message);
    return [];
  } finally {
    await browser.close();
  }
}

async function upsertShiftsToSupabase(shifts) {
  if (shifts.length === 0) return { success: 0, errors: 0 };
  
  try {
    const { data, error } = await supabase
      .from('shifts')
      .upsert(shifts, { 
        onConflict: 'team_id,date',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error('❌ Supabase error:', error);
      return { success: 0, errors: shifts.length };
    }
    
    return { success: shifts.length, errors: 0 };
    
  } catch (error) {
    console.error('❌ Database error:', error);
    return { success: 0, errors: shifts.length };
  }
}

async function setupDatabase() {
  console.log('🗄️ Setting up database tables...');
  
  // Create companies table
  const { error: companiesError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
  });
  
  if (companiesError) console.warn('⚠️ Companies table setup:', companiesError.message);
  
  // Create departments table
  const { error: departmentsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id),
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
  });
  
  if (departmentsError) console.warn('⚠️ Departments table setup:', departmentsError.message);
  
  // Create teams table
  const { error: teamsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        department_id INTEGER REFERENCES departments(id),
        name VARCHAR(255) NOT NULL,
        url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
  });
  
  if (teamsError) console.warn('⚠️ Teams table setup:', teamsError.message);
  
  // Create shifts table
  const { error: shiftsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS shifts (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id),
        date DATE NOT NULL,
        shift_type VARCHAR(10),
        start_time TIME,
        end_time TIME,
        raw_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, date)
      );
    `
  });
  
  if (shiftsError) console.warn('⚠️ Shifts table setup:', shiftsError.message);
  
  console.log('✅ Database setup completed');
}

async function main() {
  console.log('🚀 Starting Skiftschema.se scraper...');
  console.log(`📊 Processing ${TEAMS.length} teams`);
  
  // Setup database
  await setupDatabase();
  
  const stats = {
    teamsProcessed: 0,
    totalShifts: 0,
    successfulUpserts: 0,
    errors: 0
  };
  
  // Process teams in batches to avoid overwhelming the server
  const BATCH_SIZE = 3;
  
  for (let i = 0; i < TEAMS.length; i += BATCH_SIZE) {
    const batch = TEAMS.slice(i, i + BATCH_SIZE);
    
    console.log(`\n📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(TEAMS.length/BATCH_SIZE)}`);
    
    const batchPromises = batch.map(async (team) => {
      try {
        const shifts = await scrapeTeamSchedule(team);
        
        if (shifts.length > 0) {
          const result = await upsertShiftsToSupabase(shifts);
          
          stats.teamsProcessed++;
          stats.totalShifts += shifts.length;
          stats.successfulUpserts += result.success;
          stats.errors += result.errors;
          
          // Show sample data for first few teams
          if (stats.teamsProcessed <= 3) {
            console.log(`\n📋 Sample data for ${team.company} ${team.team}:`);
            console.table(shifts.slice(0, 3));
          }
          
          return { team, shifts: shifts.length, success: result.success };
        }
        
        return { team, shifts: 0, success: 0 };
        
      } catch (error) {
        console.error(`❌ Error processing ${team.company} ${team.team}:`, error.message);
        stats.errors++;
        return { team, shifts: 0, success: 0, error: error.message };
      }
    });
    
    await Promise.all(batchPromises);
    
    // Small delay between batches
    if (i + BATCH_SIZE < TEAMS.length) {
      console.log('⏳ Waiting 2 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Final statistics
  console.log('\n🎉 Scraping completed!');
  console.log('📊 Final Statistics:');
  console.table([
    { Metric: 'Teams Processed', Value: stats.teamsProcessed },
    { Metric: 'Total Shifts Found', Value: stats.totalShifts },
    { Metric: 'Successful Upserts', Value: stats.successfulUpserts },
    { Metric: 'Errors', Value: stats.errors },
    { Metric: 'Success Rate', Value: `${((stats.successfulUpserts / stats.totalShifts) * 100).toFixed(1)}%` }
  ]);
  
  // Show sample of recent data
  console.log('\n📋 Sample of uploaded data:');
  const { data: sampleData } = await supabase
    .from('shifts')
    .select(`
      date,
      shift_type,
      start_time,
      end_time,
      teams(name),
      teams(departments(name)),
      teams(departments(companies(name)))
    `)
    .order('date', { ascending: false })
    .limit(5);
    
  if (sampleData) {
    console.table(sampleData.map(shift => ({
      Company: shift.teams?.departments?.companies?.name,
      Team: shift.teams?.name,
      Date: shift.date,
      Shift: shift.shift_type,
      Time: shift.start_time ? `${shift.start_time}-${shift.end_time}` : 'Ledigt'
    })));
  }
}

// Run the scraper
if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { scrapeTeamSchedule, upsertShiftsToSupabase, TEAMS, SHIFT_TIMES };