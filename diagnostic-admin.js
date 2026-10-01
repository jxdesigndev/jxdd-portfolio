const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const logs = [];
  const networkRequests = [];

  // Capture console logs (especially CSP/CORS)
  page.on('console', msg => {
    logs.push(`[CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    logs.push(`[PAGE ERROR]: ${err.message}`);
  });

  // Capture network responses
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('supabase.co/auth/v1/token')) {
      let body = '';
      try {
        body = await response.text();
      } catch (e) {
        body = 'Could not read body';
      }
      networkRequests.push({
        url,
        status: response.status(),
        statusText: response.statusText(),
        body
      });
    }
  });

  console.log("Navigating to local preview admin page...");
  await page.goto('http://localhost:4173/admin.html', { waitUntil: 'networkidle0' });

  console.log("Filling in dummy credentials...");
  await page.waitForSelector('#login-email', { timeout: 5000 });
  await page.type('#login-email', 'admin@jxdesign.dev');
  await page.type('#login-password', 'testpassword123');

  console.log("Submitting login form...");
  await page.click('#login-form button');

  // Wait to allow network requests and UI updates to finish
  await new Promise(r => setTimeout(r, 4000));

  console.log("Checking UI state...");
  const buttonText = await page.$eval('#login-form button', el => el.textContent);
  const isButtonDisabled = await page.$eval('#login-form button', el => el.disabled);
  
  let errorDisplay = 'none';
  let errorText = '';
  try {
    errorDisplay = await page.$eval('#login-error', el => window.getComputedStyle(el).display);
    errorText = await page.$eval('#login-error', el => el.textContent);
  } catch (e) {}

  console.log("\n=== DIAGNOSTIC RESULTS ===");
  console.log("Console Logs:");
  logs.forEach(l => console.log(l));

  console.log("\nNetwork Requests (Supabase Auth):");
  networkRequests.forEach(req => {
    console.log(`Status: ${req.status} ${req.statusText}`);
    console.log(`Body: ${req.body}`);
  });

  console.log("\nUI State After Submission:");
  console.log(`Button Text: ${buttonText}`);
  console.log(`Button Disabled: ${isButtonDisabled}`);
  console.log(`Error Toast Display: ${errorDisplay}`);
  if (errorDisplay !== 'none') {
    console.log(`Error Toast Text: ${errorText}`);
  }

  await browser.close();
})();
