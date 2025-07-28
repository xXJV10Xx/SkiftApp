const puppeteerCore = require('puppeteer-core');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Company data from companies.ts (simplified for scraping)
const COMPANIES = {
  VOLVO: {
    id: 'volvo',
    name: 'Volvo',
    teams: ['A', 'B', 'C', 'D'],
    departments: ['Produktion', 'Montering', 'Kvalitet', 'Underhåll', 'Logistik'],
    scheduleUrl: 'https://skiftschema.se/volvo'
  },
  SCA: {
    id: 'sca',
    name: 'SCA',
    teams: ['Röd', 'Blå', 'Gul', 'Grön'],
    departments: ['Massa', 'Papper', 'Underhåll', 'Kvalitet', 'Logistik'],
    scheduleUrl: 'https://skiftschema.se/sca'
  },
  SSAB: {
    id: 'ssab',
    name: 'SSAB',
    teams: ['1', '2', '3', '4', '5'],
    departments: ['Masugn', 'Stålverk', 'Varmvalsning', 'Kallvalsning', 'Underhåll'],
    scheduleUrl: 'https://skiftschema.se/ssab'
  },
  BOLIDEN: {
    id: 'boliden',
    name: 'Boliden',
    teams: ['Alpha', 'Beta', 'Gamma', 'Delta'],
    departments: ['Gruva', 'Anrikning', 'Smältverk', 'Underhåll', 'Miljö'],
    scheduleUrl: 'https://skiftschema.se/boliden'
  },
  BARILLA: {
    id: 'barilla',
    name: 'Barilla Sverige',
    teams: ['1', '2', '3', '4', '5'],
    departments: ['Produktion', 'Förpackning', 'Kvalitet', 'Underhåll', 'Lager'],
    scheduleUrl: 'https://skiftschema.se/barilla'
  },
  // Add more companies as needed...
};

/**
 * Enhanced multi-company scraping function
 * @param {Object} options - Configuration options
 * @param {Array} options.companies - Companies to scrape (default: all)
 * @param {boolean} options.syncCompanies - Whether to sync company data first
 * @param {number} options.timeout - Page timeout in milliseconds
 */
async function scrapeMultiCompanySchedules(options = {}) {
  const {
    companies = Object.keys(COMPANIES),
    syncCompanies = true,
    timeout = 20000
  } = options;

  let browser = null;
  const startTime = Date.now();
  const results = {
    totalCompanies: companies.length,
    successfulCompanies: 0,
    failedCompanies: 0,
    totalRecords: 0,
    companies: {}
  };

  try {
    console.log('🏭 Starting multi-company schedule scraping...');
    console.log('📊 Configuration:', {
      totalCompanies: companies.length,
      companies: companies,
      syncCompanies,
      timeout,
      timestamp: new Date().toISOString()
    });

    // Validate environment
    console.log('🔍 Validating environment...');
    const envCheck = {
      supabaseUrl: process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing',
      supabaseKey: process.env.SUPABASE_KEY ? '✅ Set' : '❌ Missing',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable'
    };
    console.log('Environment check:', envCheck);

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      throw new Error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_KEY');
    }

    // Sync companies to database first
    if (syncCompanies) {
      console.log('🔄 Syncing companies to database...');
      await syncCompaniesToDatabase();
      console.log('✅ Companies synced successfully');
    }

    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await puppeteerCore.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      timeout: 30000
    });
    console.log('✅ Browser launched successfully');

    // Process each company
    for (const companyKey of companies) {
      const company = COMPANIES[companyKey];
      if (!company) {
        console.warn(`⚠️ Company ${companyKey} not found, skipping...`);
        continue;
      }

      console.log(`\n🏢 Processing company: ${company.name} (${company.id})`);
      
      try {
        const companyResult = await scrapeCompanySchedule(browser, company, timeout);
        results.companies[company.id] = companyResult;
        results.totalRecords += companyResult.totalRecords;
        results.successfulCompanies++;
        
        console.log(`✅ ${company.name} completed: ${companyResult.totalRecords} records processed`);
        
        // Log to database
        await logScrapeResult(company.id, 'success', companyResult);
        
      } catch (companyError) {
        console.error(`❌ Failed to scrape ${company.name}:`, companyError.message);
        results.companies[company.id] = {
          success: false,
          error: companyError.message,
          totalRecords: 0
        };
        results.failedCompanies++;
        
        // Log error to database
        await logScrapeResult(company.id, 'error', { error: companyError.message });
      }
    }

    const duration = Date.now() - startTime;
    console.log('\n🎉 Multi-company scraping completed!');
    console.log('📊 Final Results:', {
      ...results,
      duration: `${duration}ms`,
      averageTimePerCompany: `${Math.round(duration / results.totalCompanies)}ms`
    });

    return results;

  } catch (error) {
    console.error('❌ Multi-company scraping failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  } finally {
    console.log('🧹 Cleaning up browser...');
    if (browser) {
      try {
        await browser.close();
        console.log('✅ Browser closed successfully');
      } catch (cleanupError) {
        console.error('❌ Browser cleanup error:', cleanupError.message);
      }
    }
  }
}

