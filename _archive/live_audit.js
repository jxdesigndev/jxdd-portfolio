const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  const pagesToTest = [
    'https://jxdesign.dev/',
    'https://jxdesign.dev/about.html',
    'https://jxdesign.dev/work.html',
    'https://jxdesign.dev/contact.html',
    'https://jxdesign.dev/services.html'
  ];

  for (const url of pagesToTest) {
    console.log(`\n========================================`);
    console.log(`Testing: ${url}`);
    
    const page = await browser.newPage();
    const errors = [];
    const consoleLogs = [];
    const failedRequests = [];
    
    // Capture page errors
    page.on('pageerror', err => {
      errors.push(err.message);
    });
    
    // Capture console logs (warnings and errors)
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleLogs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });
    
    // Capture failed network requests
    page.on('requestfailed', request => {
      failedRequests.push(`${request.url()} (${request.failure().errorText})`);
    });
    
    // Capture network responses to find 404s
    page.on('response', response => {
      if (response.status() >= 400 && response.status() !== 401) { // 401 might be expected for some APIs
        failedRequests.push(`${response.status()} - ${response.url()}`);
      }
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Get page title
      const title = await page.title();
      console.log(`Page Title: ${title}`);
      
      // Feature Test: CLI (Only on Index)
      if (url === 'https://jxdesign.dev/') {
        console.log('\n--- Testing Hidden CLI & Game Feature ---');
        
        // Check if CLI trigger exists
        const cliExists = await page.evaluate(() => !!document.getElementById('cli-trigger'));
        console.log(`CLI Trigger button exists in DOM: ${cliExists}`);
        
        // Try pressing Ctrl+K
        await page.keyboard.down('Control');
        await page.keyboard.press('k');
        await page.keyboard.up('Control');
        
        // Wait a moment for animation
        await page.waitForTimeout(500);
        
        // Check if CLI panel is visible
        const cliVisible = await page.evaluate(() => {
          const panel = document.getElementById('cli-panel');
          return panel ? window.getComputedStyle(panel).opacity > 0 : false;
        });
        console.log(`CLI Panel opens via Ctrl+K: ${cliVisible}`);
        
        // Check if Pong triggers
        if (cliVisible) {
          await page.type('#cli-input', 'pong');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(2000); // Wait for transition
          
          const pongActive = await page.evaluate(() => document.body.classList.contains('pong-active'));
          console.log(`Pong game activates via command: ${pongActive}`);
        }
      }

      console.log(`\n--- Live Errors & Warnings ---`);
      console.log(`JS Exceptions: ${errors.length === 0 ? 'None' : ''}`);
      errors.forEach(e => console.log(`  - ${e}`));
      
      console.log(`Console Warnings/Errors: ${consoleLogs.length === 0 ? 'None' : ''}`);
      // Filter out some noise if necessary, but keep it raw for now
      [...new Set(consoleLogs)].forEach(l => console.log(`  - ${l}`));
      
      console.log(`Failed/404 Network Requests: ${failedRequests.length === 0 ? 'None' : ''}`);
      [...new Set(failedRequests)].forEach(r => console.log(`  - ${r}`));

    } catch (err) {
      console.log(`Failed to load or test page: ${err.message}`);
    }
    await page.close();
  }
  
  await browser.close();
  console.log('\nAudit complete.');
})();
