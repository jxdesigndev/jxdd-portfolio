const puppeteer = require('puppeteer');
const { exec } = require('child_process');

(async () => {
  // Start a local server
  const server = exec('python3 -m http.server 9090');
  await new Promise(r => setTimeout(r, 1500));

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (!msg.text().includes('WebGL') && !msg.text().includes('GL Driver'))
      console.log('CONSOLE:', msg.type().toUpperCase(), msg.text());
  });
  page.on('pageerror', err => console.log('ERROR:', err.toString()));

  await page.goto('http://localhost:9090', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));

  const result = await page.evaluate(() => {
    const containers = document.querySelectorAll('.db-tools-container');
    const out = [];
    containers.forEach(c => {
      const cat = c.getAttribute('data-tool-category');
      const items = c.querySelectorAll('.tool-item');
      const firstItem = items[0];
      let computedPos = null;
      if (firstItem) {
        const s = window.getComputedStyle(firstItem);
        computedPos = { position: s.position, display: s.display, opacity: s.opacity };
      }
      out.push({ category: cat, itemCount: items.length, firstItemStyle: computedPos });
    });
    return out;
  });

  console.log('\n--- TOOL COUNTS PER CONTAINER (LOCAL) ---');
  result.forEach(r => console.log(JSON.stringify(r)));

  server.kill();
  await browser.close();
})();
