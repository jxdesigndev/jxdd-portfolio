const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.goto('https://www.jxdesign.dev/work.html', { waitUntil: 'networkidle2' });
    
    // Find Zenflow card specifically, or just the first card
    const cardCount = await page.evaluate(() => document.querySelectorAll('.work-card').length);
    if (cardCount === 0) {
      console.log("No cards found to test.");
      return;
    }

    // Click first card
    await page.evaluate(() => {
      document.querySelector('.work-card').click();
    });
    
    // Wait for the modal animation
    await new Promise(r => setTimeout(r, 1000));
    
    // Verify modal is open
    const modalExists = await page.evaluate(() => !!document.getElementById('vault-modal-overlay'));
    if (!modalExists) {
       console.log("Modal failed to open!");
       return;
    }
    
    console.log("Checking test script selectors (.modal-img, .modal-link):");
    const wrongImage = await page.evaluate(() => !!document.querySelector('.modal-img'));
    const wrongLink = await page.evaluate(() => !!document.querySelector('.modal-link'));
    console.log(`- .modal-img exists: ${wrongImage}`);
    console.log(`- .modal-link exists: ${wrongLink}`);

    console.log("\nChecking real selectors (.vault-modal-image img, .vault-modal-content a):");
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
    
  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await browser.close();
  }
})();
