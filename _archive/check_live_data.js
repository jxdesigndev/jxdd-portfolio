const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Capture ALL console output this time
  page.on('console', msg => console.log('CONSOLE:', msg.type().toUpperCase(), msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.toString()));

  await page.goto('https://www.jxdesign.dev', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));

  const result = await page.evaluate(() => {
    const containers = document.querySelectorAll('.db-tools-container');
    const out = [];
    containers.forEach(c => {
      const cat = c.getAttribute('data-tool-category');
      const items = c.querySelectorAll('.tool-item');
      // Get what Supabase fetched -- check physicsNodes 
      const nodesLen = (c._physicsNodes || []).length;
      out.push({ category: cat, itemCount: items.length, physicsNodesCount: nodesLen, innerHTML: c.innerHTML.slice(0, 300) });
    });
    
    // Also check what tools data looks like if we can see it in memory
    return { containers: out };
  });

  console.log('\n--- INVESTIGATION RESULT ---');
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})();
