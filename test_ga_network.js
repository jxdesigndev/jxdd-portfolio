const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  let gaRequests = [];
  let allRequests = [];

  // Enable request interception to monitor network
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    allRequests.push(url);
    if (url.includes('google-analytics.com') || url.includes('googletagmanager.com')) {
      gaRequests.push(url);
    }
    request.continue();
  });

  // Go to page first to establish origin for localStorage
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
  
  // Explicitly decline consent
  await page.evaluate(() => {
    localStorage.setItem('jx_cookie_consent', 'denied');
  });

  // Reload the page with consent declined and networkidle0 to ensure all scripts execute
  await page.reload({ waitUntil: 'networkidle0' });
  
  console.log(`\n--- NETWORK TEST RESULTS ---`);
  console.log(`Total network requests made on page load: ${allRequests.length}`);
  console.log(`Requests to google-analytics.com or googletagmanager.com: ${gaRequests.length}`);
  
  if (gaRequests.length > 0) {
    console.log(`GA Requests seen:`);
    gaRequests.forEach(req => console.log(` - ${req}`));
  } else {
    console.log(`No GA requests fired.`);
  }

  await browser.close();
  process.exit(0);
})();
