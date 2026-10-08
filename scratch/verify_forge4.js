const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);

  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('supabase.co/rest/v1/services')) {
      if (request.method() === 'OPTIONS') {
        request.respond({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info, accept-profile, x-retry-count, prefer'
          }
        });
        return;
      }
      
      request.respond({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify([
          { name: 'Product Design (UI/UX)', is_active: true, priority: 1, tool_category: 'design', is_coming_soon: false },
          { name: 'AI-Assisted Web Development', is_active: true, priority: 2, tool_category: 'dev', is_coming_soon: false },
          { name: 'n8n Automation', is_active: true, priority: 3, tool_category: 'automation', is_coming_soon: false },
          { name: 'Security', is_active: true, priority: 4, tool_category: 'security', is_coming_soon: true }
        ])
      });
    } else {
      request.continue();
    }
  });

  console.log("--- TESTING HOMEPAGE ---");
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => sessionStorage.setItem('jx_visited', '1'));
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Wait for the cards to load
  await page.waitForSelector('#home-services-grid .service-card', { timeout: 10000 });
  
  console.log("--- TESTING SERVICES.HTML ---");
  await page.goto('http://localhost:4173/services.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => sessionStorage.setItem('jx_visited', '1'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  
  await page.waitForSelector('.service-card', { timeout: 10000 });
  
  const servicesBadges = await page.$$eval('.service-card span', els => els.map(e => e.textContent));
  console.log("Services.html badges found:", servicesBadges.filter(t => t === 'COMING SOON'));
  
  await browser.close();
})();
