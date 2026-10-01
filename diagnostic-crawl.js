const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  const pages = [
    '/',
    '/about.html',
    '/work.html',
    '/project.html',
    '/services.html',
    '/contact.html',
    '/admin.html',
    '/404.html'
  ];

  for (const p of pages) {
    const page = await browser.newPage();
    const url = `http://localhost:4173${p}`;
    
    let consoleErrors = [];
    let failedRequests = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push(err.toString());
    });
    
    page.on('requestfailed', req => {
      failedRequests.push(`${req.method()} ${req.url()} - ${req.failure().errorText}`);
    });

    page.on('response', res => {
      if (!res.ok() && res.status() !== 200 && res.status() !== 304 && res.status() !== 204 && res.status() !== 206) {
        // Exclude specific known 404s if it's the 404 page itself, wait no, report all
        failedRequests.push(`${res.request().method()} ${res.url()} - HTTP ${res.status()}`);
      }
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      // wait a bit more for dynamic stuff
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      consoleErrors.push(`Navigation Error: ${e.message}`);
    }
    
    console.log(`\n=== Report for ${p} ===`);
    console.log(`Console Errors (${consoleErrors.length}):`);
    consoleErrors.forEach(err => console.log(`  - ${err}`));
    console.log(`Failed Requests (${failedRequests.length}):`);
    failedRequests.forEach(req => console.log(`  - ${req}`));
    
    await page.close();
  }

  await browser.close();
})();
