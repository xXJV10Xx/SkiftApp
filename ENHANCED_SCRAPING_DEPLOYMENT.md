# 🏭 Enhanced Multi-Company Schedule Scraping - Loveable Deployment

## 🎯 Overview

This deployment adds comprehensive multi-company schedule scraping functionality to ensure **schedule syncing works correctly for every company, avdelning/ort (department/location), and skiftlag (shift team)**. The enhanced system provides enterprise-grade logging, error handling, and monitoring capabilities.

## ✅ What's Been Implemented

### 🏢 Multi-Company Support
- **Volvo**: Teams A, B, C, D with departments (Produktion, Montering, Kvalitet, Underhåll, Logistik)
- **SCA**: Teams Röd, Blå, Gul, Grön with departments (Massa, Papper, Underhåll, Kvalitet, Logistik)
- **SSAB**: Teams 1, 2, 3, 4, 5 with departments (Masugn, Stålverk, Varmvalsning, Kallvalsning, Underhåll)
- **Boliden**: Teams Alpha, Beta, Gamma, Delta with departments (Gruva, Anrikning, Smältverk, Underhåll, Miljö)
- **Barilla**: Teams 1, 2, 3, 4, 5 with departments (Produktion, Förpackning, Kvalitet, Underhåll, Lager)
- **Extensible**: Easy to add more companies, teams, and departments

### 🗄️ Enhanced Database Schema
```sql
-- New Tables Created:
- schedules: Main schedule data with company/team/department breakdown
- schedule_sources: Track different scraping sources and configurations  
- scrape_logs: Comprehensive logging of all scraping activities

-- Enhanced Existing Tables:
- companies: Added slug, schedule_url, teams_config, departments_config
- teams: Added department, shift_pattern columns
```

### 🔧 Enhanced Scraping Scripts

#### 1. **Multi-Company Scraper** (`scripts/multi-company-scraper.cjs`)
- Scrapes all companies, teams, and departments in parallel
- Comprehensive error handling per company
- Database logging of all activities
- Performance monitoring and statistics

#### 2. **Enhanced Single Scraper** (`scripts/scrape-upload.cjs`)
- Improved version of original scraper with enhanced logging
- Better error handling and debugging capabilities
- Screenshot capture on failures

#### 3. **Reusable Template** (`scripts/puppeteer-template.js`)
- Modular scraping template for creating new scrapers
- Built-in logging, error handling, and debugging features
- Configurable options for different scraping scenarios

#### 4. **Health Check** (`scripts/health-check.js`)
- Monitor scraping system health
- Database connectivity checks
- Recent activity monitoring

### 📊 Comprehensive Logging & Monitoring

#### Features:
- ✅ **Step-by-step progress tracking** with emojis for easy reading
- ✅ **Environment validation** to check required variables
- ✅ **Performance timing** for each company and overall process
- ✅ **Error details** with stack traces, timestamps, and context
- ✅ **Automatic screenshot capture** on failures for debugging
- ✅ **Database logging** of all scraping activities
- ✅ **Success/failure statistics** per company, team, and department

#### Example Output:
```
🏭 Starting multi-company schedule scraping...
📊 Configuration: { totalCompanies: 5, companies: ['VOLVO', 'SCA', 'SSAB', 'BOLIDEN', 'BARILLA'] }
🔍 Validating environment...
🔄 Syncing companies to database...
✅ Companies synced successfully

🏢 Processing company: Volvo (volvo)
📄 Creating page for Volvo...
🌐 Navigating to https://skiftschema.se/volvo...
✅ Navigation completed with status: 200
🔍 Waiting for primary button...
✅ Primary button clicked
📊 Waiting for schedule table...
✅ Schedule table loaded
📋 Extracting schedule data...
✅ Extracted 120 schedule records
💾 Processing schedule data for Volvo...
📈 Progress: 10/120 records processed
📈 Progress: 20/120 records processed
...
✅ Volvo completed: 120 records processed

🎉 Multi-company scraping completed!
📊 Final Results: { totalCompanies: 5, successful: 5, failed: 0, totalRecords: 580 }
```

## 🚀 Deployment Steps for Loveable

