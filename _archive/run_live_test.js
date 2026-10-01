const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.evaluateOnNewDocument(() => {
    window.fpsData = [];
    let lastTime = performance.now();
    let frames = 0;
    function loop(time) {
      frames++;
      if (time - lastTime >= 1000) {
        window.fpsData.push(frames);
        frames = 0;
        lastTime = time;
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });

  console.log("Navigating to https://www.jxdesign.dev/...");
  await page.goto('https://www.jxdesign.dev/', { waitUntil: 'networkidle2' });
  
  console.log("Waiting for loader...");
  await new Promise(r => setTimeout(r, 4000));

  console.log("Scrolling to test GSAP/WebGL performance...");
  await page.evaluate(async () => {
    return new Promise(resolve => {
      let totalHeight = 0;
      let distance = 100;
      let timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if(totalHeight >= document.body.scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 50);
    });
  });

  await new Promise(r => setTimeout(r, 1000));

  const fps = await page.evaluate(() => window.fpsData);
  console.log("FPS Timeline:", fps);
  
  const avgFps = fps.length > 0 ? fps.reduce((a,b) => a+b, 0) / fps.length : 0;
  console.log("Average FPS:", avgFps);
  
  const drops = fps.filter(f => f < 30).length;
  console.log("Seconds below 30 FPS:", drops);

  await browser.close();
})();
