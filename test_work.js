const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:4173/work.html', { waitUntil: 'networkidle0' });
  
  const cards = await page.$$eval('.viscose-card', els => els.length);
  const titles = await page.$$eval('.viscose-list-item', els => els.map(e => e.textContent));
  
  console.log('Cards found:', cards);
  console.log('Titles:', titles);

  await browser.close();
  process.exit(0);
})();
