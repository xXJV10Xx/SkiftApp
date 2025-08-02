// scripts/scrape-upload.cjs
const puppeteer = require('puppeteer-core');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Environment variables
const CHROME_BIN = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_BIN || '/usr/bin/chromium-browser';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USERNAME = process.env.SKIFT_USERNAME;
const PASSWORD = process.env.SKIFT_PASSWORD;

// Debug directory
const DEBUG_DIR = path.join(__dirname, 'debug');
// Create debug directory if it doesn't exist
if (!fs.existsSync(DEBUG_DIR)) {
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
}

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
  console.log('Using Chrome binary:', CHROME_BIN);
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_BIN,
    headless: "new",  // Use the new headless mode
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable more verbose logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('https://app.skiftschema.se/login', { 
      waitUntil: 'networkidle2',
      timeout: 60000 // Increase timeout to 60 seconds
    });
    await takeScreenshot(page, 'login-page');
    
    // Check if username field exists
    const usernameExists = await page.evaluate(() => {
      return !!document.querySelector('input[name="username"]');
    });
    
    if (!usernameExists) {
      console.log('Username field not found. Checking for alternative selectors...');
      await takeScreenshot(page, 'login-page-no-username-field');
      
      // Log all input fields for debugging
      const inputFields = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('input')).map(input => ({
          name: input.name,
          id: input.id,
          type: input.type,
          placeholder: input.placeholder
        }));
      });
      console.log('Available input fields:', JSON.stringify(inputFields, null, 2));
    }
    
    // Fill in login form with explicit waiting
    console.log('Waiting for username field...');
    await page.waitForSelector('input[name="username"]', { visible: true, timeout: 10000 });
    
    console.log('Filling username...');
    await page.type('input[name="username"]', USERNAME, { delay: 100 });
    
    console.log('Filling password...');
    await page.type('input[name="password"]', PASSWORD, { delay: 100 });
    await takeScreenshot(page, 'login-form-filled');
    
    // Find and click the submit button with multiple fallback methods
    console.log('Looking for submit button...');
    await takeScreenshot(page, 'before-submit-click');
    
    try {
      console.log('Attempting to click submit button...');
      
      // Wait for button to be ready
      await page.waitForSelector('button[type="submit"]', { visible: true, timeout: 5000 });
      
      // Add a small delay
      await page.waitForTimeout(1000);
      
      // Method 1: Click with navigation wait
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
      ]);
      
      console.log('Submit button clicked successfully');
    } catch (error) {
      console.log('Standard click failed:', error.message);
      await takeScreenshot(page, 'click-failed');
      
      try {
        // Method 2: Get element and click
        console.log('Trying alternative click method...');
        const submitButton = await page.$('button[type="submit"]');
        
        if (submitButton) {
          await submitButton.click();
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
          console.log('Alternative click successful');
        } else {
          console.log('Submit button not found');
          
          // Try to find any button that looks like a submit button
          const buttonText = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.map(b => ({
              text: b.textContent.trim(),
              type: b.type,
              id: b.id,
              classes: b.className
            }));
          });
          
          console.log('Available buttons:', JSON.stringify(buttonText, null, 2));
          throw new Error('Submit button not found');
        }
      } catch (error2) {
        console.log('Element click failed:', error2.message);
        
        // Method 3: JavaScript click
        console.log('Trying JavaScript click...');
        await page.evaluate(() => {
          const button = document.querySelector('button[type="submit"]');
          if (button) {
            button.click();
            return true;
          }
          return false;
        });
        
        // Wait for navigation after JS click
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
          .catch(e => console.log('Navigation after JS click failed:', e.message));
      }
    }
    
    // Check if login was successful
    const currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);
    
    if (currentUrl.includes('login')) {
      console.error('Login failed. Check credentials.');
      await takeScreenshot(page, 'login-failed');
      throw new Error('Login failed');
    }
    
    console.log('Login successful!');
    await takeScreenshot(page, 'after-login');
    
    // Navigate to schedule page (adjust URL as needed)
    console.log('Navigating to schedule page...');
    await page.goto('https://app.skiftschema.se/schedule', { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    await takeScreenshot(page, 'schedule-page');
    
    // Wait for schedule data to load with a more generous timeout
    console.log('Waiting for schedule container...');
    try {
      await page.waitForSelector('.schedule-container', { timeout: 20000 });
    } catch (error) {
      console.log('Could not find .schedule-container, checking page content...');
      
      // Log the page structure to help identify the correct selector
      const pageStructure = await page.evaluate(() => {
        const getElementInfo = (element, depth = 0) => {
          if (depth > 3) return '...'; // Limit depth to avoid huge output
          
          const children = Array.from(element.children).map(child => 
            getElementInfo(child, depth + 1)
          );
          
          return {
            tag: element.tagName.toLowerCase(),
            id: element.id || undefined,
            classes: element.className ? element.className.split(' ').filter(c => c) : undefined,
            children: children.length ? children : undefined
          };
        };
        
        return getElementInfo(document.body);
      });
      
      console.log('Page structure:', JSON.stringify(pageStructure, null, 2));
      await takeScreenshot(page, 'schedule-container-not-found');
      
      // Try to find any relevant containers
      const possibleContainers = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('div[class*="schedule"], div[class*="shift"], table, .calendar, .timetable'))
          .map(el => ({
            tag: el.tagName.toLowerCase(),
            id: el.id,
            classes: el.className
          }));
      });
      
      console.log('Possible schedule containers:', JSON.stringify(possibleContainers, null, 2));
      
      // Continue with a best guess if we found something that might be the schedule
      if (possibleContainers.length > 0) {
        console.log('Using alternative selector for schedule container');
      } else {
        throw new Error('Could not find schedule container');
      }
    }
    
    // Extract schedule data with more robust approach
    console.log('Extracting schedule data...');
    const scheduleData = await page.evaluate(() => {
      // This function runs in the browser context
      // First try with the expected selector
      let shifts = [];
      
      try {
        // Try the original selector
        const shiftElements = document.querySelectorAll('.shift-item');
        
        if (shiftElements.length > 0) {
          shifts = Array.from(shiftElements).map(shiftElement => ({
            date: shiftElement.getAttribute('data-date'),
            startTime: shiftElement.getAttribute('data-start-time'),
            endTime: shiftElement.getAttribute('data-end-time'),
            type: shiftElement.getAttribute('data-shift-type'),
          }));
        } else {
          // If no elements found, try to identify the structure
          console.log('No shift items found with .shift-item selector');
          
          // Look for any elements that might contain shift data
          // This is a generic approach that looks for date-like and time-like content
          const allElements = document.querySelectorAll('*');
          const potentialShiftElements = Array.from(allElements).filter(el => {
            const text = el.textContent.trim();
            // Look for date patterns (2023-01-01, 01/01/2023, etc.) or time patterns (13:00, 1:00 PM, etc.)
            return (
              /\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/.test(text) || // Date pattern
              /\d{1,2}[:h]\d{2}/.test(text) // Time pattern
            );
          });
          
          // Group potential elements by their parent to find patterns
          const parentMap = new Map();
          potentialShiftElements.forEach(el => {
            const parent = el.parentElement;
            if (!parentMap.has(parent)) {
              parentMap.set(parent, []);
            }
            parentMap.get(parent).push(el);
          });
          
          // Find parents with multiple children that might represent shifts
          parentMap.forEach((children, parent) => {
            if (children.length >= 2) {
              // This parent might contain a shift
              const shiftText = parent.textContent.trim();
              
              // Extract potential date
              const dateMatch = shiftText.match(/\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/);
              const date = dateMatch ? dateMatch[0] : null;
              
              // Extract potential times
              const timeMatches = shiftText.match(/\d{1,2}[:h]\d{2}/g);
              const startTime = timeMatches && timeMatches.length > 0 ? timeMatches[0] : null;
              const endTime = timeMatches && timeMatches.length > 1 ? timeMatches[1] : null;
              
              if (date && startTime) {
                shifts.push({
                  date,
                  startTime,
                  endTime: endTime || '',
                  type: parent.classList.length > 0 ? parent.classList.value : 'unknown',
                  rawText: shiftText
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Error extracting shift data:', error);
      }
      
      // If we still don't have shifts, capture the entire page content as a fallback
      if (shifts.length === 0) {
        return [{
          type: 'page_content',
          content: document.body.innerText,
          html: document.body.innerHTML
        }];
      }
      
      return shifts;
    });
    
    await takeScreenshot(page, 'data-extracted');
    
    // Log the extracted data
    console.log(`Extracted data: ${JSON.stringify(scheduleData, null, 2)}`);
    console.log(`Extracted ${scheduleData.length} shifts or data points`);
    
    // Upload data to Supabase
    if (scheduleData.length > 0) {
      console.log('Uploading data to Supabase...');
      
      // Create a single record with all the data
      const record = {
        source: 'skiftschema',
        data: scheduleData,
        scraped_at: new Date().toISOString()
      };
      
      // Insert data into Supabase
      const { data, error } = await supabase
        .from('shift_schedules')
        .insert([record]);
      
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