/**
 * Scrape schedule for a single company
 * @param {Object} browser - Puppeteer browser instance
 * @param {Object} company - Company configuration
 * @param {number} timeout - Page timeout
 */
async function scrapeCompanySchedule(browser, company, timeout) {
  let page = null;
  const companyStartTime = Date.now();
  
  try {
    console.log(`📄 Creating page for ${company.name}...`);
    page = await browser.newPage();
    
    // Configure page
    await page.setDefaultTimeout(timeout);
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Enable request interception for performance
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.resourceType() === 'stylesheet' || req.resourceType() === 'font' || req.resourceType() === 'image') {
        req.abort();
      } else {
        req.continue();
      }
    });

    console.log(`🌐 Navigating to ${company.scheduleUrl || 'https://skiftschema.se'}...`);
    const response = await page.goto(company.scheduleUrl || 'https://skiftschema.se', { 
      waitUntil: 'networkidle2',
      timeout: timeout 
    });
    console.log(`✅ Navigation completed with status: ${response.status()}`);

    // Wait for and click primary button
    console.log('🔍 Waiting for primary button...');
    await page.waitForSelector('.btn-primary', { timeout: 10000 });
    await page.click('.btn-primary');
    console.log('✅ Primary button clicked');

    // Wait for table to load
    console.log('📊 Waiting for schedule table...');
    await page.waitForSelector('.table', { timeout: 15000 });
    console.log('✅ Schedule table loaded');

    // Extract schedule data
    console.log('📋 Extracting schedule data...');
    const scheduleData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.table tbody tr'));
      return rows.map((row, index) => {
        const cells = row.querySelectorAll('td');
        return {
          date: cells[0]?.innerText.trim() || '',
          shift: cells[1]?.innerText.trim() || '',
          team: cells[2]?.innerText.trim() || '',
          department: cells[3]?.innerText.trim() || null, // If available
          location: cells[4]?.innerText.trim() || null, // If available
        };
      });
    });

    console.log(`✅ Extracted ${scheduleData.length} schedule records`);

    if (scheduleData.length === 0) {
      throw new Error('No schedule data found - table may be empty or structure changed');
    }

    // Process and save schedule data for all teams and departments
    const result = await processScheduleData(company, scheduleData);
    
    const duration = Date.now() - companyStartTime;
    console.log(`⏱️ ${company.name} processing completed in ${duration}ms`);
    
    return {
      ...result,
      duration,
      success: true
    };

  } catch (error) {
    console.error(`❌ Error scraping ${company.name}:`, error.message);
    throw error;
  } finally {
    if (page) {
      try {
        await page.close();
        console.log(`✅ Page closed for ${company.name}`);
      } catch (closeError) {
        console.error(`❌ Error closing page for ${company.name}:`, closeError.message);
      }
    }
  }
}

/**
 * Process and save schedule data to database
 * @param {Object} company - Company configuration
 * @param {Array} scheduleData - Raw schedule data from scraping
 */
