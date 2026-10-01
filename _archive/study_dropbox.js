const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Intercept requests to find animation libraries
  const scripts = new Set();
  page.on('response', response => {
    const url = response.url();
    if (url.endsWith('.js')) {
      scripts.add(url);
    }
  });

  console.log("Navigating to https://brand.dropbox.com/ ...");
  await page.goto('https://brand.dropbox.com/', { waitUntil: 'networkidle2' });

  // Evaluate page structure
  const data = await page.evaluate(() => {
    const getStyles = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const comp = window.getComputedStyle(el);
      return {
        display: comp.display,
        gridTemplateColumns: comp.gridTemplateColumns,
        position: comp.position,
        transform: comp.transform,
        transition: comp.transition
      };
    };

    // Try to find the grid container (might be 'main', or div with grid)
    const allElements = Array.from(document.querySelectorAll('*'));
    const gridElements = allElements.filter(el => window.getComputedStyle(el).display === 'grid');
    
    return {
      title: document.title,
      gridClasses: gridElements.map(el => el.className).filter(c => c).slice(0, 5),
      htmlSnippet: document.body.innerHTML.substring(0, 1000)
    };
  });

  console.log("--- SCRIPTS LOADED ---");
  console.log(Array.from(scripts).join('\n'));
  
  console.log("\n--- DOM DATA ---");
  console.log(JSON.stringify(data, null, 2));

  await browser.close();
})();
