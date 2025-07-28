# Enhanced Puppeteer Scraping Scripts

This directory contains enhanced Puppeteer scraping scripts with comprehensive logging, error handling, and debugging capabilities.

## Files Overview

### `scrape-upload.cjs`
The main production scraping script that scrapes schedule data from skiftschema.se and uploads it to Supabase. Enhanced with:
- ✅ Comprehensive logging with emojis for easy reading
- ✅ Detailed error handling and debugging information
- ✅ Environment variable validation
- ✅ Progress tracking for data insertion
- ✅ Automatic screenshot capture on errors
- ✅ Proper resource cleanup
- ✅ Performance timing

### `puppeteer-template.js`
A reusable template for creating new Puppeteer scraping scripts with built-in best practices:
- ✅ Configurable options (URL, timeout, custom logic)
- ✅ Request interception for performance optimization
- ✅ Page console and error logging
- ✅ Comprehensive error details with screenshots
- ✅ Modular design for easy reuse

### `test-scraping.js`
A test script that demonstrates the enhanced logging functionality without external dependencies.

## Key Features

### 🚀 Enhanced Browser Launch
```javascript
const browser = await puppeteerCore.launch({
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
  timeout: 30000  // Increased timeout
});
```

### 📊 Comprehensive Logging
- Step-by-step progress tracking with emojis
- Environment validation
- Performance timing
- Error context and debugging information
- Success/failure statistics

### 🛡️ Error Handling
- Detailed error information (message, stack, name, timestamp)
- Automatic screenshot capture on failures
- Current page URL logging
- Graceful resource cleanup
- Proper exit codes

### 🔧 Configuration Options
```javascript
const result = await scrapeWithLogging({
  url: 'https://example.com',
  timeout: 20000,
  launchOptions: {
    headless: false,  // For debugging
    args: ['--custom-arg']
  },
  scrapeLogic: async (page) => {
    // Your custom scraping logic here
    return await page.evaluate(() => {
      // Extract data from the page
    });
  }
});
```

## Usage Examples

### Running the Main Scraper
```bash
# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_KEY="your-supabase-key"
export PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome-stable"

# Run the scraper
node scripts/scrape-upload.cjs
```

### Using the Template for New Scrapers
```javascript
const { scrapeWithLogging } = require('./puppeteer-template.js');

async function scrapeMyWebsite() {
  const result = await scrapeWithLogging({
    url: 'https://mywebsite.com',
    timeout: 15000,
    scrapeLogic: async (page) => {
      await page.waitForSelector('.data-container');
      return await page.evaluate(() => {
        // Your extraction logic
        return { data: 'extracted data' };
      });
    }
  });
  
  console.log('Scraped data:', result);
}
```

### Running Tests
```bash
node scripts/test-scraping.js
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PUPPETEER_EXECUTABLE_PATH` | Path to Chrome executable | `/usr/bin/google-chrome-stable` |
| `SUPABASE_URL` | Supabase project URL | Required for main scraper |
| `SUPABASE_KEY` | Supabase API key | Required for main scraper |

## Error Handling Examples

### Browser Launch Failures
```
❌ Scraping failed: Error: Failed to launch the browser process!
Error details: {
  message: "Failed to launch the browser process!",
  stack: "...",
  name: "Error",
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

### Page Load Timeouts
```
❌ Scraping failed: TimeoutError: Navigation timeout of 20000 ms exceeded
Current page URL: about:blank
📸 Screenshot captured (base64 length): 15420
```

### Element Not Found
```
❌ Scraping failed: TimeoutError: Waiting for selector `.btn-primary` failed: timeout 10000ms exceeded
Current page URL: https://example.com
Page title: Example Page
```

## Performance Optimizations

### Request Interception
The template includes request interception to block unnecessary resources:
```javascript
page.on('request', (req) => {
  if (req.resourceType() === 'stylesheet' || 
      req.resourceType() === 'font' || 
      req.resourceType() === 'image') {
    req.abort();
  } else {
    req.continue();
  }
});
```

### Page Configuration
- Custom user agent for better compatibility
- Configurable timeouts
- Network idle waiting for dynamic content

## Debugging Tips

1. **Enable Screenshots**: Screenshots are automatically captured on errors
2. **Check Console Output**: Page console messages are logged
3. **Use Non-Headless Mode**: Set `headless: false` for visual debugging
4. **Monitor Network**: Check the logged response status codes
5. **Validate Environment**: The script checks environment variables on startup

## Best Practices

1. **Always use try-catch blocks** around scraping logic
2. **Set appropriate timeouts** based on page complexity
3. **Validate extracted data** before processing
4. **Clean up resources** in finally blocks
5. **Log progress** for long-running operations
6. **Handle rate limiting** with delays between requests
7. **Use request interception** to improve performance

## Troubleshooting

### Common Issues

1. **Chrome not found**: Set `PUPPETEER_EXECUTABLE_PATH` correctly
2. **Permission denied**: Ensure Chrome executable has proper permissions
3. **Memory issues**: Add `--disable-dev-shm-usage` to launch args
4. **Timeout errors**: Increase timeout values or check network connectivity
5. **Element not found**: Verify selectors are correct and elements exist

### Debug Mode
To enable debug mode with visible browser:
```javascript
const result = await scrapeWithLogging({
  url: 'https://example.com',
  launchOptions: {
    headless: false,
    devtools: true
  }
});
```

## Contributing

When adding new scraping scripts:
1. Use the `puppeteer-template.js` as a base
2. Include comprehensive logging
3. Add proper error handling
4. Document any new environment variables
5. Create tests for your scraping logic