### 1. Database Setup
```sql
-- Run this SQL in your Supabase dashboard:
-- (Copy from scripts/enhanced-database-schema.sql)
```

### 2. Environment Variables
Add to Loveable environment:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key  
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
SCRAPE_FREQUENCY_MINUTES=60
```

### 3. Deploy Files
Upload these files to Loveable:
- `scripts/multi-company-scraper.cjs`
- `scripts/enhanced-database-schema.sql`
- `scripts/puppeteer-template.js`
- `scripts/health-check.js`
- `scripts/README.md`

### 4. Set Up Scheduled Jobs
Configure these cron jobs in Loveable:

**Main Scraping** (Every hour):
```bash
0 * * * * node scripts/multi-company-scraper.cjs
```

**Health Check** (Every 15 minutes):
```bash
*/15 * * * * node scripts/health-check.js
```

**Database Cleanup** (Daily at 2 AM):
```sql
0 2 * * * SELECT cleanup_old_schedules(90);
```

## 📊 Expected Results

After deployment, the system will:

### ✅ Sync All Companies
- Automatically sync all companies from `data/companies.ts` to database
- Create teams and departments for each company
- Assign proper colors and configurations

### ✅ Scrape All Schedules
- Extract schedule data for every team in every company
- Map teams to appropriate departments
- Handle different schedule formats and structures

### ✅ Comprehensive Logging
- Log every scraping activity to `scrape_logs` table
- Track success/failure rates per company
- Store performance metrics and timing data
- Capture error details for debugging

### ✅ Data Structure
```javascript
// Example schedule record:
{
  id: "uuid",
  company_id: "volvo",
  team_name: "A", 
  department: "Produktion",
  date: "2024-01-15",
  shift_type: "Dagskift",
  start_time: "06:00",
  end_time: "14:00",
  location: "Göteborg",
  status: "active",
  scraped_at: "2024-01-15T10:30:00Z"
}
```

## 🔍 Monitoring & Verification

### Database Queries
```sql
-- Check scraping activity
SELECT * FROM scraping_stats ORDER BY last_scrape_time DESC;

-- View current schedules  
SELECT * FROM current_schedules WHERE date >= CURRENT_DATE LIMIT 10;

-- Check error rates
SELECT company_id, 
       COUNT(*) as total_scrapes,
       COUNT(CASE WHEN status = 'error' THEN 1 END) as errors
FROM scrape_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY company_id;
```

### Health Check
```bash
# Run health check
npm run scrape:health

# Expected output:
🏥 Running health check...
Health check results: {
  timestamp: "2024-01-15T10:30:00.000Z",
  database: "✅ Connected", 
  recentActivity: 5,
  status: "healthy"
}
```

## 🎯 Key Benefits

### 🏢 Complete Company Coverage
- **Every company** gets its schedules scraped
- **Every team** within each company is tracked
- **Every department** is properly mapped and organized

### 📊 Enterprise-Grade Monitoring
- Real-time progress tracking
- Comprehensive error logging  
- Performance metrics and statistics
- Automatic failure detection and alerts

### 🛡️ Robust Error Handling
- Individual company failures don't stop the entire process
- Automatic screenshot capture for debugging
- Detailed error context and stack traces
- Graceful recovery and resource cleanup

### ⚡ High Performance
- Parallel processing capabilities
- Request interception for faster scraping
- Efficient database operations with upserts
- Configurable timeouts and retry logic

## 🚨 Important Notes

1. **Very Important**: This ensures schedule syncing works for **every company, avdelning/ort, and skiftlag** as requested
2. **Database Migration**: Run the schema carefully in production
3. **Resource Monitoring**: Monitor memory/CPU usage during scraping
4. **Rate Limiting**: Be respectful of source website limits
5. **Error Alerts**: Set up monitoring for failed scraping jobs

## 📞 Support

If you encounter issues:
1. Check the `scrape_logs` table for error details
2. Run health check: `npm run scrape:health`
3. Verify environment variables are set correctly
4. Check Chrome/Chromium installation
5. Review the comprehensive documentation in `scripts/README.md`

---

**🎉 This deployment ensures comprehensive schedule syncing for all companies, departments, and teams with enterprise-grade logging and monitoring!**