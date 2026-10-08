const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
       console.log('PAGE ERROR LOG:', msg.text());
    } else {
       console.log('PAGE LOG:', msg.text());
    }
  });

  const injectMock = async () => {
    await page.evaluateOnNewDocument(() => {
      // We will override window.initSupabase and window.supabase
      const mockClient = {
        from: (table) => {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: async () => ({
                    data: [
                      { name: 'Product Design (UI/UX)', is_active: true, priority: 1, tool_category: 'design', is_coming_soon: false },
                      { name: 'AI-Assisted Web Development', is_active: true, priority: 2, tool_category: 'dev', is_coming_soon: false },
                      { name: 'n8n Automation', is_active: true, priority: 3, tool_category: 'automation', is_coming_soon: false },
                      { name: 'Security', is_active: true, priority: 4, tool_category: 'security', is_coming_soon: true }
                    ],
                    error: null
                  }),
                  then: function(resolve) { // for await without limit
                    resolve({
                      data: [
                        { name: 'Product Design (UI/UX)', is_active: true, priority: 1, tool_category: 'design', is_coming_soon: false },
                        { name: 'AI-Assisted Web Development', is_active: true, priority: 2, tool_category: 'dev', is_coming_soon: false },
                        { name: 'n8n Automation', is_active: true, priority: 3, tool_category: 'automation', is_coming_soon: false },
                        { name: 'Security', is_active: true, priority: 4, tool_category: 'security', is_coming_soon: true }
                      ],
                      error: null
                    });
                  }
                })
              })
            })
          };
        }
      };
      
      window.initSupabase = async () => mockClient;
      
      // Some scripts wait for window.supabase
      Object.defineProperty(window, 'supabase', {
        get: () => mockClient,
        set: () => {}
      });
    });
  };

  await injectMock();

  console.log("--- TESTING HOMEPAGE ---");
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => sessionStorage.setItem('jx_visited', '1'));
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Wait for the cards to load
  await page.waitForSelector('#home-services-grid .service-card', { timeout: 10000 });
  
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

  // Wait for GSAP animation to complete
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
  console.log("Home badges found:", homeBadges.filter(t => t === 'COMING SOON'));

  console.log("--- TESTING SERVICES.HTML ---");
  await page.goto('http://localhost:4173/services.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => sessionStorage.setItem('jx_visited', '1'));
  
  // Wait for the cards to load
  await page.waitForSelector('.service-card', { timeout: 10000 }).catch(() => {});
  // Wait for deep cards too
  await page.waitForSelector('.service-deep', { timeout: 10000 }).catch(() => {});
  
  const servicesBadges = await page.$$eval('.service-deep span', els => els.map(e => e.textContent));
  console.log("Services.html badges found:", servicesBadges.filter(t => t === 'COMING SOON'));
  
  await browser.close();
})();
