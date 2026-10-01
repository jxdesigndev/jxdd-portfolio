const puppeteer = require('puppeteer');
const path = require('path');

async function checkPage(browser, filename, selectorsToCheck) {
  console.log(`\n========================================`);
  console.log(`[TESTING] ${filename}`);
  console.log(`========================================`);
  
  const page = await browser.newPage();
  let errors = [];
  
  page.on('pageerror', err => errors.push(`JS Crash: ${err.toString()}`));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore missing local images/videos/favicon in headless test
      if (!text.includes('ERR_FILE_NOT_FOUND') && !text.includes('favicon.ico') && !text.includes('WebGL')) {
        errors.push(`Console Error: ${text}`);
      }
    }
  });

  const url = 'file://' + path.resolve(filename);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  
  // Wait for initial GSAP boot animations (like revealPage)
  await new Promise(r => setTimeout(r, 4000));
  
  // 1. Check Page Opacity
  const pageOpacity = await page.evaluate(() => {
    const el = document.getElementById('page');
    return el ? window.getComputedStyle(el).opacity : 'Missing #page';
  });
  console.log(`=> Page Wrapper Opacity: ${pageOpacity} (Should be 1)`);
  
  // 2. Check Specific Elements
  for (const sel of selectorsToCheck) {
    const stats = await page.evaluate((selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        found: true,
        width: rect.width,
        height: rect.height,
        display: style.display,
        visibility: style.visibility
      };
    }, sel);
    
    if (!stats) {
      console.log(`[FAIL] Element missing: ${sel}`);
    } else {
      console.log(`[PASS] Element ${sel} found | Display: ${stats.display} | WxH: ${Math.round(stats.width)}x${Math.round(stats.height)}`);
    }
  }
  
  if (errors.length > 0) {
    console.log(`\n[CRITICAL ERRORS FOUND]:`);
    errors.forEach(e => console.log(` - ${e}`));
  } else {
    console.log(`\n[SUCCESS] No JS crashes or layout breaks detected on ${filename}.`);
  }
  
  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  
  await checkPage(browser, 'index.html', ['.hero', '.featured-section', '.nav-container']);
  await checkPage(browser, 'work.html', ['.work-hero', '.filter-container', '.projects-grid']);
  await checkPage(browser, 'about.html', ['.dbx-hub-view', '.dbx-massive-logo', '.dbx-bento-grid']);
  await checkPage(browser, 'services.html', ['.services-hero', '.services-list']);
  await checkPage(browser, 'contact.html', ['.contact-hero', '.contact-form-wrapper']);
  
  await browser.close();
  console.log(`\n=== ALL TESTS COMPLETE ===\n`);
})();
