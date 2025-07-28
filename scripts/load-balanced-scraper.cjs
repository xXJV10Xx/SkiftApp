const puppeteerCore = require('puppeteer-core');
const { createClient } = require('@supabase/supabase-js');
const cluster = require('cluster');
const os = require('os');

// Configuration for high-scale deployment
const CONFIG = {
  MAX_CONCURRENT_SCRAPERS: process.env.MAX_CONCURRENT_SCRAPERS || 3,
  MAX_DATABASE_CONNECTIONS: process.env.MAX_DATABASE_CONNECTIONS || 10,
  SCRAPE_BATCH_SIZE: process.env.SCRAPE_BATCH_SIZE || 2, // Companies per batch
  RATE_LIMIT_DELAY: process.env.RATE_LIMIT_DELAY || 5000, // 5s between requests
  MAX_RETRIES: process.env.MAX_RETRIES || 3,
  HEALTH_CHECK_INTERVAL: process.env.HEALTH_CHECK_INTERVAL || 30000, // 30s
  CACHE_TTL: process.env.CACHE_TTL || 300000, // 5 minutes
};

// Create connection pool for Supabase
class DatabasePool {
  constructor(maxConnections = CONFIG.MAX_DATABASE_CONNECTIONS) {
    this.maxConnections = maxConnections;
    this.connections = [];
    this.activeConnections = 0;
    this.queue = [];
    
    console.log(`🔗 Database pool initialized with ${maxConnections} max connections`);
  }

  async getConnection() {
    return new Promise((resolve, reject) => {
      if (this.connections.length > 0) {
        const connection = this.connections.pop();
        this.activeConnections++;
        resolve(connection);
        return;
      }

      if (this.activeConnections < this.maxConnections) {
        const connection = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        this.activeConnections++;
        resolve(connection);
        return;
      }

      // Queue the request
      this.queue.push({ resolve, reject });
    });
  }

  releaseConnection(connection) {
    this.activeConnections--;
    
    if (this.queue.length > 0) {
      const { resolve } = this.queue.shift();
      this.activeConnections++;
      resolve(connection);
    } else {
      this.connections.push(connection);
    }
  }

  async executeQuery(query) {
    const connection = await this.getConnection();
    try {
      const result = await query(connection);
      return result;
    } finally {
      this.releaseConnection(connection);
    }
  }
}

// Global database pool
const dbPool = new DatabasePool();

// Company data optimized for load balancing
const COMPANIES = {
  VOLVO: {
    id: 'volvo',
    name: 'Volvo',
    teams: ['A', 'B', 'C', 'D'],
    departments: ['Produktion', 'Montering', 'Kvalitet', 'Underhåll', 'Logistik'],
    scheduleUrl: 'https://skiftschema.se/volvo',
    priority: 1 // High priority
  },
  SCA: {
    id: 'sca',
    name: 'SCA',
    teams: ['Röd', 'Blå', 'Gul', 'Grön'],
    departments: ['Massa', 'Papper', 'Underhåll', 'Kvalitet', 'Logistik'],
    scheduleUrl: 'https://skiftschema.se/sca',
    priority: 1
  },
  SSAB: {
    id: 'ssab',
    name: 'SSAB',
    teams: ['1', '2', '3', '4', '5'],
    departments: ['Masugn', 'Stålverk', 'Varmvalsning', 'Kallvalsning', 'Underhåll'],
    scheduleUrl: 'https://skiftschema.se/ssab',
    priority: 2
  },
  BOLIDEN: {
    id: 'boliden',
    name: 'Boliden',
    teams: ['Alpha', 'Beta', 'Gamma', 'Delta'],
    departments: ['Gruva', 'Anrikning', 'Smältverk', 'Underhåll', 'Miljö'],
    scheduleUrl: 'https://skiftschema.se/boliden',
    priority: 2
  },
  BARILLA: {
    id: 'barilla',
    name: 'Barilla Sverige',
    teams: ['1', '2', '3', '4', '5'],
    departments: ['Produktion', 'Förpackning', 'Kvalitet', 'Underhåll', 'Lager'],
    scheduleUrl: 'https://skiftschema.se/barilla',
    priority: 3
  }
};

