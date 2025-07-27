const puppeteer = require('puppeteer-core');

/**
 * Enhanced Puppeteer scraping function with comprehensive logging and error handling
 * @param {Object} options - Configuration options
 * @param {string} options.url - URL to scrape
 * @param {Function} options.scrapeLogic - Custom scraping logic function
 * @param {Object} options.launchOptions - Puppeteer launch options
 * @param {number} options.timeout - Page timeout in milliseconds
 */
async function scrapeWithLogging(options = {}) {
  const {
    url = 'https://example.com',
    scrapeLogic = null,
    launchOptions = {},
    timeout = 20000
  } = options;

  let browser = null;
  let page = null;
  
  try {
    console.log('🚀 Starting browser launch...');
    console.log('Configuration:', {
      url,
      timeout,
      headless: launchOptions.headless !== false,
      args: launchOptions.args?.length || 0
    });

    const defaultLaunchOptions = {
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
    };

    browser = await puppeteer.launch({
      ...defaultLaunchOptions,
      ...launchOptions
    });
    console.log('✅ Browser launched successfully');

    console.log('📄 Creating new page...');
    page = await browser.newPage();
    
    // Set page timeout and user agent
    await page.setDefaultTimeout(timeout);
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Enable request interception for better debugging
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (req.resourceType() === 'stylesheet' || req.resourceType() === 'font' || req.resourceType() === 'image') {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Log console messages from the page
    page.on('console', (msg) => {
      console.log('🌐 Page console:', msg.text());
    });

    // Log page errors
    page.on('pageerror', (error) => {
      console.error('🌐 Page error:', error.message);
    });

    console.log('✅ Page created and configured');

    console.log(`🌐 Navigating to ${url}...`);
    const response = await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: timeout 
    });
    console.log(`✅ Navigation completed with status: ${response.status()}`);

    if (!response.ok()) {
      throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
    }

    // Execute custom scraping logic if provided
    let result = null;
    if (scrapeLogic && typeof scrapeLogic === 'function') {
      console.log('🔍 Executing custom scraping logic...');
      result = await scrapeLogic(page);
      console.log('✅ Custom scraping logic completed');
    } else {
      console.log('📋 Extracting basic page information...');
      result = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          bodyText: document.body.innerText.substring(0, 1000) // First 1000 chars
        };
      });
      console.log('✅ Basic page information extracted');
    }

    console.log('📊 Scraping Results:', {
      success: true,
      dataExtracted: !!result,
      resultType: typeof result,
      timestamp: new Date().toISOString()
    });

    return result;

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
        const currentUrl = await page.url();
        console.error('Current page URL:', currentUrl);
        
        // Take a screenshot for debugging
        const screenshot = await page.screenshot({ 
          encoding: 'base64',
          fullPage: false 
        });
        console.log('📸 Screenshot captured (base64 length):', screenshot.length);
        
        // Get page title for context
        const title = await page.title();
        console.error('Page title:', title);
        
      } catch (debugError) {
        console.error('Failed to gather debug info:', debugError.message);
      }
    }
    
    throw error; // Re-throw to ensure proper error handling
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

/**
 * Example usage of the scraping function
 */
async function exampleUsage() {
  const startTime = Date.now();
  console.log('🎯 Starting scrape job at:', new Date().toISOString());
  
  try {
    // Example 1: Basic scraping
    const result1 = await scrapeWithLogging({
      url: 'https://example.com',
      timeout: 15000
    });
    console.log('Basic scraping result:', result1);

    // Example 2: Custom scraping logic
    const result2 = await scrapeWithLogging({
      url: 'https://example.com',
      timeout: 15000,
      scrapeLogic: async (page) => {
        // Wait for specific elements
        await page.waitForSelector('h1', { timeout: 5000 });
        
        // Extract custom data
        return await page.evaluate(() => {
          const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
          return {
            headings: headings.map(h => ({
              tag: h.tagName,
              text: h.innerText.trim()
            })),
            links: Array.from(document.querySelectorAll('a')).length,
            images: Array.from(document.querySelectorAll('img')).length
          };
        });
      }
    });
    console.log('Custom scraping result:', result2);

    const duration = Date.now() - startTime;
    console.log(`🎉 All scrape jobs completed successfully in ${duration}ms`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`💥 Scrape job failed after ${duration}ms`);
    console.error('Final error:', error.message);
    process.exit(1);
  }
}

// Export the function for use in other modules
module.exports = {
  scrapeWithLogging,
  exampleUsage
};

// Run example if this file is executed directly
if (require.main === module) {
  exampleUsage();
}