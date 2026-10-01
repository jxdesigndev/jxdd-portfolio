const puppeteer = require('puppeteer');

const pagesToTest = [
  '/',
  '/about.html',
  '/work.html',
  '/services.html',
  '/project.html',
  '/contact.html',
  '/admin.html',
  '/404.html'
];

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  for (const urlPath of pagesToTest) {
    const url = `http://localhost:4173${urlPath}`;
    console.log(`\n=== Testing ${url} ===`);
    const page = await browser.newPage();
    
    let failedRequests = [];
    let consoleErrors = [];
    
    page.on('response', response => {
      if (!response.ok() && response.status() !== 304 && response.status() !== 204) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'load' });
    
    // Check loader time
    let loaderTime = -1;
    try {
      await page.waitForFunction(() => {
        const el = document.getElementById('loader-pct');
        return !el || el.textContent.includes('100%');
      }, { timeout: 10000 });
      loaderTime = Date.now() - startTime;
    } catch (e) {
      loaderTime = "TIMEOUT";
    }

    console.log(`Loader Reveal Time: ${loaderTime === "TIMEOUT" ? "Timeout" : loaderTime + "ms"}`);
    console.log(`Failed Requests (${failedRequests.length}):`);
    failedRequests.forEach(r => console.log('  ' + r));
    console.log(`Console Errors (${consoleErrors.length}):`);
    consoleErrors.forEach(e => console.log('  ' + e));
    
    if (urlPath === '/') {
      try {
        const swStatus = await page.evaluate(async () => {
          if (!navigator.serviceWorker) return "Not Supported";
          const reg = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise(r => setTimeout(() => r(null), 2000))
          ]);
          if (!reg) return "Timeout waiting for SW";
          return reg.active ? reg.active.state : "No active worker";
        });
        console.log(`Service Worker Status: ${swStatus}`);
      } catch (e) {
        console.log(`Service Worker Check Failed: ${e.message}`);
      }

      try {
        await page.click('#cli-trigger');
        await new Promise(r => setTimeout(r, 1000));
        await page.type('#cli-input', 'pong');
        await page.keyboard.press('Enter');
        await page.waitForSelector('body.pong-active', { timeout: 3000 });
        console.log(`CLI/Pong: Success! Pong canvas opened.`);
      } catch (e) {
        console.log(`CLI/Pong: Failed - ${e.message}`);
      }
    }

    await page.close();
  }

  await browser.close();
})();
