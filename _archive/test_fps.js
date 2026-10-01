const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Desktop Viewport
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    
    // Inject FPS monitor BEFORE page load
    await page.evaluateOnNewDocument(() => {
      window.fpsData = { idle: [], scroll: [] };
      window.isScrollingTest = false;
      
      let lastTime = performance.now();
      let frames = 0;
      
      function loop(time) {
        frames++;
        if (time - lastTime >= 1000) {
          const fps = Math.round((frames * 1000) / (time - lastTime));
          if (window.isScrollingTest) {
            window.fpsData.scroll.push(fps);
          } else {
            window.fpsData.idle.push(fps);
          }
          frames = 0;
          lastTime = time;
        }
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
    });

    console.log("Loading index.html (Desktop)...");
    await page.goto('https://www.jxdesign.dev/', { waitUntil: 'networkidle2' });
    
    // Check particle count
    const particleCount = await page.evaluate(() => {
       // Look for MAIN_COUNT in window if possible, else we can infer it 
       // but wait, we can just grab the canvas context or check the three.js arrays
       // Actually let's just log what we can.
       return window.innerWidth < 768 ? 28000 : 55000; 
    });
    console.log(`Expected Particle Count (Desktop): ${particleCount}`);

    console.log("Measuring IDLE FPS for 3 seconds...");
    await new Promise(r => setTimeout(r, 3000));
    
    console.log("Measuring SCROLL FPS for 3 seconds...");
    await page.evaluate(() => { window.isScrollingTest = true; });
    
    // Aggressive scroll
    for (let i = 0; i < 30; i++) {
       await page.evaluate(() => window.scrollBy(0, 300));
       await new Promise(r => setTimeout(r, 100));
    }
    
    const fps = await page.evaluate(() => window.fpsData);
    console.log("Desktop IDLE FPS:", fps.idle);
    console.log("Desktop SCROLL FPS:", fps.scroll);
    
    // Capture performance profile during scroll
    console.log("Capturing performance profile...");
    await page.tracing.start({ path: 'trace.json', screenshots: false });
    await page.evaluate(() => {
        let y = 0;
        function scrollLoop() {
            y += 200;
            window.scrollTo(0, y);
            if (y < 3000) requestAnimationFrame(scrollLoop);
        }
        scrollLoop();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.tracing.stop();
    console.log("Trace saved to trace.json");
    
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
})();
