const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://brand.dropbox.com/', { waitUntil: 'networkidle2' });

  // Wait a few seconds for initial animations
  await new Promise(r => setTimeout(r, 3000));

  // Get initial state of the Logo tile
  const initialLogo = await page.evaluate(() => {
    const el = document.querySelector('.tile.logo');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
  });

  // Scroll down
  await page.evaluate(() => window.scrollBy(0, 1000));
  await new Promise(r => setTimeout(r, 2000)); // wait for scroll animation

  // Get scrolled state of the Logo tile
  const scrolledLogo = await page.evaluate(() => {
    const el = document.querySelector('.tile.logo');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
  });

  console.log("Initial Logo:", initialLogo);
  console.log("Scrolled Logo:", scrolledLogo);

  await browser.close();
})();
