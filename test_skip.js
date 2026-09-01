const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[BROWSER]: ${msg.type()} - ${msg.text()}`));
  page.on('pageerror', err => console.log(`[BROWSER_ERROR]: ${err.toString()}`));
  
  console.log("Loading page...");
  const gotoPromise = page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded' });
  await gotoPromise;
  
  console.log("Waiting for runLoader to attach...");
  await page.waitForFunction(() => {
    return window.jxRunLoaderStarted === true;
  });
  
  // Wait an extra 50ms to ensure the event listener is fully attached
  await new Promise(r => setTimeout(r, 50));
  
  console.log("Clicking skip button...");
  const clicked = await page.evaluate(() => {
    const btn = document.getElementById('loader-skip');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log("Skip clicked? " + clicked);
  
  console.log("Waiting 3s for settle...");
  await new Promise(r => setTimeout(r, 3000));
  
  await page.screenshot({ path: 'after_skip_real.png' });
  
  console.log("Closing browser.");
  await browser.close();
})();
