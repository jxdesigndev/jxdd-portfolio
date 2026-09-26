const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('[LOG]', msg.text()));
  page.on('requestfailed', request => {
    console.log('[FAILED]', request.url());
  });
  page.on('pageerror', err => console.log('[ERROR]', err.toString()));
  
  const url = 'file://' + path.resolve('index.html');
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  await new Promise(r => setTimeout(r, 5000));
  
  const bodyOpacity = await page.evaluate(() => {
    return window.getComputedStyle(document.getElementById('page')).opacity;
  });
  console.log(`Opacity after 5s: ${bodyOpacity}`);
  
  await browser.close();
})();
