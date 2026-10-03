const puppeteer = require('puppeteer');

const pagesToTest = [
  '/',
  '/about.html',
  '/work.html',
  '/services.html',
  '/contact.html',
  '/project.html?slug=zenflow',
  '/privacy.html',
  '/admin.html',
  '/404.html'
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  let hasGlobalError = false;

  console.log('--- CRAWLING PAGES FOR ERRORS ---');
  for (const p of pagesToTest) {
    const page = await browser.newPage();
    let hasError = false;
    
    page.on('pageerror', err => {
      console.error(`[${p}] Uncaught Exception:`, err.toString());
      hasError = true;
      hasGlobalError = true;
    });

    const response = await page.goto(`http://localhost:4173${p}`, { waitUntil: 'networkidle0' });
    console.log(`[${p}] Status: ${response.status()} | Error: ${hasError ? 'YES' : 'NO'}`);
    await page.close();
  }

  console.log('\n--- TESTING SENTRY INTERCEPTION ---');
  const sentryPage = await browser.newPage();
  let sentryFired = false;
  let blockedByCSP = false;
  
  await sentryPage.setRequestInterception(true);
  sentryPage.on('request', request => {
    const url = request.url();
    if (url.includes('sentry.io')) {
      sentryFired = true;
      console.log('Intercepted Sentry request:', url.substring(0, 80) + '...');
    }
    request.continue();
  });
  sentryPage.on('requestfailed', request => {
    if (request.url().includes('sentry.io')) {
      blockedByCSP = true;
      console.log('Sentry request FAILED (CSP/Network block):', request.url());
    }
  });

  await sentryPage.goto('http://localhost:4173/about.html', { waitUntil: 'networkidle0' });
  await sentryPage.evaluate(() => {
    if (window.Sentry) {
      window.Sentry.captureException(new Error("Final check Sentry error"));
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  console.log(`Sentry Fired Successfully: ${sentryFired && !blockedByCSP}`);
  
  await browser.close();
  process.exit(hasGlobalError ? 1 : 0);
})();
