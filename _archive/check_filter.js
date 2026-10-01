const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const t = msg.type().toUpperCase();
    if (t !== 'WARN') console.log('CONSOLE:', t, msg.text());
  });

  await page.goto('https://www.jxdesign.dev', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));

  const result = await page.evaluate(() => {
    const containers = document.querySelectorAll('.db-tools-container');
    const out = [];
    containers.forEach(c => {
      const cat = c.getAttribute('data-tool-category');
      const items = c.querySelectorAll('.tool-item');
      out.push({ category: cat, itemCount: items.length });
    });
    return out;
  });

  console.log('\n--- TOOL COUNTS PER CONTAINER ---');
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})();
