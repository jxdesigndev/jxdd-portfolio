const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1024'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });

  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  page.on('pageerror', error => {
    logs.push(`[PAGE ERROR] ${error.message}`);
  });
  page.on('requestfailed', request => {
    logs.push(`[REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    console.log("Navigating to http://localhost:8080/work.html...");
    await page.goto('http://localhost:8080/work.html', { waitUntil: 'networkidle0' });

    // Step 1: Global Physics & Scroll Test
    console.log("\\n--- 1. Global Physics & Scroll Test ---");
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => window.scrollBy(0, -1000));
    await new Promise(r => setTimeout(r, 500));
    
    const lenisActive = await page.evaluate(() => {
      return window.JXLenis && !window.JXLenis.isStopped;
    });
    console.log(`Lenis active after global scroll: ${lenisActive}`);

    // Step 2: Filter Button Logic
    console.log("\\n--- 2. Filter Button Logic ---");
    const filterBtns = await page.$$('.filter-btn');
    if (filterBtns.length > 1) {
      await filterBtns[1].click();
      await new Promise(r => setTimeout(r, 1000));
      console.log("Clicked second filter button.");
    } else {
      console.log("No filter buttons found or less than 2 available.");
    }

    // Step 3: Modal Stress Test
    console.log("\\n--- 3. Modal Stress Test ---");
    // Click "All" again if it exists to reset
    if (filterBtns.length > 0) {
      await filterBtns[0].click();
      await new Promise(r => setTimeout(r, 500));
    }

    const cards = await page.$$('.work-card');
    if (cards.length > 0) {
      console.log("Clicking first work card...");
      await cards[0].click();
      await new Promise(r => setTimeout(r, 2000));

      const lenisStopped = await page.evaluate(() => {
        return window.JXLenis && window.JXLenis.isStopped;
      });
      console.log(`Lenis stopped while modal open: ${lenisStopped}`);

      console.log("Scrolling modal down 300px...");
      await page.evaluate(() => {
        const modal = document.querySelector('.vault-modal');
        if (modal) modal.scrollBy(0, 300);
      });
      await new Promise(r => setTimeout(r, 500));

      console.log("Closing modal...");
      await page.evaluate(() => document.getElementById('vault-modal-close').click());
      await new Promise(r => setTimeout(r, 1000));

      const lenisRestarted = await page.evaluate(() => {
        return window.JXLenis && !window.JXLenis.isStopped;
      });
      console.log(`Lenis restarted after modal close: ${lenisRestarted}`);
    } else {
      console.log("No .work-card found.");
    }

    // Step 4: Multiple Instance Test
    console.log("\\n--- 4. Multiple Instance Test ---");
    if (cards.length > 1) {
      console.log("Clicking second work card...");
      await cards[1].click();
      await new Promise(r => setTimeout(r, 2000));

      const modalScrollTop = await page.evaluate(() => {
        const modal = document.querySelector('.vault-modal');
        return modal ? modal.scrollTop : -1;
      });
      console.log(`Second modal initial scrollTop: ${modalScrollTop}`);

      console.log("Closing second modal...");
      await page.evaluate(() => document.getElementById('vault-modal-close').click());
      await new Promise(r => setTimeout(r, 1000));
    } else {
      console.log("Not enough .work-card elements found for second instance test.");
    }

    // Step 5: Hover & Cursor Magnet Test
    console.log("\\n--- 5. Hover & Cursor Magnet Test ---");
    const magneticElement = await page.$('.magnetic, .btn, a');
    if (magneticElement) {
      console.log("Simulating hover on magnetic/interactive element...");
      await magneticElement.hover();
      await new Promise(r => setTimeout(r, 500));
      // move mouse away
      await page.mouse.move(0, 0);
      await new Promise(r => setTimeout(r, 500));
      console.log("Hover test completed.");
    } else {
      console.log("No magnetic elements found.");
    }

    // Final Screenshot
    console.log("\\nTaking final screenshot...");
    await page.screenshot({ path: 'qa_final_state.jpg', quality: 90, type: 'jpeg' });
    console.log("Saved qa_final_state.jpg.");

  } catch (err) {
    console.error("Test script encountered an error:", err);
  } finally {
    console.log("\\n=== BROWSER CONSOLE & ERROR LOGS ===");
    if (logs.length === 0) {
      console.log("No console errors, warnings, or logs captured.");
    } else {
      logs.forEach(l => console.log(l));
    }
    
    await browser.close();
  }
})();
