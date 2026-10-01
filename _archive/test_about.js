const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  const url = 'file://' + path.resolve('about.html');
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  // Wait a bit for JS to execute
  await new Promise(r => setTimeout(r, 2000));
  
  const hubViewStyle = await page.evaluate(() => {
    const el = document.getElementById('hub-view');
    return el ? window.getComputedStyle(el).display : 'Not found';
  });
  console.log("hub-view display:", hubViewStyle);

  const errorNodes = await page.evaluate(() => {
     // check if any unhandled error exists in DOM
     return document.body.innerHTML.substring(0, 500);
  });
  
  await browser.close();
})();
