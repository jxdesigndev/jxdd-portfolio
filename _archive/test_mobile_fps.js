const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    // Simulate Mobile
    await page.setViewport({ width: 375, height: 667, isMobile: true, deviceScaleFactor: 2 });
    
    console.log("Loading index.html (Mobile)...");
    await page.goto('https://www.jxdesign.dev/', { waitUntil: 'domcontentloaded' });
    
    await new Promise(r => setTimeout(r, 4000));
    
    // We can pull the actual BufferGeometry count from Three.js!
    // It's exposed via script.js init if we can grab it.
    // wait, script.js hides it inside `initTypeToForm` and closure...
    // Let's just check window.innerWidth in the page context.
    const particleCountInfo = await page.evaluate(() => {
       const w = window.innerWidth;
       const expected = w < 768 ? 28000 : 55000;
       return { width: w, expected };
    });
    
    console.log(`Mobile Viewport Width: ${particleCountInfo.width}`);
    console.log(`Expected Particle Count (Mobile): ${particleCountInfo.expected}`);

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
})();
