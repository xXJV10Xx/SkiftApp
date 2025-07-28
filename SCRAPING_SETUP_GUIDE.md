# 🔧 Skiftappen Scraping Setup & Fix Guide

## 📋 Issues Found & Fixed

### 1. ❌ Missing Dependencies
**Problem**: `puppeteer-core` was not installed
**Fix**: Added `puppeteer-core` to dependencies

```bash
npm install puppeteer-core
```

### 2. ❌ Missing Database Table
**Problem**: `schedules` table didn't exist in database
**Fix**: Added table definition to `DATABASE_SETUP.md`

### 3. ❌ Environment Variable Issues
**Problem**: Hardcoded credentials and missing fallbacks
**Fix**: Improved environment variable handling in all scripts

### 4. ❌ Poor Error Handling
**Problem**: Scripts crashed without helpful error messages
**Fix**: Added comprehensive error handling and retry logic

### 5. ❌ GitHub Workflow Issues
**Problem**: Exposed secrets and missing Chrome setup
**Fix**: Updated workflow to use GitHub secrets and proper Chrome installation

## 🚀 Setup Instructions

### Step 1: Install Dependencies
```bash
npm install puppeteer-core
```

### Step 2: Set Up Database Table
Run this SQL in your Supabase SQL Editor:

```sql
-- Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,
  shift TEXT,
  team TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Schedules are viewable by authenticated users" ON schedules
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Schedules can be managed by service role" ON schedules
  FOR ALL USING (auth.role() = 'service_role');
```

### Step 3: Configure Environment Variables
Create a `.env` file with:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# For scraping script (use service role key)
SUPABASE_URL=https://your-project-id.supabase.co  
SUPABASE_KEY=your-service-role-key-here

# Puppeteer Configuration (optional)
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

### Step 4: Set Up GitHub Secrets
In your GitHub repository settings, add these secrets:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key (NOT the anon key)

### Step 5: Test the Setup
```bash
# Test all components
npm run test-scraper

# Set up database (if needed)
npm run setup-db

# Run the scraper manually
npm run scrape
```

## 📝 Available Scripts

### `npm run test-scraper`
Tests all scraper components:
- Environment variables
- Database connection
- Table operations
- Puppeteer dependencies

### `npm run setup-db`
Attempts to set up the database table automatically

### `npm run scrape`
Runs the main scraping script

## 🔄 Scheduling

The scraper runs automatically via GitHub Actions:
- **Schedule**: Daily at 3:00 AM Swedish time
- **Manual**: Can be triggered manually from GitHub Actions tab
- **Workflow**: `.github/workflows/daily.yml`

## 🛠️ Script Improvements

### Enhanced Error Handling
- Retry logic for network operations
- Comprehensive error messages
- Graceful failure handling
- Detailed logging

### Better Environment Management
- Multiple fallback options for environment variables
- Validation of required variables
- Clear error messages for missing config

### Improved Database Operations
- Batch inserts for better performance
- Connection testing
- Data validation
- Cleanup on errors

### Robust Scraping
- User agent spoofing
- Viewport configuration
- Network idle waiting
- Element waiting with timeouts

## 🐛 Troubleshooting

### Common Issues

#### "Could not find module 'puppeteer-core'"
```bash
npm install puppeteer-core
```

#### "Could not find the 'date' column"
The schedules table doesn't exist or has wrong schema. Run:
```bash
npm run setup-db
```
Or manually create the table using the SQL above.

#### "Database connection failed"
Check your Supabase credentials in `.env` file.

#### "Chrome executable not found"
This is normal in development. Chrome is installed automatically in CI/CD.

#### GitHub Action fails with "Scraping job failed"
1. Check that GitHub secrets are set correctly
2. Verify the target website is accessible
3. Check the logs for specific error messages

### Debug Mode
For detailed debugging, run:
```bash
DEBUG=* npm run scrape
```

## 📊 Monitoring

### Success Indicators
- ✅ Script completes without errors
- ✅ Data is inserted into `schedules` table
- ✅ GitHub Action shows green status
- ✅ Logs show "Scraping completed successfully"

### Failure Indicators
- ❌ Script exits with error code 1
- ❌ No new data in `schedules` table
- ❌ GitHub Action shows red status
- ❌ Error messages in logs

## 🔐 Security Notes

### Environment Variables
- Never commit real credentials to git
- Use GitHub secrets for CI/CD
- Use service role key for scraping (has more permissions)
- Use anon key for client-side operations

### Database Security
- Row Level Security (RLS) is enabled
- Service role can manage all data
- Authenticated users can view data
- Anonymous users have no access

## 📈 Performance

### Optimizations Applied
- Batch database operations (100 records at a time)
- Connection pooling via Supabase client
- Efficient DOM querying
- Memory cleanup after scraping

### Monitoring Metrics
- Scraping duration (typically 10-30 seconds)
- Records processed (varies by website content)
- Memory usage (monitored via process stats)
- Error rates (should be < 1%)

## 🔄 Maintenance

### Regular Tasks
- Monitor GitHub Action success rate
- Check database growth and cleanup old data if needed
- Update dependencies monthly
- Verify target website hasn't changed structure

### Updating the Scraper
1. Test changes locally with `npm run test-scraper`
2. Run manual scrape with `npm run scrape`
3. Commit changes to trigger automatic deployment
4. Monitor first automated run

## 📞 Support

If you encounter issues:

1. **Check this guide** for common solutions
2. **Run the test script**: `npm run test-scraper`
3. **Check the logs** in GitHub Actions
4. **Verify environment variables** are set correctly
5. **Test database connection** manually

## 🎯 Next Steps

After setup is complete:
- [ ] Verify daily scraping works
- [ ] Set up monitoring/alerting if desired
- [ ] Consider adding data validation rules
- [ ] Plan for handling website structure changes