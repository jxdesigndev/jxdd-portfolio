const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Intercept requests to delay the JS
  await page.setRequestInterception(true);
  page.on('request', async req => {
    if (req.url().includes('admin-') && req.url().endsWith('.js')) {
      // Delay JS by 3 seconds
      setTimeout(() => req.continue(), 3000);
    } else {
      req.continue();
    }
  });

  const logs = [];
  page.on('console', msg => {
    logs.push(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  console.log("Navigating to local preview admin page...");
  // Do not wait for networkidle0, just domcontentloaded
  await page.goto('http://localhost:4173/admin.html', { waitUntil: 'domcontentloaded' });

  console.log("Filling in dummy credentials and trying to submit IMMEDIATELY...");
  
  await page.waitForSelector('#login-email', { timeout: 1000 });
  await page.type('#login-email', 'dummy@example.com');
  await page.type('#login-password', 'wrongpassword');

  // Try to submit via Enter key
  await page.keyboard.press('Enter');
  
  // Also try clicking the button
  await page.evaluate(() => {
    const btn = document.querySelector('#login-form button');
    if (btn && !btn.disabled) {
      btn.click();
    } else {
      console.log('Button is correctly disabled before JS loads!');
    }
    
    // Also try to forcefully call submit() just to see if the HTML onsubmit catches it
    // Wait, form.submit() bypasses onsubmit in some browsers, but let's test if the form natively submits
  });

  // Wait 2 seconds (JS is still delayed for 1 more second)
  await new Promise(r => setTimeout(r, 2000));
  console.log("URL after immediate submit attempt: " + page.url());

  // Wait until JS actually loads
  console.log("Waiting for JS to finish loading...");
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Trying to submit now that JS is loaded...");
  // The button should be enabled now.
  await page.evaluate(() => {
    const btn = document.querySelector('#login-form button');
    if (btn && !btn.disabled) {
      btn.click();
    } else {
      console.log('Button is still disabled after JS loads?');
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));

  console.log("\n=== DIAGNOSTIC RESULTS ===");
  logs.forEach(l => console.log(l));
  console.log("Final URL: " + page.url());

  await browser.close();
})();
