const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox']
  });
  
  try {
    const pagesToTest = [
      'https://www.jxdesign.dev/',
      'https://www.jxdesign.dev/work.html'
    ];

    for (const url of pagesToTest) {
      console.log(`Testing ${url}...`);
      const page = await browser.newPage();
      
      const failedRequests = [];
      
      page.on('response', response => {
        if (response.status() === 404) {
          failedRequests.push(response.url());
        }
      });
      
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      console.log(`404s found on ${url}:`, failedRequests);
      await page.close();
    }
    
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
})();
