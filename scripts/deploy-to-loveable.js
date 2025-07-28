#!/usr/bin/env node

/**
 * Deploy Enhanced Scraping to Loveable
 * This script sets up the multi-company scraping functionality for Loveable deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Enhanced Scraping to Loveable...\n');

// 1. Create deployment configuration
const deploymentConfig = {
  name: 'skiftappen-enhanced-scraping',
  version: '2.0.0',
  description: 'Enhanced multi-company schedule scraping with comprehensive logging',
  features: [
    'Multi-company support (Volvo, SCA, SSAB, Boliden, Barilla, etc.)',
    'Department and team-specific scraping',
    'Comprehensive error handling and logging',
    'Database schema with schedules, scrape_logs, and schedule_sources tables',
    'Real-time progress tracking',
    'Automatic screenshot capture on errors',
    'Performance monitoring and statistics'
  ],
  environment: {
    required: [
      'SUPABASE_URL',
      'SUPABASE_KEY',
      'PUPPETEER_EXECUTABLE_PATH'
    ],
    optional: [
      'SCRAPE_FREQUENCY_MINUTES',
      'MAX_CONCURRENT_COMPANIES',
      'ENABLE_SCREENSHOTS'
    ]
  },
  database: {
    newTables: [
      'schedules',
      'schedule_sources', 
      'scrape_logs'
    ],
    enhancedTables: [
      'companies (added: slug, schedule_url, teams_config, departments_config)',
      'teams (added: department, shift_pattern)'
    ]
  }
};

// 2. Create Loveable deployment instructions
const loveableInstructions = `
# 🏭 Enhanced Multi-Company Schedule Scraping for Loveable

## 📋 Deployment Checklist

### 1. Database Setup
- [ ] Run the enhanced database schema: \`scripts/enhanced-database-schema.sql\`
- [ ] Verify all tables are created: schedules, schedule_sources, scrape_logs
- [ ] Check that companies and teams tables have new columns
- [ ] Ensure RLS policies are properly configured

### 2. Environment Variables
Add these to your Loveable environment:

\`\`\`
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
SCRAPE_FREQUENCY_MINUTES=60
MAX_CONCURRENT_COMPANIES=3
ENABLE_SCREENSHOTS=true
\`\`\`

### 3. Deployment Files
- [ ] \`scripts/multi-company-scraper.cjs\` - Main multi-company scraping script
- [ ] \`scripts/enhanced-database-schema.sql\` - Complete database schema
- [ ] \`scripts/puppeteer-template.js\` - Reusable scraping template
- [ ] \`scripts/README.md\` - Comprehensive documentation

### 4. Scheduled Jobs
Set up these scheduled jobs in Loveable:

1. **Main Scraping Job** (Every hour):
   \`\`\`bash
   node scripts/multi-company-scraper.cjs
   \`\`\`

2. **Database Cleanup** (Daily at 2 AM):
   \`\`\`sql
   SELECT cleanup_old_schedules(90);
   \`\`\`

3. **Health Check** (Every 15 minutes):
   \`\`\`bash
   node scripts/health-check.js
   \`\`\`

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
- Detailed scraping logs in the \`scrape_logs\` table
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
\`\`\`bash
# Test single company
node scripts/multi-company-scraper.cjs --company=VOLVO

# Check database connectivity
node scripts/test-db-connection.js

# Verify Chrome installation
which google-chrome-stable
\`\`\`

## 📈 Monitoring Queries

\`\`\`sql
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
\`\`\`
`;

// 3. Create health check script
const healthCheckScript = `
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function healthCheck() {
  console.log('🏥 Running health check...');
  
  try {
    // Check database connectivity
    const { data, error } = await supabase.from('companies').select('count').limit(1);
    if (error) throw error;
    
    // Check recent scraping activity
    const { data: recentLogs } = await supabase
      .from('scrape_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
      .order('created_at', { ascending: false })
      .limit(10);
    
    const healthStatus = {
      timestamp: new Date().toISOString(),
      database: '✅ Connected',
      recentActivity: recentLogs?.length || 0,
      status: 'healthy'
    };
    
    console.log('Health check results:', healthStatus);
    return healthStatus;
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return {
      timestamp: new Date().toISOString(),
      database: '❌ Failed',
      error: error.message,
      status: 'unhealthy'
    };
  }
}

if (require.main === module) {
  healthCheck()
    .then(status => {
      process.exit(status.status === 'healthy' ? 0 : 1);
    })
    .catch(() => process.exit(1));
}

module.exports = { healthCheck };
`;

// 4. Write files
try {
  // Write deployment config
  fs.writeFileSync(
    path.join(__dirname, 'deployment-config.json'),
    JSON.stringify(deploymentConfig, null, 2)
  );
  console.log('✅ Created deployment-config.json');

  // Write Loveable instructions
  fs.writeFileSync(
    path.join(__dirname, 'LOVEABLE_DEPLOYMENT_INSTRUCTIONS.md'),
    loveableInstructions
  );
  console.log('✅ Created LOVEABLE_DEPLOYMENT_INSTRUCTIONS.md');

  // Write health check script
  fs.writeFileSync(
    path.join(__dirname, 'health-check.js'),
    healthCheckScript
  );
  console.log('✅ Created health-check.js');

  // Update package.json with new scripts
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    packageJson.scripts = {
      ...packageJson.scripts,
      'scrape:multi': 'node scripts/multi-company-scraper.cjs',
      'scrape:single': 'node scripts/scrape-upload.cjs',
      'scrape:test': 'node scripts/test-scraping.js',
      'scrape:health': 'node scripts/health-check.js',
      'deploy:setup': 'node scripts/deploy-to-loveable.js'
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json with scraping scripts');
  }

  console.log('\n🎉 Deployment preparation completed!');
  console.log('\n📋 Next Steps for Loveable:');
  console.log('1. Run the database schema: scripts/enhanced-database-schema.sql');
  console.log('2. Set environment variables in Loveable dashboard');
  console.log('3. Deploy the application with new scraping scripts');
  console.log('4. Set up scheduled jobs for automatic scraping');
  console.log('5. Monitor scraping logs and health checks');
  console.log('\n📖 See LOVEABLE_DEPLOYMENT_INSTRUCTIONS.md for detailed instructions');

} catch (error) {
  console.error('❌ Deployment preparation failed:', error.message);
  process.exit(1);
}