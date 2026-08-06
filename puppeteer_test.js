const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1024'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });

  console.log("Navigating to local dev server...");
  await page.goto('http://localhost:8080/work.html', { waitUntil: 'networkidle0' });

  console.log("Waiting for Zenflow card...");
  await page.waitForSelector('.work-card-title');

  // Find the Zenflow card and click it
  const cards = await page.$$('.work-card');
  let zenflowCard = null;
  for (const card of cards) {
    const title = await card.$eval('.work-card-title', el => el.textContent);
    if (title.includes('Zenflow')) {
      zenflowCard = card;
      break;
    }
  }

  if (!zenflowCard) {
    console.error("Zenflow card not found!");
    await browser.close();
    return;
  }

  console.log("Clicking Zenflow card...");
  await zenflowCard.click();

  // Wait for the modal animation (1-2 seconds)
  console.log("Waiting for modal animation...");
  await new Promise(r => setTimeout(r, 2000));

  // Take screenshot
  const screenshotPath = './live_modal_test_zenflow.jpg';
  console.log(`Taking screenshot: ${screenshotPath}`);
  await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 90 });

  console.log("Verifying scrollability inside .vault-modal...");
  
  // Check if .vault-modal exists
  const modalExists = await page.$('.vault-modal') !== null;
  if (!modalExists) {
    console.error(".vault-modal not found!");
  } else {
    // Get initial scroll position
    const initialScroll = await page.$eval('.vault-modal', el => el.scrollTop);
    console.log(`Initial scrollTop: ${initialScroll}`);

    // Scroll down 500px
    console.log("Scrolling down 500px...");
    await page.$eval('.vault-modal', el => {
      el.scrollBy(0, 500);
    });

    // Wait a brief moment for scroll event/layout update
    await new Promise(r => setTimeout(r, 200));

    // Get final scroll position
    const finalScroll = await page.$eval('.vault-modal', el => el.scrollTop);
    console.log(`Final scrollTop: ${finalScroll}`);

    if (finalScroll > initialScroll) {
      console.log(`✅ SCROLL VERIFIED: .vault-modal successfully scrolled by ${finalScroll - initialScroll}px.`);
    } else {
      console.log(`❌ SCROLL FAILED: .vault-modal did not scroll (scrollTop remained ${finalScroll}).`);
      
      // Additional debugging
      const overflow = await page.$eval('.vault-modal', el => window.getComputedStyle(el).overflowY);
      const scrollHeight = await page.$eval('.vault-modal', el => el.scrollHeight);
      const clientHeight = await page.$eval('.vault-modal', el => el.clientHeight);
      console.log(`Debug Info -> overflow-y: ${overflow}, scrollHeight: ${scrollHeight}, clientHeight: ${clientHeight}`);
    }
  }

  await browser.close();
  console.log("Test completed.");
})();
