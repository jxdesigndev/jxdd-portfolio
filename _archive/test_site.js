const puppeteer = require('puppeteer');
const path = require('path');

async function testPage(file) {
  console.log(`\n--- Testing ${file} ---`);
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if(msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[${msg.type().toUpperCase()}]`, msg.text());
    }
  });
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.toString()));
  
  const url = 'file://' + path.resolve(file);
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const bodyOpacity = await page.evaluate(() => {
    const pageEl = document.getElementById('page') || document.body;
    return window.getComputedStyle(pageEl).opacity;
  });
  console.log(`Body/Page opacity: ${bodyOpacity}`);
  
  await browser.close();
}

(async () => {
  await testPage('index.html');
  await testPage('about.html');
  await testPage('work.html');
})();