async function processScheduleData(company, scheduleData) {
  console.log(`💾 Processing schedule data for ${company.name}...`);
  
  let processedRecords = 0;
  let insertedRecords = 0;
  let updatedRecords = 0;
  let failedRecords = 0;

  // Clear existing schedules for this company
  console.log(`🗄️ Clearing existing schedules for ${company.name}...`);
  const { error: deleteError } = await supabase
    .from('schedules')
    .delete()
    .eq('company_id', company.id);

  if (deleteError) {
    console.warn(`⚠️ Warning clearing existing schedules: ${deleteError.message}`);
  } else {
    console.log('✅ Existing schedules cleared');
  }

  // Process each schedule record
  for (const [index, record] of scheduleData.entries()) {
    try {
      processedRecords++;
      
      // Parse date (assuming format: YYYY-MM-DD or similar)
      const date = parseScheduleDate(record.date);
      if (!date) {
        console.warn(`⚠️ Invalid date format: ${record.date}, skipping record ${index + 1}`);
        failedRecords++;
        continue;
      }

      // Determine team and department
      const teamName = record.team || 'Unknown';
      const department = record.department || inferDepartmentFromTeam(company, teamName);

      // Create schedule record
      const scheduleRecord = {
        company_id: company.id,
        team_name: teamName,
        department: department,
        date: date,
        shift_type: record.shift || 'Unknown',
        location: record.location || null,
        notes: null,
        status: 'active',
        scraped_at: new Date().toISOString()
      };

      // Insert record
      const { error: insertError } = await supabase
        .from('schedules')
        .upsert([scheduleRecord], {
          onConflict: 'company_id,team_name,department,date'
        });

      if (insertError) {
        console.error(`❌ Failed to insert record ${index + 1}:`, insertError.message);
        failedRecords++;
      } else {
        insertedRecords++;
        if (index % 10 === 0) { // Log progress every 10 records
          console.log(`📈 Progress: ${index + 1}/${scheduleData.length} records processed`);
        }
      }

    } catch (recordError) {
      console.error(`❌ Error processing record ${index + 1}:`, recordError.message);
      failedRecords++;
    }
  }

  const result = {
    totalRecords: processedRecords,
    insertedRecords,
    updatedRecords,
    failedRecords,
    teams: [...new Set(scheduleData.map(r => r.team).filter(Boolean))],
    departments: [...new Set(scheduleData.map(r => r.department).filter(Boolean))]
  };

  console.log(`📊 ${company.name} processing summary:`, result);
  return result;
}

/**
 * Sync company data to database
 */
async function syncCompaniesToDatabase() {
  for (const [key, company] of Object.entries(COMPANIES)) {
    try {
      // Upsert company
      const { error: companyError } = await supabase
        .from('companies')
        .upsert({
          id: company.id,
          name: company.name,
          slug: company.id,
          schedule_url: company.scheduleUrl,
          teams_config: company.teams,
          departments_config: company.departments,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'slug'
        });

      if (companyError) {
        console.error(`❌ Error syncing company ${company.name}:`, companyError.message);
        continue;
      }

      // Sync teams
      for (const teamName of company.teams) {
        const { error: teamError } = await supabase
          .from('teams')
          .upsert({
            company_id: company.id,
            name: teamName,
            description: `${teamName} team för ${company.name}`,
            color: getTeamColor(company.id, teamName),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'company_id,name'
          });

        if (teamError) {
          console.error(`❌ Error syncing team ${teamName}:`, teamError.message);
        }
      }

      console.log(`✅ Synced company: ${company.name}`);
    } catch (error) {
      console.error(`❌ Error syncing company ${company.name}:`, error.message);
    }
  }
}

/**
 * Log scraping results to database
 */
async function logScrapeResult(companyId, status, result) {
  try {
    const logData = {
      company_id: companyId,
      status: status,
      records_processed: result.totalRecords || 0,
      records_inserted: result.insertedRecords || 0,
      records_updated: result.updatedRecords || 0,
      records_failed: result.failedRecords || 0,
      error_message: result.error || null,
      execution_time_ms: result.duration || null,
      scraped_data: result,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('scrape_logs')
      .insert([logData]);

    if (error) {
      console.error('❌ Error logging scrape result:', error.message);
    }
  } catch (error) {
    console.error('❌ Error logging scrape result:', error.message);
  }
}

/**
 * Helper functions
 */
function parseScheduleDate(dateString) {
  try {
    // Handle various date formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  } catch (error) {
    return null;
  }
}

function inferDepartmentFromTeam(company, teamName) {
  // Simple logic to infer department from team name
  // This can be enhanced based on actual business logic
  if (company.departments.length > 0) {
    return company.departments[0]; // Default to first department
  }
  return 'General';
}

function getTeamColor(companyId, teamName) {
  // Simple color assignment logic
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFA502'];
  const hash = (companyId + teamName).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return colors[Math.abs(hash) % colors.length];
}

// Execute the multi-company scraping
(async () => {
  const startTime = Date.now();
  console.log('🎯 Starting multi-company schedule sync at:', new Date().toISOString());
  
  try {
    const results = await scrapeMultiCompanySchedules({
      // companies: ['VOLVO', 'SCA'], // Uncomment to scrape specific companies
      syncCompanies: true,
      timeout: 20000
    });
    
    const duration = Date.now() - startTime;
    console.log(`\n🎉 Multi-company sync completed successfully in ${duration}ms`);
    console.log('📊 Total results:', {
      companies: results.totalCompanies,
      successful: results.successfulCompanies,
      failed: results.failedCompanies,
      totalRecords: results.totalRecords
    });
    
    process.exit(0);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n💥 Multi-company sync failed after ${duration}ms`);
    console.error('Final error:', error.message);
    process.exit(1);
  }
})();