
# 🏭 Enhanced Multi-Company Schedule Scraping for Loveable

## 📋 Deployment Checklist

### 1. Database Setup
- [ ] Run the enhanced database schema: `scripts/enhanced-database-schema.sql`
- [ ] Verify all tables are created: schedules, schedule_sources, scrape_logs
- [ ] Check that companies and teams tables have new columns
- [ ] Ensure RLS policies are properly configured

### 2. Environment Variables
Add these to your Loveable environment:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
SCRAPE_FREQUENCY_MINUTES=60
MAX_CONCURRENT_COMPANIES=3
ENABLE_SCREENSHOTS=true
```

### 3. Deployment Files
- [ ] `scripts/multi-company-scraper.cjs` - Main multi-company scraping script
- [ ] `scripts/enhanced-database-schema.sql` - Complete database schema
- [ ] `scripts/puppeteer-template.js` - Reusable scraping template
- [ ] `scripts/README.md` - Comprehensive documentation

### 4. Scheduled Jobs
Set up these scheduled jobs in Loveable:

1. **Main Scraping Job** (Every hour):
   ```bash
   node scripts/multi-company-scraper.cjs
   ```

2. **Database Cleanup** (Daily at 2 AM):
   ```sql
   SELECT cleanup_old_schedules(90);
   ```

3. **Health Check** (Every 15 minutes):
   ```bash
   node scripts/health-check.js
   ```

### 5. Monitoring & Alerts
- [ ] Set up alerts for failed scraping jobs
- [ ] Monitor database growth and performance
- [ ] Track scraping success rates per company
- [ ] Set up log aggregation for debugging

## 🎯 Key Features Deployed

### ✅ Multi-Company Support
- Volvo, SCA, SSAB, Boliden, Barilla and more
- Each company with specific teams and departments
- Configurable schedule URLs per company

### ✅ Enhanced Database Schema
- **schedules**: Main schedule data with company/team/department breakdown
- **schedule_sources**: Track different scraping sources and configurations
- **scrape_logs**: Comprehensive logging of all scraping activities
- **Enhanced companies**: Added schedule URLs and team/department configs
- **Enhanced teams**: Added department and shift pattern support

### ✅ Comprehensive Logging
- Step-by-step progress tracking with emojis
- Error details with stack traces and timestamps
- Automatic screenshot capture on failures
- Performance metrics and timing
- Database logging of all activities

### ✅ Error Handling & Recovery
- Graceful handling of individual company failures
- Automatic retry logic for transient errors
- Detailed error reporting and debugging info
- Resource cleanup and proper browser management

### ✅ Performance Optimization
- Request interception to block unnecessary resources
- Parallel processing capabilities
- Configurable timeouts and retry logic
- Efficient database operations with upserts

## 📊 Expected Results

After deployment, you should see:
- Schedule data for all companies, teams, and departments
- Detailed scraping logs in the `scrape_logs` table
- Real-time monitoring of scraping success rates
- Proper error handling and recovery
- Comprehensive debugging information

## 🚨 Important Notes

1. **Database Migration**: Run the schema migration carefully in production
2. **Environment Variables**: Ensure all required variables are set
3. **Chrome Installation**: Verify Chrome/Chromium is available in the deployment environment
4. **Resource Limits**: Monitor memory and CPU usage during scraping
5. **Rate Limiting**: Be respectful of source websites' rate limits

## 🔧 Troubleshooting

### Common Issues:
1. **Chrome not found**: Set PUPPETEER_EXECUTABLE_PATH correctly
2. **Database connection**: Verify Supabase credentials
3. **Memory issues**: Increase container memory limits
4. **Timeout errors**: Adjust timeout values in configuration
5. **Schema conflicts**: Check for existing table conflicts

### Debug Commands:
```bash
# Test single company
node scripts/multi-company-scraper.cjs --company=VOLVO

# Check database connectivity
node scripts/test-db-connection.js

# Verify Chrome installation
which google-chrome-stable
```

## 📈 Monitoring Queries

```sql
-- Check recent scraping activity
SELECT * FROM scraping_stats ORDER BY last_scrape_time DESC;

-- View current schedules
SELECT * FROM current_schedules WHERE date >= CURRENT_DATE LIMIT 10;

-- Check error rates
SELECT 
  company_id,
  COUNT(*) as total_scrapes,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
  ROUND(COUNT(CASE WHEN status = 'error' THEN 1 END) * 100.0 / COUNT(*), 2) as error_rate
FROM scrape_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY company_id;
```