// Distributed scraping queue
class ScrapingQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.activeJobs = 0;
    this.results = new Map();
    this.cache = new Map();
  }

  addJob(company, priority = 1) {
    this.queue.push({ company, priority, timestamp: Date.now() });
    this.queue.sort((a, b) => a.priority - b.priority); // Higher priority first
    console.log(`📋 Added ${company.name} to scraping queue (priority: ${priority})`);
  }

  async processQueue() {
    if (this.processing || this.activeJobs >= CONFIG.MAX_CONCURRENT_SCRAPERS) {
      return;
    }

    if (this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const batches = this.createBatches();

    console.log(`🚀 Processing ${batches.length} batches with ${this.queue.length} companies`);

    try {
      await Promise.all(batches.map(batch => this.processBatch(batch)));
    } catch (error) {
      console.error('❌ Queue processing error:', error);
    } finally {
      this.processing = false;
    }
  }

  createBatches() {
    const batches = [];
    for (let i = 0; i < this.queue.length; i += CONFIG.SCRAPE_BATCH_SIZE) {
      batches.push(this.queue.slice(i, i + CONFIG.SCRAPE_BATCH_SIZE));
    }
    this.queue = []; // Clear queue
    return batches;
  }

  async processBatch(batch) {
    this.activeJobs++;
    
    try {
      const results = await Promise.allSettled(
        batch.map(job => this.scrapeCompanyWithRetry(job.company))
      );

      results.forEach((result, index) => {
        const company = batch[index].company;
        if (result.status === 'fulfilled') {
          this.results.set(company.id, result.value);
          console.log(`✅ ${company.name} completed successfully`);
        } else {
          console.error(`❌ ${company.name} failed:`, result.reason);
        }
      });

    } finally {
      this.activeJobs--;
    }
  }

  async scrapeCompanyWithRetry(company, retries = CONFIG.MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Check cache first
        const cacheKey = `${company.id}_${new Date().toDateString()}`;
        if (this.cache.has(cacheKey)) {
          const cached = this.cache.get(cacheKey);
          if (Date.now() - cached.timestamp < CONFIG.CACHE_TTL) {
            console.log(`💾 Using cached data for ${company.name}`);
            return cached.data;
          }
        }

        const result = await this.scrapeCompany(company);
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      } catch (error) {
        console.warn(`⚠️ ${company.name} attempt ${attempt}/${retries} failed:`, error.message);
        
        if (attempt === retries) {
          throw error;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async scrapeCompany(company) {
    let browser = null;
    let page = null;
    const startTime = Date.now();

    try {
      console.log(`🏢 Scraping ${company.name}...`);

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
          '--disable-gpu',
          '--memory-pressure-off', // Optimize for high load
          '--max_old_space_size=512' // Limit memory usage
        ],
        timeout: 30000
      });

      page = await browser.newPage();
      
      // Optimize page for speed
      await page.setDefaultTimeout(15000);
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Navigate and scrape
      await page.goto(company.scheduleUrl || 'https://skiftschema.se', { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });

      await page.waitForSelector('.btn-primary', { timeout: 10000 });
      await page.click('.btn-primary');
      await page.waitForSelector('.table', { timeout: 10000 });

      const scheduleData = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('.table tbody tr'));
        return rows.map(row => {
          const cells = row.querySelectorAll('td');
          return {
            date: cells[0]?.innerText.trim() || '',
            shift: cells[1]?.innerText.trim() || '',
            team: cells[2]?.innerText.trim() || '',
            department: cells[3]?.innerText.trim() || null,
            location: cells[4]?.innerText.trim() || null,
          };
        });
      });

      // Process and save data using connection pool
      const result = await this.processScheduleData(company, scheduleData);
      
      const duration = Date.now() - startTime;
      console.log(`⚡ ${company.name} completed in ${duration}ms`);

      return {
        ...result,
        duration,
        success: true
      };

    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, CONFIG.RATE_LIMIT_DELAY));
    }
  }

  async processScheduleData(company, scheduleData) {
    return await dbPool.executeQuery(async (supabase) => {
      // Clear existing schedules
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('company_id', company.id);

      if (deleteError) {
        console.warn(`⚠️ Warning clearing ${company.name} schedules:`, deleteError.message);
      }

      // Batch insert new schedules
      const batchSize = 50;
      let insertedRecords = 0;
      let failedRecords = 0;

      for (let i = 0; i < scheduleData.length; i += batchSize) {
        const batch = scheduleData.slice(i, i + batchSize);
        
        const records = batch.map(record => ({
          company_id: company.id,
          team_name: record.team || 'Unknown',
          department: record.department || company.departments[0] || 'General',
          date: this.parseScheduleDate(record.date),
          shift_type: record.shift || 'Unknown',
          location: record.location || null,
          status: 'active',
          scraped_at: new Date().toISOString()
        })).filter(record => record.date); // Filter out invalid dates

        if (records.length > 0) {
          const { error: insertError } = await supabase
            .from('schedules')
            .upsert(records, {
              onConflict: 'company_id,team_name,department,date'
            });

          if (insertError) {
            console.error(`❌ Batch insert error for ${company.name}:`, insertError.message);
            failedRecords += records.length;
          } else {
            insertedRecords += records.length;
          }
        }
      }

      // Log results
      const logData = {
        company_id: company.id,
        status: failedRecords === 0 ? 'success' : (insertedRecords > 0 ? 'partial' : 'error'),
        records_processed: scheduleData.length,
        records_inserted: insertedRecords,
        records_failed: failedRecords,
        execution_time_ms: Date.now() - Date.now(),
        created_at: new Date().toISOString()
      };

      await supabase.from('scrape_logs').insert([logData]);

      return {
        totalRecords: scheduleData.length,
        insertedRecords,
        failedRecords,
        teams: [...new Set(scheduleData.map(r => r.team).filter(Boolean))],
        departments: [...new Set(scheduleData.map(r => r.department).filter(Boolean))]
      };
    });
  }

  parseScheduleDate(dateString) {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    } catch (error) {
      return null;
    }
  }
}

