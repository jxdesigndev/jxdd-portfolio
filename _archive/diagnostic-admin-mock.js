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

  await page.setRequestInterception(true);
  
  page.on('request', request => {
    const url = request.url();
    const method = request.method();

    if (url.includes('supabase.co/auth/v1/token')) {
      if (method === 'OPTIONS') {
        request.respond({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': '*'
          }
        });
      } else {
        request.respond({
          status: 200,
          contentType: 'application/json',
          headers: {
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            access_token: "dummy-access-token",
            token_type: "bearer",
            expires_in: 3600,
            refresh_token: "dummy-refresh-token",
            user: {
              id: "12345678-1234-1234-1234-123456789012",
              aud: "authenticated",
              role: "authenticated",
              email: "ferdinandokezie.o@gmail.com",
              app_metadata: { provider: "email" }
            },
            session: {
              access_token: "dummy-access-token",
              token_type: "bearer",
              expires_in: 3600,
              refresh_token: "dummy-refresh-token",
              user: { id: "12345678-1234-1234-1234-123456789012" }
            }
          })
        });
      }
    } else {
      request.continue();
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('supabase.co/rest/v1/')) {
      networkRequests.push({
        url,
        status: response.status(),
        statusText: response.statusText(),
        method: response.request().method()
      });
    }
  });

  console.log("Navigating to local preview admin page...");
  await page.goto('http://localhost:4173/admin.html', { waitUntil: 'networkidle0' });

  console.log("Filling in credentials...");
  await page.waitForSelector('#login-email', { timeout: 5000 });
  await page.type('#login-email', 'ferdinandokezie.o@gmail.com');
  await page.type('#login-password', 'some-password');

  console.log("Submitting login form...");
  await page.click('#login-form button');

  // Wait for data fetches
  await new Promise(r => setTimeout(r, 4000));

  console.log("Checking UI state...");
  let dashboardDisplay = 'none';
  let loginDisplay = 'none';
  let loginErr = '';
  try {
    dashboardDisplay = await page.$eval('#admin-dashboard', el => window.getComputedStyle(el).display);
    loginDisplay = await page.$eval('#admin-login', el => window.getComputedStyle(el).display);
    loginErr = await page.$eval('#login-error', el => el.textContent);
  } catch (e) {}

  console.log("\n=== DIAGNOSTIC RESULTS ===");
  console.log("\nConsole Logs:");
  logs.forEach(l => console.log(l));

  console.log("\nData Fetches (Supabase REST API):");
  networkRequests.forEach(req => {
    console.log(`[${req.method}] ${req.status} ${req.url.split('?')[0].split('/').pop()}`);
  });

  console.log("\nUI State After Submission:");
  console.log(`Login Form Display: ${loginDisplay}`);
  console.log(`Admin Dashboard Display: ${dashboardDisplay}`);
  console.log(`Login Error Text: ${loginErr}`);

  await browser.close();
})();
