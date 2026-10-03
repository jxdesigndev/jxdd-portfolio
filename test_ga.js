const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  
  console.log('--- TEST A: CONSENT DECLINED ---');
  const pageDenied = await browser.newPage();
  let gaRequestsDenied = [];
  
  await pageDenied.setRequestInterception(true);
  pageDenied.on('request', request => {
    const url = request.url();
    if (url.includes('google-analytics.com') || url.includes('googletagmanager.com')) {
      gaRequestsDenied.push(url);
    }
    request.continue();
  });

  await pageDenied.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
  await pageDenied.evaluate(() => localStorage.setItem('jx_cookie_consent', 'denied'));
  await pageDenied.reload({ waitUntil: 'networkidle0' });
  
  console.log(`Requests to GA/GTM: ${gaRequestsDenied.length}`);
  if (gaRequestsDenied.length > 0) {
    gaRequestsDenied.forEach(req => console.log(` - ${req}`));
  }
  await pageDenied.close();

  console.log('\n--- TEST B: CONSENT ACCEPTED ---');
  const pageAccepted = await browser.newPage();
  let gaRequestsAccepted = [];
  
  await pageAccepted.setRequestInterception(true);
  pageAccepted.on('request', request => {
    const url = request.url();
    if (url.includes('google-analytics.com') || url.includes('googletagmanager.com')) {
      gaRequestsAccepted.push(url);
    }
    request.continue();
  });

  await pageAccepted.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
  await pageAccepted.evaluate(() => localStorage.setItem('jx_cookie_consent', 'granted'));
  await pageAccepted.reload({ waitUntil: 'networkidle0' });
  
  // Wait a moment for GA to fire pageview
  await new Promise(r => setTimeout(r, 2000));
  
  console.log(`Requests to GA/GTM: ${gaRequestsAccepted.length}`);
  if (gaRequestsAccepted.length > 0) {
    gaRequestsAccepted.forEach(req => console.log(` - ${req.substring(0, 80)}...`));
  }

  await browser.close();
  process.exit(0);
})();