// Health monitoring
class HealthMonitor {
  constructor() {
    this.metrics = {
      totalScrapes: 0,
      successfulScrapes: 0,
      failedScrapes: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      activeConnections: 0
    };

    this.startMonitoring();
  }

  startMonitoring() {
    setInterval(() => {
      this.updateMetrics();
      this.logHealth();
    }, CONFIG.HEALTH_CHECK_INTERVAL);
  }

  updateMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024); // MB
    this.metrics.activeConnections = dbPool.activeConnections;
  }

  logHealth() {
    console.log('🏥 Health Check:', {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      queueSize: scrapingQueue.queue.length,
      activeJobs: scrapingQueue.activeJobs
    });
  }

  recordScrape(success, responseTime) {
    this.metrics.totalScrapes++;
    if (success) {
      this.metrics.successfulScrapes++;
    } else {
      this.metrics.failedScrapes++;
    }
    
    // Update rolling average
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime + responseTime) / 2;
  }
}

// Main execution
const scrapingQueue = new ScrapingQueue();
const healthMonitor = new HealthMonitor();

async function runLoadBalancedScraper() {
  const startTime = Date.now();
  console.log('🏭 Starting load-balanced multi-company scraper...');
  console.log('⚙️ Configuration:', CONFIG);

  try {
    // Add all companies to queue with priorities
    Object.values(COMPANIES).forEach(company => {
      scrapingQueue.addJob(company, company.priority);
    });

    // Process the queue
    await scrapingQueue.processQueue();

    const duration = Date.now() - startTime;
    const results = Array.from(scrapingQueue.results.values());
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    const totalRecords = results.reduce((sum, r) => sum + (r.totalRecords || 0), 0);

    console.log('\n🎉 Load-balanced scraping completed!');
    console.log('📊 Final Results:', {
      totalCompanies: Object.keys(COMPANIES).length,
      successful,
      failed,
      totalRecords,
      duration: `${duration}ms`,
      averageTimePerCompany: `${Math.round(duration / Object.keys(COMPANIES).length)}ms`,
      memoryUsage: `${healthMonitor.metrics.memoryUsage}MB`
    });

    process.exit(0);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n💥 Load-balanced scraping failed after ${duration}ms`);
    console.error('Final error:', error.message);
    process.exit(1);
  }
}

// Cluster management for multiple processes
if (cluster.isMaster) {
  const numCPUs = Math.min(os.cpus().length, 4); // Max 4 processes
  console.log(`🔄 Master process starting ${numCPUs} workers`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`💀 Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  // Worker process
  runLoadBalancedScraper();
}