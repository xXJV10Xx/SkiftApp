// scripts/scrape-upload.cjs
const puppeteer = require('puppeteer-core');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Environment variables
const CHROME_BIN = process.env.CHROME_BIN || '/usr/bin/chromium-browser';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USERNAME = process.env.SKIFT_USERNAME;
const PASSWORD = process.env.SKIFT_PASSWORD;

// Debug directory
const DEBUG_DIR = path.join(__dirname, 'debug');

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper function to take and save screenshots
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(DEBUG_DIR, `${name}-${new Date().toISOString().replace(/:/g, '-')}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
}

// Main scraping function
async function scrapeShiftSchedule() {
  console.log('Starting browser...');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_BIN,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: 'new'
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('https://app.skiftschema.se/login', { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'login-page');
    
    // Fill in login form
    console.log('Logging in...');
    await page.type('input[name="username"]', USERNAME);
    await page.type('input[name="password"]', PASSWORD);
    await takeScreenshot(page, 'login-form-filled');
    
    // Click login button and wait for navigation
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);
    
    // Check if login was successful
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      console.error('Login failed. Check credentials.');
      await takeScreenshot(page, 'login-failed');
      throw new Error('Login failed');
    }
    
    console.log('Login successful!');
    await takeScreenshot(page, 'after-login');
    
    // Navigate to schedule page (adjust URL as needed)
    console.log('Navigating to schedule page...');
    await page.goto('https://app.skiftschema.se/schedule', { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'schedule-page');
    
    // Wait for schedule data to load
    // You may need to adjust selectors based on the actual website structure
    await page.waitForSelector('.schedule-container', { timeout: 10000 });
    
    // Extract schedule data
    console.log('Extracting schedule data...');
    const scheduleData = await page.evaluate(() => {
      // This function runs in the browser context
      // You'll need to adjust this based on the actual structure of the website
      
      const shifts = [];
      
      // Example: Find all shift elements and extract data
      document.querySelectorAll('.shift-item').forEach(shiftElement => {
        shifts.push({
          date: shiftElement.getAttribute('data-date'),
          startTime: shiftElement.getAttribute('data-start-time'),
          endTime: shiftElement.getAttribute('data-end-time'),
          type: shiftElement.getAttribute('data-shift-type'),
          // Add any other relevant data
        });
      });
      
      return shifts;
    });
    
    await takeScreenshot(page, 'data-extracted');
    
    // Log the extracted data
    console.log(`Extracted ${scheduleData.length} shifts`);
    
    // Upload data to Supabase
    if (scheduleData.length > 0) {
      console.log('Uploading data to Supabase...');
      
      // Add timestamp to each record
      const dataWithTimestamp = scheduleData.map(shift => ({
        ...shift,
        scraped_at: new Date().toISOString()
      }));
      
      // Insert data into Supabase
      const { data, error } = await supabase
        .from('shift_schedules')
        .upsert(dataWithTimestamp, { 
          onConflict: 'date,start_time,end_time', // Adjust based on your unique constraints
          returning: 'minimal' 
        });
      
      if (error) {
        console.error('Error uploading to Supabase:', error);
        throw error;
      }
      
      console.log('Data successfully uploaded to Supabase!');
    } else {
      console.log('No data to upload.');
    }
    
  } catch (error) {
    console.error('An error occurred during scraping:', error);
    throw error;
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed.');
  }
}

// Run the scraping function
(async () => {
  try {
    await scrapeShiftSchedule();
    console.log('Scraping completed successfully!');
  } catch (error) {
    console.error('Scraping failed:', error);
    process.exit(1);
  }
})();