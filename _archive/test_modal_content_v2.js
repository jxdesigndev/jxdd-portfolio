const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

    await page.goto('https://www.jxdesign.dev/work.html', { waitUntil: 'networkidle2' });
    
    // Check projects loaded
    const cardCount = await page.evaluate(() => document.querySelectorAll('.work-card').length);
    console.log("Cards on screen:", cardCount);

    if (cardCount > 0) {
      await page.evaluate(() => {
        document.querySelector('.work-card').click();
      });
      await new Promise(r => setTimeout(r, 1000));
      
      const modalExists = await page.evaluate(() => !!document.getElementById('vault-modal-overlay'));
      console.log(`Modal open state: ${modalExists}`);
      
      if (modalExists) {
        console.log("Checking test script selectors (.modal-img, .modal-link):");
        const wrongImage = await page.evaluate(() => !!document.querySelector('.modal-img'));
        const wrongLink = await page.evaluate(() => !!document.querySelector('.modal-link'));
        console.log(`- .modal-img exists: ${wrongImage}`);
        console.log(`- .modal-link exists: ${wrongLink}`);

        console.log("Checking real selectors (.vault-modal-image img, .vault-modal-content a):");
        const realImage = await page.evaluate(() => {
           const img = document.querySelector('.vault-modal-image img');
           return img ? `exists, src="${img.src}"` : "false";
        });
        const realLinks = await page.evaluate(() => {
           const links = Array.from(document.querySelectorAll('.vault-modal-content a'));
           return links.map(a => `${a.textContent.trim()} -> ${a.href}`).join(', ') || "none";
        });
        console.log(`- .vault-modal-image img: ${realImage}`);
        console.log(`- .vault-modal-content a: ${realLinks}`);
      }
    }
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
})();
