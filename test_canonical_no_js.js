const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  
  // Test 1: JS Disabled
  const page1 = await browser.newPage();
  await page1.setJavaScriptEnabled(false);
  await page1.goto('http://localhost:4173/project.html?slug=zenflow', { waitUntil: 'networkidle0' });
  const canonicalUrlNoJS = await page1.evaluate(() => {
    const el = document.querySelector('link[rel="canonical"]');
    return el ? el.href : null;
  });
  console.log('Canonical URL (JS Disabled):', canonicalUrlNoJS);
  
  // Test 2: JS Enabled
  const page2 = await browser.newPage();
  await page2.goto('http://localhost:4173/project.html?slug=zenflow', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  const canonicalUrlJS = await page2.evaluate(() => {
    const el = document.querySelector('link[rel="canonical"]');
    return el ? el.href : null;
  });
  console.log('Canonical URL (JS Enabled):', canonicalUrlJS);
  
  // Test 3: No Slug -> Graceful Failure Check
  const page3 = await browser.newPage();
  await page3.goto('http://localhost:4173/project.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  const h1Text = await page3.evaluate(() => {
    const el = document.querySelector('h1');
    return el ? el.textContent : null;
  });
  console.log('H1 Text without Slug:', h1Text);

  await browser.close();
  process.exit(0);
})();
