const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Capture console
  page.on('console', msg => console.log('CONSOLE:', msg.type().toUpperCase(), msg.text()));
  
  // Create a simple local server to serve the directory
  const { exec } = require('child_process');
  const server = exec('python3 -m http.server 8080');
  
  // Wait a second for server
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Navigating to local site...");
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle2' });
  
  console.log("Scrolling to trigger animations...");
  await page.evaluate(() => {
     window.scrollTo(0, document.body.scrollHeight / 2);
  });
  await new Promise(r => setTimeout(r, 2000)); // wait for animations/physics
  
  console.log("\n--- EXACT COMPUTED STYLE OF ONE .tool-item ---");
  const elemData = await page.evaluate(() => {
    const devBox = document.querySelector('.db-tools-container[data-tool-category="dev"]');
    if (!devBox) return "No .db-tools-container[data-tool-category='dev'] found";
    
    const tool = devBox.querySelector('.tool-item');
    if (!tool) return "No .tool-item found inside dev box";
    
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
  
  server.kill();
  await browser.close();
})();
