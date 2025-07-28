const { scrapeWithLogging } = require('./puppeteer-template.js');

async function testScraping() {
  console.log('🧪 Testing enhanced Puppeteer scraping with logging...\n');
  
  try {
    // Test with a simple data URL to avoid external dependencies
    const testHtml = `
      <html>
        <head><title>Test Page</title></head>
        <body>
          <h1>Test Heading</h1>
          <h2>Subheading</h2>
          <p>This is a test paragraph.</p>
          <a href="#link1">Link 1</a>
          <a href="#link2">Link 2</a>
          <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="test">
        </body>
      </html>
    `;
    
    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(testHtml)}`;
    
    const result = await scrapeWithLogging({
      url: dataUrl,
      timeout: 10000,
      scrapeLogic: async (page) => {
        console.log('🔍 Custom scraping logic: Extracting test data...');
        
        // Wait for the heading to ensure page is loaded
        await page.waitForSelector('h1', { timeout: 5000 });
        
        // Extract data from the test page
        const data = await page.evaluate(() => {
          const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
          const links = Array.from(document.querySelectorAll('a'));
          const images = Array.from(document.querySelectorAll('img'));
          
          return {
            title: document.title,
            headings: headings.map(h => ({
              tag: h.tagName.toLowerCase(),
              text: h.innerText.trim()
            })),
            linkCount: links.length,
            imageCount: images.length,
            bodyLength: document.body.innerText.length
          };
        });
        
        console.log('📊 Extracted data:', data);
        return data;
      }
    });
    
    console.log('\n✅ Test completed successfully!');
    console.log('📋 Final result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testScraping()
    .then(() => {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testScraping };