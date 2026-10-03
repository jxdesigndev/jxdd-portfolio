const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  
  const page = await browser.newPage();
  
  // Intercept Sentry requests to verify it tries to send events
  let sentryRequestMade = false;
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('sentry.io')) {
      console.log('Intercepted Sentry request:', request.url());
      sentryRequestMade = true;
    }
    request.continue();
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:4173/about.html', { waitUntil: 'networkidle0' });
  
  // Check Sentry init
  const hasSentry = await page.evaluate(() => typeof window.Sentry !== 'undefined');
  console.log('Sentry is initialized:', hasSentry);
  
  // Trigger an error manually
  await page.evaluate(() => {
    window.Sentry.captureException(new Error("Test error from setup"));
  });
  
  // Wait a little for Sentry to dispatch
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Sentry request was sent:', sentryRequestMade);

  // Check Cookie Banner
  const cookieBannerExists = await page.evaluate(() => !!document.querySelector('.cookie-banner'));
  console.log('Cookie banner exists:', cookieBannerExists);

  // Click accept
  if (cookieBannerExists) {
    await page.evaluate(() => document.querySelector('#btn-accept').click());
    console.log('Clicked accept.');
    await new Promise(r => setTimeout(r, 500));
    
    // Banner should be hidden
    const isHidden = await page.evaluate(() => document.querySelector('.cookie-banner').style.display === 'none');
    console.log('Cookie banner is hidden after accept:', isHidden);
  }

  // Check Privacy Page
  await page.goto('http://localhost:4173/privacy.html', { waitUntil: 'networkidle0' });
  const privacyTitle = await page.evaluate(() => document.querySelector('h1').textContent);
  console.log('Privacy page loaded. H1:', privacyTitle);

  await browser.close();
  process.exit(0);
})();
