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
  
  for (const p of pagesToTest) {
    const page = await browser.newPage();
    let hasError = false;
    
    // Ignore sentry requests to avoid clutter, focus on JS errors
    page.on('pageerror', err => {
      console.error(`[${p}] Uncaught Exception:`, err.toString());
      hasError = true;
    });

    const response = await page.goto(`http://localhost:4173${p}`, { waitUntil: 'networkidle0' });
    console.log(`[${p}] Status: ${response.status()} | Error: ${hasError ? 'YES' : 'NO'}`);
    await page.close();
  }

  await browser.close();
  process.exit(0);
})();
