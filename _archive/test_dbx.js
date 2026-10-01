const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const url = 'file://' + path.resolve('about.html');
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  
  await new Promise(r => setTimeout(r, 1000));
  
  const bentoGridStyle = await page.evaluate(() => {
    const el = document.querySelector('.dbx-bento-grid');
    if (!el) return 'Grid not found';
    const style = window.getComputedStyle(el);
    return {
      display: style.display,
      gridTemplateColumns: style.gridTemplateColumns,
      opacity: style.opacity
    };
  });
  console.log("Grid computed style:", bentoGridStyle);

  await browser.close();
})();
