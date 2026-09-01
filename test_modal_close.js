const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.goto('https://www.jxdesign.dev/work.html', { waitUntil: 'networkidle2' });
    
    // Click the first project card
    console.log("Opening modal...");
    await page.evaluate(() => {
      document.querySelector('.work-card')?.click();
    });
    
    // Wait for the modal animation
    await new Promise(r => setTimeout(r, 1000));
    
    // Verify modal is open
    const modalExists = await page.evaluate(() => !!document.getElementById('vault-modal-overlay'));
    console.log(`Modal open state: ${modalExists}`);
    
    // Check for the incorrect selector used in the audit script
    const wrongSelectorExists = await page.evaluate(() => !!document.querySelector('.modal-close-btn'));
    console.log(`Wrong selector (.modal-close-btn) exists: ${wrongSelectorExists}`);
    
    // Check for the actual selector
    const rightSelectorExists = await page.evaluate(() => !!document.getElementById('vault-modal-close'));
    console.log(`Right selector (#vault-modal-close) exists: ${rightSelectorExists}`);
    
    // Click the real button
    console.log("Clicking real close button...");
    await page.evaluate(() => {
      document.getElementById('vault-modal-close')?.click();
    });
    
    // Wait for close animation
    await new Promise(r => setTimeout(r, 1000));
    
    // Verify modal is closed
    const modalExistsAfterClose = await page.evaluate(() => !!document.getElementById('vault-modal-overlay'));
    console.log(`Modal open state after click: ${modalExistsAfterClose}`);
    
  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await browser.close();
  }
})();
