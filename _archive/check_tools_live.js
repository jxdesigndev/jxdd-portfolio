const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Capture console
  page.on('console', msg => console.log('CONSOLE:', msg.type().toUpperCase(), msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.toString()));
  
  console.log("Navigating to https://www.jxdesign.dev ...");
  await page.goto('https://www.jxdesign.dev', { waitUntil: 'networkidle2' });
  
  console.log("Scrolling to trigger animations...");
  await page.evaluate(() => {
     window.scrollTo(0, document.body.scrollHeight / 2);
  });
  await new Promise(r => setTimeout(r, 4000)); // wait for animations/physics
  
  console.log("\n--- EXACT COMPUTED STYLE OF ONE .tool-item ---");
  const elemData = await page.evaluate(() => {
    const devBox = document.querySelector('.db-tools-container[data-tool-category="dev"]');
    if (!devBox) return "No .db-tools-container[data-tool-category='dev'] found";
    
    const tool = devBox.querySelector('.tool-item');
    if (!tool) return "No .tool-item found inside dev box. Box HTML: " + devBox.outerHTML;
    
    const style = window.getComputedStyle(tool);
    return {
      outerHTML: tool.outerHTML,
      opacity: style.opacity,
      transform: style.transform,
      position: style.position,
      top: style.top,
      left: style.left,
      width: style.width,
      height: style.height,
      display: style.display
    };
  });
  
  console.log(JSON.stringify(elemData, null, 2));
  
  await browser.close();
})();
