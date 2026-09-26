const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  const url = 'file://' + path.resolve('index.html');
  await page.goto(url, { waitUntil: 'networkidle0' });

  await new Promise(r => setTimeout(r, 6000));

  await page.screenshot({ path: 'mobile_before_scroll.png' });
  
  // Scroll to reelfolio
  await page.evaluate(() => {
    document.getElementById('featured-grid').scrollIntoView();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'mobile_at_reelfolio.png' });

  // Scroll a bit more
  await page.evaluate(() => {
    window.scrollBy(0, 300);
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'mobile_scrolled.png' });

  await browser.close();
  console.log("Screenshots taken.");
})();
