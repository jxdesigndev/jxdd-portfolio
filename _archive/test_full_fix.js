const puppeteer = require('puppeteer');
const { exec } = require('child_process');

(async () => {
  const server = exec('python3 -m http.server 9191');
  await new Promise(r => setTimeout(r, 1500));

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    const t = msg.type().toUpperCase();
    if (t === 'ERROR') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push('PAGE ERROR: ' + err.toString()));

  await page.goto('http://localhost:9191', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const checks = await page.evaluate(() => {
    const results = {};

    // 1. Check Matter.js is NOT loaded
    results.matterJsLoaded = typeof window.Matter !== 'undefined';

    // 2. Check .tool-item has no opacity:0 from CSS (before JS runs)
    const fakeItem = document.createElement('div');
    fakeItem.className = 'tool-item';
    document.body.appendChild(fakeItem);
    const computed = window.getComputedStyle(fakeItem);
    results.toolItemDefaultOpacity = computed.opacity;
    results.toolItemDefaultTransform = computed.transform;
    document.body.removeChild(fakeItem);

    // 3. Check physics-grid has no fixed height
    const fakeGrid = document.createElement('div');
    fakeGrid.className = 'physics-grid';
    document.body.appendChild(fakeGrid);
    const gridStyle = window.getComputedStyle(fakeGrid);
    results.physicsGridHeight = gridStyle.height;
    results.physicsGridOverflow = gridStyle.overflow;
    document.body.removeChild(fakeGrid);

    // 4. Check bento-item exists
    const bentoItems = document.querySelectorAll('.bento-item');
    results.bentoItemCount = bentoItems.length;

    // 5. Check DOMPurify — it's deferred so may not be loaded yet (that's OK)
    results.dompurifyLoaded = typeof window.DOMPurify !== 'undefined';

    // 6. Check hero elements present
    results.heroNameExists = !!document.querySelector('.hero-name');
    results.heroCTAExists = !!document.querySelector('.hero-cta-group');

    return results;
  });

  console.log('\n=== INTEGRATION TEST RESULTS ===');
  console.log('Matter.js loaded (should be false):', checks.matterJsLoaded);
  console.log('.tool-item default opacity (should NOT be 0):', checks.toolItemDefaultOpacity);
  console.log('.tool-item default transform (should be none/matrix(1,0,0,1,0,0)):', checks.toolItemDefaultTransform);
  console.log('.physics-grid height (should NOT be 240px):', checks.physicsGridHeight);
  console.log('.physics-grid overflow (should NOT be hidden):', checks.physicsGridOverflow);
  console.log('.bento-item count:', checks.bentoItemCount);
  console.log('DOMPurify loaded (deferred — may be false locally):', checks.dompurifyLoaded);
  console.log('.hero-name exists:', checks.heroNameExists);
  console.log('.hero-cta-group exists:', checks.heroCTAExists);

  if (consoleErrors.length > 0) {
    console.log('\n=== CONSOLE ERRORS ===');
    consoleErrors.forEach(e => console.log(e));
  } else {
    console.log('\nNo console errors ✓');
  }

  // Summary
  const pass = !checks.matterJsLoaded &&
               checks.toolItemDefaultOpacity !== '0' &&
               checks.physicsGridHeight !== '240px' &&
               checks.heroNameExists &&
               checks.heroCTAExists;

  console.log('\n=== OVERALL:', pass ? 'PASS ✓' : 'FAIL — review above', '===');

  server.kill();
  await browser.close();
})();
