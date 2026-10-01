const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8080/work.html', { waitUntil: 'networkidle0' });

  const cards = await page.$$('.work-card');
  console.log("Opening modal...");
  await cards[0].click();
  await new Promise(r => setTimeout(r, 1000));

  // Check if listener is attached and element exists
  const hasButton = await page.evaluate(() => !!document.getElementById('vault-modal-close'));
  console.log("Has button:", hasButton);

  // Try to click programmatically via JS
  console.log("Clicking button via JS...");
  await page.evaluate(() => document.getElementById('vault-modal-close').click());
  await new Promise(r => setTimeout(r, 1000));

  const isRemoved = await page.evaluate(() => !document.getElementById('vault-modal-overlay'));
  console.log("Is modal removed after JS click?", isRemoved);

  await browser.close();
})();
