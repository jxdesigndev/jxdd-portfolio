const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  // Intercept matchMedia to fake hover: hover
  await page.evaluateOnNewDocument(() => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = (query) => {
      if (query === '(hover: none)') {
        return { matches: false, addEventListener: () => {}, removeEventListener: () => {} };
      }
      return originalMatchMedia.call(window, query);
    };
  });

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
  
  await page.mouse.move(100, 100);
  await new Promise(r => setTimeout(r, 500));
  
  const cursor1 = await page.evaluate(() => {
    return document.querySelector('.cursor').style.transform;
  });
  console.log("Cursor at (100,100):", cursor1);

  await page.mouse.move(500, 300, { steps: 10 });
  await new Promise(r => setTimeout(r, 500));
  
  const cursor2 = await page.evaluate(() => {
    return document.querySelector('.cursor').style.transform;
  });
  console.log("Cursor at (500,300):", cursor2);
  
  await browser.close();
})();
