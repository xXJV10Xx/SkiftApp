const puppeteerCore = require('puppeteer-core');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function scrapeWithLogging() {
  let browser = null;
  let page = null;
  
  try {
    console.log('🚀 Starting browser launch...');
    console.log('Environment:', {
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
      supabaseUrl: process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing',
      supabaseKey: process.env.SUPABASE_KEY ? '✅ Set' : '❌ Missing'
    });

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
      timeout: 30000  // Increase timeout to 30 seconds
    });
    console.log('✅ Browser launched successfully');

    console.log('📄 Creating new page...');
    page = await browser.newPage();
    
    // Set page timeout and user agent
    await page.setDefaultTimeout(20000);
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    console.log('✅ Page created and configured');

    console.log('🌐 Navigating to https://skiftschema.se...');
    const response = await page.goto('https://skiftschema.se', { 
      waitUntil: 'networkidle2',
      timeout: 20000 
    });
    console.log(`✅ Navigation completed with status: ${response.status()}`);

    console.log('🔍 Waiting for primary button...');
    await page.waitForSelector('.btn-primary', { timeout: 10000 });
    console.log('✅ Primary button found');

    console.log('👆 Clicking primary button...');
    await page.click('.btn-primary');
    console.log('✅ Button clicked');

    console.log('📊 Waiting for table to load...');
    await page.waitForSelector('.table', { timeout: 15000 });
    console.log('✅ Table loaded');

    console.log('📋 Extracting schedule data...');
    const schema = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.table tbody tr'));
      console.log(`Found ${rows.length} rows in table`);
      return rows.map((row, index) => {
        const cells = row.querySelectorAll('td');
        const data = {
          date: cells[0]?.innerText.trim() || '',
          shift: cells[1]?.innerText.trim() || '',
          team: cells[2]?.innerText.trim() || ''
        };
        console.log(`Row ${index + 1}:`, data);
        return data;
      });
    });
    console.log(`✅ Extracted ${schema.length} schedule items`);

    if (schema.length === 0) {
      throw new Error('No schedule data found - table may be empty or structure changed');
    }

    console.log('🗄️ Clearing existing schedules from Supabase...');
    const { error: deleteError } = await supabase.from('schedules').delete().neq('id', '');
    if (deleteError) {
      throw new Error(`Failed to clear existing schedules: ${deleteError.message}`);
    }
    console.log('✅ Existing schedules cleared');

    console.log('💾 Inserting new schedule data...');
    let successCount = 0;
    let errorCount = 0;

    for (const [index, item] of schema.entries()) {
      try {
        const { error: insertError } = await supabase.from('schedules').insert([
          {
            date: item.date,
            shift: item.shift,
            team: item.team
          }
        ]);

        if (insertError) {
          console.error(`❌ Failed to insert item ${index + 1}:`, insertError.message);
          errorCount++;
        } else {
          successCount++;
          console.log(`✅ Inserted item ${index + 1}/${schema.length}: ${item.date} - ${item.shift}`);
        }
      } catch (insertErr) {
        console.error(`❌ Exception inserting item ${index + 1}:`, insertErr.message);
        errorCount++;
      }
    }

    console.log('📊 Upload Summary:', {
      total: schema.length,
      successful: successCount,
      failed: errorCount
    });

    if (errorCount > 0) {
      console.warn(`⚠️ ${errorCount} items failed to upload`);
    }

    console.log('✅ Skiftdata sparat i Supabase!');

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    // Additional debugging info
    if (page) {
      try {
        const url = await page.url();
        console.error('Current page URL:', url);
        
        // Take a screenshot for debugging (if possible)
        const screenshot = await page.screenshot({ encoding: 'base64' });
        console.log('Screenshot taken (base64 length):', screenshot.length);
      } catch (debugError) {
        console.error('Failed to gather debug info:', debugError.message);
      }
    }
    
    throw error; // Re-throw to ensure the process exits with error code
  } finally {
    console.log('🧹 Cleaning up resources...');
    try {
      if (page) {
        await page.close();
        console.log('✅ Page closed');
      }
      if (browser) {
        await browser.close();
        console.log('✅ Browser closed');
      }
    } catch (cleanupError) {
      console.error('❌ Cleanup error:', cleanupError.message);
    }
  }
}

// Execute the scraping function
(async () => {
  const startTime = Date.now();
  console.log('🎯 Starting scrape job at:', new Date().toISOString());
  
  try {
    await scrapeWithLogging();
    const duration = Date.now() - startTime;
    console.log(`🎉 Scrape job completed successfully in ${duration}ms`);
    process.exit(0);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 Scrape job failed after ${duration}ms`);
    process.exit(1);
  }
})();
