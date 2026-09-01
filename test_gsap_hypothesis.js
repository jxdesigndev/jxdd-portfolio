const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.goto('https://www.jxdesign.dev/work.html', { waitUntil: 'networkidle2' });
    
    // Test 1: ScrollTrigger instance count
    const stCountBefore = await page.evaluate(() => window.ScrollTrigger ? ScrollTrigger.getAll().length : -1);
    
    // Click "Product Design" filter
    await page.evaluate(() => {
      document.querySelector('.filter-btn[data-filter="design"]').click();
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    const stCountAfter1 = await page.evaluate(() => window.ScrollTrigger ? ScrollTrigger.getAll().length : -1);
    
    // Click "All" filter to see if it grows again
    await page.evaluate(() => {
      document.querySelector('.filter-btn[data-filter="all"]').click();
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    const stCountAfter2 = await page.evaluate(() => window.ScrollTrigger ? ScrollTrigger.getAll().length : -1);
    
    console.log(`[TEST 1] ScrollTrigger count: before=${stCountBefore}, after first click=${stCountAfter1}, after second click=${stCountAfter2}`);

    // Test 2: Computed opacity
    const opacities = await page.evaluate(() => {
      const cards = document.querySelectorAll('.work-card');
      return Array.from(cards).map(c => ({
        inline: c.style.opacity,
        computed: window.getComputedStyle(c).opacity
      }));
    });
    
    console.log(`[TEST 2] Opacities after clicks:`, opacities);

    // Test 4: Detached nodes vs active nodes
    const nodeCounts = await page.evaluate(() => {
      // document.querySelectorAll gets nodes in the document
      const activeCards = document.querySelectorAll('.work-card').length;
      // We can also check if GSAP has tweens targeting detached nodes
      // But let's just see if querySelectorAll matches the expected number of cards
      return {
        activeCardsInDOM: activeCards,
        expectedCardsForFilter: window.allProjects ? window.allProjects.length : -1
      };
    });
    
    console.log(`[TEST 4] Node counts: active in DOM = ${nodeCounts.activeCardsInDOM}, expected = ${nodeCounts.expectedCardsForFilter}`);

    // Test 3: ScrollTrigger.refresh() manually
    // We already clicked "All" and they are currently opacity 0 (presumably).
    // Let's run ScrollTrigger.refresh()
    await page.evaluate(() => {
      if (window.ScrollTrigger) {
        ScrollTrigger.refresh();
      }
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    const opacitiesAfterRefresh = await page.evaluate(() => {
      const cards = document.querySelectorAll('.work-card');
      return Array.from(cards).map(c => ({
        inline: c.style.opacity,
        computed: window.getComputedStyle(c).opacity
      }));
    });
    
    console.log(`[TEST 3] Opacities after ScrollTrigger.refresh():`, opacitiesAfterRefresh);
    
    // Wait, let's also try scrolling a bit to see if that triggers it
    await page.evaluate(() => {
      window.scrollBy(0, 10);
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    const opacitiesAfterScroll = await page.evaluate(() => {
      const cards = document.querySelectorAll('.work-card');
      return Array.from(cards).map(c => ({
        inline: c.style.opacity,
        computed: window.getComputedStyle(c).opacity
      }));
    });
    
    console.log(`[TEST 3b] Opacities after manual scroll:`, opacitiesAfterScroll);

  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await browser.close();
  }
})();
