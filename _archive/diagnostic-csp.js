const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const logs = [];
  const networkRequests = [];

  page.on('console', msg => {
    logs.push(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    logs.push(`[PAGE ERROR]: ${err.message}`);
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('esm.sh') || url.includes('supabase.co')) {
      networkRequests.push({
        url,
        status: response.status()
      });
    }
  });

  console.log("Navigating to local preview admin page...");
  await page.goto('http://localhost:4173/admin.html', { waitUntil: 'networkidle0' });

  console.log("Filling in dummy credentials...");
  await page.waitForSelector('#login-email', { timeout: 5000 });
  await page.type('#login-email', 'dummy@example.com');
  await page.type('#login-password', 'wrongpassword');

  console.log("Submitting login form...");
  await page.click('#login-form button');

  // Wait to allow network requests
  await new Promise(r => setTimeout(r, 4000));

  console.log("\n=== DIAGNOSTIC RESULTS ===");
  console.log("\nConsole Logs:");
  logs.forEach(l => console.log(l));

  console.log("\nRelevant Network Requests:");
  networkRequests.forEach(req => {
    console.log(`Status: ${req.status} URL: ${req.url}`);
  });

  await browser.close();
})();
