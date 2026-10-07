const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.toString());
  });
  await page.goto('http://localhost:4173/services.html', { waitUntil: 'networkidle0' });
  if (errors.length > 0) {
    console.log("Console Errors found:", errors);
  } else {
    console.log("No console errors found on services.html.");
  }
  await browser.close();
})();
