const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('ERR_FILE_NOT_FOUND')) console.log(`[JS Error] ${text}`);
    }
  });
  
  const url = 'file://' + path.resolve('about.html');
  await page.goto(url, { waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const opacity = await page.evaluate(() => {
    return window.getComputedStyle(document.getElementById('page')).opacity;
  });
  console.log(`Page opacity: ${opacity}`);
  
  await browser.close();
})();
