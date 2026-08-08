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

    await page.goto('https://jxdesigndev.vercel.app/work.html', { waitUntil: 'networkidle2' });
    
    // Check projects loaded
    const cardCount = await page.evaluate(() => document.querySelectorAll('.work-card').length);
    console.log("Cards on screen:", cardCount);

    if (cardCount > 0) {
      await page.evaluate(() => {
        document.querySelector('.work-card').click();
      });
      await new Promise(r => setTimeout(r, 1000));
      
      const modalHtml = await page.evaluate(() => {
        const modal = document.getElementById('vault-modal-overlay');
        return modal ? modal.outerHTML.substring(0, 500) : 'NULL';
      });
      console.log("Modal HTML:", modalHtml);

      // Check selectors
      console.log("Wrong selector exists:", await page.evaluate(() => !!document.querySelector('.modal-close-btn')));
      console.log("Right selector exists:", await page.evaluate(() => !!document.getElementById('vault-modal-close')));

      // Click the button
      await page.evaluate(() => {
        const btn = document.getElementById('vault-modal-close');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 1000));
      
      console.log("Modal open state after click:", await page.evaluate(() => !!document.getElementById('vault-modal-overlay')));
    }
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
})();
