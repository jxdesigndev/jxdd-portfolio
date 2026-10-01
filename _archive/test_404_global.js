const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.text().includes('404')) {
            console.log('CONSOLE ERROR:', msg.text(), msg.location().url);
        }
    });
    
    page.on('requestfailed', request => {
      console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
    });

    page.on('response', response => {
      if (response.status() === 404) {
        console.log('RESPONSE 404:', response.url());
      }
    });

    console.log("Loading index.html...");
    await page.goto('https://www.jxdesign.dev/', { waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log("Loading work.html...");
    await page.goto('https://www.jxdesign.dev/work.html', { waitUntil: 'networkidle0', timeout: 30000 });
    
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
})();
