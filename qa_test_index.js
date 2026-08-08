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
    console.log("Navigating to http://localhost:8080/...");
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });

    // Wait for preloader
    console.log("Waiting for preloader to finish...");
    await new Promise(r => setTimeout(r, 4000));

    // Step 1: Global Scroll & Physics
    console.log("\\n--- 1. Global Scroll & Physics ---");
    await page.evaluate(() => window.scrollBy(0, 2000));
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => window.scrollBy(0, -2000));
    await new Promise(r => setTimeout(r, 500));
    
    const lenisActive = await page.evaluate(() => {
      return window.JXLenis && !window.JXLenis.isStopped;
    });
    console.log(`Lenis active after global scroll: ${lenisActive}`);

    // Step 2: CLI Terminal Stress Test
    console.log("\\n--- 2. CLI Terminal Stress Test ---");
    console.log("Clicking CLI trigger...");
    await page.click('#cli-trigger');
    await new Promise(r => setTimeout(r, 1000));

    let lenisStopped = await page.evaluate(() => {
      return window.JXLenis && window.JXLenis.isStopped;
    });
    console.log(`Lenis stopped while CLI open: ${lenisStopped}`);

    console.log("Typing 'help' in CLI...");
    await page.type('#cli-input', 'help');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 1000));

    const cliHasDataLenisPrevent = await page.evaluate(() => {
      const output = document.getElementById('cli-output');
      return output && output.hasAttribute('data-lenis-prevent');
    });
    console.log(`CLI output has data-lenis-prevent: ${cliHasDataLenisPrevent}`);

    console.log("Scrolling CLI output...");
    await page.evaluate(() => {
      const output = document.getElementById('cli-output');
      if (output) output.scrollBy(0, 100);
    });
    await new Promise(r => setTimeout(r, 500));

    console.log("Closing CLI terminal...");
    await page.evaluate(() => {
      const closeBtn = document.getElementById('cli-close');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    let lenisRestarted = await page.evaluate(() => {
      return window.JXLenis && !window.JXLenis.isStopped;
    });
    console.log(`Lenis restarted after CLI close: ${lenisRestarted}`);

    // Step 3: Pong Game Interaction
    console.log("\\n--- 3. Pong Game Interaction ---");
    console.log("Opening CLI again to trigger Pong...");
    await page.evaluate(() => {
      const trigger = document.getElementById('cli-trigger');
      if (trigger) trigger.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log("Typing 'pong' in CLI...");
    await page.type('#cli-input', 'pong');
    await page.keyboard.press('Enter');
    
    console.log("Waiting for Pong to initialize...");
    await new Promise(r => setTimeout(r, 3000)); // wait for initPong timeout (1600) + animation

    console.log("Simulating Pong paddle movement (ArrowUp / ArrowDown)...");
    await page.keyboard.down('ArrowUp');
    await new Promise(r => setTimeout(r, 1500));
    await page.keyboard.up('ArrowUp');
    
    await page.keyboard.down('ArrowDown');
    await new Promise(r => setTimeout(r, 1500));
    await page.keyboard.up('ArrowDown');

    console.log("Closing Pong...");
    await page.evaluate(() => {
      const btn = document.getElementById('pong-close-btn');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    console.log("Pong closed.");

    // Step 4: Audio Toast & UI Validation
    console.log("\\n--- 4. Audio Toast & UI Validation ---");
    console.log("Clicking audio toggle button...");
    await page.evaluate(() => {
      const audioBtn = document.getElementById('nav-audio-toggle');
      if (audioBtn) audioBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const audioToastCheck = await page.evaluate(() => {
      const toast = document.getElementById('jx-audio-toast');
      if (!toast) return 'Not found';
      return `aria-live="${toast.getAttribute('aria-live')}" role="${toast.getAttribute('role')}"`;
    });
    console.log(`Audio Toast Attributes: ${audioToastCheck}`);

    console.log("Hovering magnetic elements...");
    const magneticSelector = '.magnetic, .btn, a, .nav-link, button';
    const elems = await page.$$(magneticSelector);
    let hoverCount = 0;
    for (let i = 0; i < Math.min(elems.length, 3); i++) {
      await elems[i].hover();
      await new Promise(r => setTimeout(r, 300));
      hoverCount++;
    }
    await page.mouse.move(0, 0); // reset mouse
    await new Promise(r => setTimeout(r, 500));
    console.log(`Hovered ${hoverCount} elements.`);

    // Final Screenshot
    console.log("\\nTaking final screenshot...");
    await page.screenshot({ path: 'qa_final_state_index.jpg', quality: 90, type: 'jpeg' });
    console.log("Saved qa_final_state_index.jpg.");

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
