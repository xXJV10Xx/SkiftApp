const puppeteerCore = require('puppeteer-core');
const { createClient } = require('@supabase/supabase-js');

// Environment variable validation
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('SUPABASE_KEY:', SUPABASE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuration
const CONFIG = {
  TARGET_URL: 'https://skiftschema.se',
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  TIMEOUT: 30000,
  PUPPETEER_ARGS: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding'
  ]
};

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const validateScheduleData = (data) => {
  return data && 
         typeof data.date === 'string' && 
         data.date.trim().length > 0 &&
         typeof data.shift === 'string' &&
         typeof data.team === 'string';
};

const retryOperation = async (operation, maxRetries = CONFIG.MAX_RETRIES) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`❌ Attempt ${attempt}/${maxRetries} failed:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      await delay(CONFIG.RETRY_DELAY * attempt);
    }
  }
};

// Main scraping function
const scrapeScheduleData = async () => {
  let browser = null;
  
  try {
    console.log('🚀 Starting schedule scraping process...');
    
    // Launch browser
    browser = await puppeteerCore.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
      headless: true,
      args: CONFIG.PUPPETEER_ARGS,
      timeout: CONFIG.TIMEOUT
    });

    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log('📄 Navigating to:', CONFIG.TARGET_URL);
    
    // Navigate to the website with retry logic
    await retryOperation(async () => {
      await page.goto(CONFIG.TARGET_URL, { 
        waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT 
      });
    });

    console.log('🔍 Looking for schedule data...');
    
    // Wait for and click the primary button
    await retryOperation(async () => {
      await page.waitForSelector('.btn-primary', { timeout: 10000 });
      await page.click('.btn-primary');
    });

    // Wait for the table to load
    await retryOperation(async () => {
      await page.waitForSelector('.table', { timeout: 10000 });
    });

    console.log('📊 Extracting schedule data...');
    
    // Extract schedule data
    const scheduleData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.table tbody tr'));
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        return {
          date: cells[0]?.innerText?.trim() || '',
          shift: cells[1]?.innerText?.trim() || '',
          team: cells[2]?.innerText?.trim() || ''
        };
      }).filter(item => item.date && item.date.length > 0);
    });

    console.log(`📋 Found ${scheduleData.length} schedule entries`);
    
    if (scheduleData.length === 0) {
      throw new Error('No schedule data found on the page');
    }

    // Validate data
    const validData = scheduleData.filter(validateScheduleData);
    const invalidCount = scheduleData.length - validData.length;
    
    if (invalidCount > 0) {
      console.log(`⚠️  Filtered out ${invalidCount} invalid entries`);
    }

    return validData;

  } catch (error) {
    console.error('❌ Error during scraping:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
};

// Database operations
const saveSchedulesToDatabase = async (scheduleData) => {
  try {
    console.log('🗄️  Saving to database...');
    
    // Test database connection
    const { data: testData, error: testError } = await supabase
      .from('schedules')
      .select('count')
      .limit(1);
    
    if (testError) {
      throw new Error(`Database connection failed: ${testError.message}`);
    }

    // Clear existing schedules
    console.log('🧹 Clearing existing schedules...');
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (deleteError) {
      console.error('⚠️  Warning: Could not clear existing schedules:', deleteError.message);
      // Continue anyway - this might not be critical
    }

    // Insert new schedules in batches
    const BATCH_SIZE = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < scheduleData.length; i += BATCH_SIZE) {
      const batch = scheduleData.slice(i, i + BATCH_SIZE);
      
      const { data, error } = await supabase
        .from('schedules')
        .insert(batch)
        .select();

      if (error) {
        throw new Error(`Failed to insert batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      }

      insertedCount += batch.length;
      console.log(`📝 Inserted batch: ${insertedCount}/${scheduleData.length} records`);
    }

    console.log(`✅ Successfully saved ${insertedCount} schedule entries to database`);
    return insertedCount;

  } catch (error) {
    console.error('❌ Database error:', error.message);
    throw error;
  }
};

// Main execution
(async () => {
  const startTime = Date.now();
  
  try {
    console.log('🎯 Skiftappen Schedule Scraper v2.0');
    console.log('⏰ Started at:', new Date().toISOString());
    
    // Scrape data
    const scheduleData = await scrapeScheduleData();
    
    // Save to database
    const savedCount = await saveSchedulesToDatabase(scheduleData);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('🎉 Scraping completed successfully!');
    console.log(`📊 Total records processed: ${savedCount}`);
    console.log(`⏱️  Total time: ${duration} seconds`);
    
    process.exit(0);
    
  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.error('💥 Scraping failed:', error.message);
    console.error(`⏱️  Failed after: ${duration} seconds`);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
})();
