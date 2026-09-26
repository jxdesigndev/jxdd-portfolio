const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.goto('https://brand.dropbox.com/', { waitUntil: 'networkidle2' });

  // Evaluate page structure
  const data = await page.evaluate(() => {
    // Get all classes that sound like tiles, grids, or boxes
    const allElements = Array.from(document.querySelectorAll('*'));
    const bentoElements = allElements.filter(el => 
      el.className && typeof el.className === 'string' &&
      (el.className.includes('tile') || el.className.includes('grid') || el.className.includes('box'))
    ).map(el => el.className);
    
    return {
      classes: [...new Set(bentoElements)],
    };
  });
  
  console.log(JSON.stringify(data, null, 2));

  await browser.close();
})();
