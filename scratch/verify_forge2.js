const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
       console.log('PAGE ERROR LOG:', msg.text());
    }
  });

  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('supabase.co/rest/v1/services')) {
      if (request.method() === 'OPTIONS') {
        request.respond({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info'
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
  try {
    await page.waitForSelector('#home-services-grid .service-card', { timeout: 10000 });
  } catch (err) {
    console.log("Timeout waiting for cards");
  }
  
  const initialStyles = await page.$$eval('#home-services-grid .service-card', els => 
    els.map(el => ({
      opacity: window.getComputedStyle(el).opacity,
      transform: window.getComputedStyle(el).transform
    }))
  );
  console.log("BEFORE SCROLL:");
  console.log(initialStyles);

  // Scroll the grid into view to trigger ScrollTrigger
  await page.evaluate(() => {
    document.getElementById('home-services-grid').scrollIntoView({ behavior: 'instant', block: 'center' });
  });

  // Wait for GSAP animation to complete (duration 0.7s, stagger 0.1s => max 1.1s + buffer)
  await new Promise(r => setTimeout(r, 1500));

  const afterStyles = await page.$$eval('#home-services-grid .service-card', els => 
    els.map(el => ({
      opacity: window.getComputedStyle(el).opacity,
      transform: window.getComputedStyle(el).transform
    }))
  );
  console.log("AFTER SCROLL:");
  console.log(afterStyles);

  const homeBadges = await page.$$eval('#home-services-grid .service-card span', els => els.map(e => e.textContent));
  console.log("Home badges found:", homeBadges);

  console.log("--- TESTING SERVICES.HTML ---");
  await page.goto('http://localhost:4173/services.html', { waitUntil: 'networkidle2' });
  
  await page.waitForSelector('.service-card', { timeout: 10000 });
  
  const servicesBadges = await page.$$eval('.service-card span', els => els.map(e => e.textContent));
  console.log("Services.html badges found:", servicesBadges);
  
  await browser.close();
})();
