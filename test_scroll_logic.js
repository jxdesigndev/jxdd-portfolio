const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

  const url = 'file://' + path.resolve('index.html');
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  await new Promise(r => setTimeout(r, 6000));

  // Scroll a lot
  await page.evaluate(() => {
    window.scrollBy(0, 1500); // 1500px down should trigger peeling
  });
  
  await new Promise(r => setTimeout(r, 2000));

  const reelfolioDisplay = await page.evaluate(() => {
    const cards = document.querySelectorAll('.reelfolio-card');
    if (!cards.length) return "No cards found";
    
    return Array.from(cards).map((c, i) => {
      const rect = c.getBoundingClientRect();
      const comp = window.getComputedStyle(c);
      return {
        index: i,
        top: rect.top,
        opacity: comp.opacity,
        transform: comp.transform
      };
    });
  });

  console.log("Mobile cards state AFTER scrolling:");
  console.log(reelfolioDisplay);

  await browser.close();
})();
