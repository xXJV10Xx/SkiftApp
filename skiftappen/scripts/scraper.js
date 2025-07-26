require('dotenv').config();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const cron = require('cron');
const winston = require('winston');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'scraper-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'scraper.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class ShiftScraper {
  constructor() {
    this.browser = null;
    this.userAgent = process.env.SCRAPER_USER_AGENT || 'skiftappen-scraper/1.0';
  }

  async initialize() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      logger.info('Browser initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async scrapeShifts(url) {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent(this.userAgent);
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // TODO: Implement specific scraping logic based on target website
      const shifts = [];
      
      // Example scraping logic (customize based on actual website structure)
      $('.shift-item').each((index, element) => {
        const shift = {
          title: $(element).find('.shift-title').text().trim(),
          start_time: $(element).find('.shift-start').text().trim(),
          end_time: $(element).find('.shift-end').text().trim(),
          location: $(element).find('.shift-location').text().trim(),
          description: $(element).find('.shift-description').text().trim(),
          scraped_at: new Date().toISOString()
        };
        
        if (shift.title && shift.start_time && shift.end_time) {
          shifts.push(shift);
        }
      });

      logger.info(`Scraped ${shifts.length} shifts from ${url}`);
      return shifts;
      
    } catch (error) {
      logger.error(`Error scraping ${url}:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async saveShifts(shifts) {
    try {
      if (shifts.length === 0) {
        logger.info('No shifts to save');
        return;
      }

      const { data, error } = await supabase
        .from('shifts')
        .insert(shifts);

      if (error) {
        logger.error('Error saving shifts to database:', error);
        throw error;
      }

      logger.info(`Successfully saved ${shifts.length} shifts to database`);
      return data;
    } catch (error) {
      logger.error('Failed to save shifts:', error);
      throw error;
    }
  }

  async scrapeAndSave(urls) {
    try {
      logger.info('Starting scraping process...');
      
      for (const url of urls) {
        try {
          const shifts = await this.scrapeShifts(url);
          await this.saveShifts(shifts);
        } catch (error) {
          logger.error(`Failed to process ${url}:`, error);
          // Continue with other URLs
        }
      }
      
      logger.info('Scraping process completed');
    } catch (error) {
      logger.error('Scraping process failed:', error);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      logger.info('Browser closed');
    }
  }
}

// Configuration
const SCRAPER_URLS = [
  // TODO: Add actual URLs to scrape
  'https://example-shift-website.com/shifts',
];

// Main execution
async function main() {
  const scraper = new ShiftScraper();
  
  try {
    await scraper.scrapeAndSave(SCRAPER_URLS);
  } catch (error) {
    logger.error('Main process failed:', error);
  } finally {
    await scraper.close();
  }
}

// Schedule scraping (runs every hour by default)
const cronPattern = process.env.SCRAPER_CRON || '0 * * * *';
const job = new cron.CronJob(cronPattern, main, null, false, 'Europe/Stockholm');

// Start the cron job if not in test environment
if (process.env.NODE_ENV !== 'test') {
  logger.info(`Starting scraper with cron pattern: ${cronPattern}`);
  job.start();
  
  // Also run once immediately
  main();
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down scraper...');
  job.stop();
  process.exit(0);
});

module.exports = ShiftScraper;