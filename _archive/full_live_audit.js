const puppeteer = require('puppeteer');
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const pages = [
    { url: 'https://www.jxdesign.dev/', name: 'Homepage' },
    { url: 'https://www.jxdesign.dev/about.html', name: 'About' },
    { url: 'https://www.jxdesign.dev/work.html', name: 'Work' },
    { url: 'https://www.jxdesign.dev/contact.html', name: 'Contact' },
    { url: 'https://www.jxdesign.dev/services.html', name: 'Services' },
    { url: 'https://www.jxdesign.dev/project.html', name: 'Project' },
    { url: 'https://www.jxdesign.dev/admin.html', name: 'Admin' },
    { url: 'https://www.jxdesign.dev/nonexistent-page', name: '404 Test' },
  ];

  for (const pg of pages) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`PAGE: ${pg.name} (${pg.url})`);
    console.log('='.repeat(60));

    const page = await browser.newPage();
    const jsErrors = [];
    const consoleIssues = [];
    const failedReqs = [];
    const networkReqs = [];

    page.on('pageerror', err => jsErrors.push(err.message.substring(0, 200)));
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleIssues.push(`[${msg.type().toUpperCase()}] ${msg.text().substring(0, 200)}`);
      }
    });
    page.on('requestfailed', req => {
      failedReqs.push(`FAILED: ${req.url().substring(0, 120)} — ${req.failure()?.errorText}`);
    });
    page.on('response', res => {
      if (res.status() >= 400) {
        failedReqs.push(`${res.status()}: ${res.url().substring(0, 120)}`);
      }
      networkReqs.push({ url: res.url(), status: res.status(), type: res.request().resourceType() });
    });

    try {
      await page.goto(pg.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await wait(2000);

      const title = await page.title();
      console.log(`Title: ${title}`);

      // Check for H1
      const h1Count = await page.evaluate(() => document.querySelectorAll('h1').length);
      console.log(`H1 tags: ${h1Count} ${h1Count === 0 ? '⚠️ MISSING' : h1Count > 1 ? '⚠️ MULTIPLE' : '✅'}`);

      // Check for skip link
      const skipLink = await page.evaluate(() => !!document.querySelector('.skip-to-content, #skip-to-content'));
      console.log(`Skip link: ${skipLink ? '✅' : '❌ MISSING'}`);

      // Check meta tags
      const meta = await page.evaluate(() => ({
        desc: document.querySelector('meta[name="description"]')?.content || 'MISSING',
        ogTitle: document.querySelector('meta[property="og:title"]')?.content || 'MISSING',
        ogImage: document.querySelector('meta[property="og:image"]')?.content || 'MISSING',
        canonical: document.querySelector('link[rel="canonical"]')?.href || 'MISSING',
        viewport: document.querySelector('meta[name="viewport"]')?.content || 'MISSING',
      }));
      if (meta.ogTitle === 'MISSING') console.log('❌ Missing og:title');
      if (meta.ogImage === 'MISSING') console.log('❌ Missing og:image');
      if (meta.canonical === 'MISSING') console.log('❌ Missing canonical');

      // Check for broken images
      const brokenImgs = await page.evaluate(() => {
        return [...document.querySelectorAll('img')].filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);
      });
      if (brokenImgs.length) console.log('❌ Broken images:', brokenImgs.join(', '));

      // Check focusable elements
      const focusableWithoutOutline = await page.evaluate(() => {
        const els = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');
        let count = 0;
        els.forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.outlineStyle === 'none' && !el.closest('[style*="outline"]')) count++;
        });
        return count;
      });
      console.log(`Elements with outline:none: ${focusableWithoutOutline}`);

      // Console issues
      if (jsErrors.length) {
        console.log('\n🔴 JS EXCEPTIONS:');
        [...new Set(jsErrors)].forEach(e => console.log(`  ${e}`));
      }
      if (consoleIssues.length) {
        console.log('\n⚠️ CONSOLE WARNINGS/ERRORS:');
        [...new Set(consoleIssues)].forEach(e => console.log(`  ${e}`));
      }
      if (failedReqs.length) {
        console.log('\n❌ FAILED NETWORK REQUESTS:');
        [...new Set(failedReqs)].forEach(e => console.log(`  ${e}`));
      }

      // Report total requests
      const types = {};
      networkReqs.forEach(r => { types[r.type] = (types[r.type] || 0) + 1; });
      console.log(`\nTotal requests: ${networkReqs.length}`);
      console.log('By type:', JSON.stringify(types));

    } catch (err) {
      console.log(`❌ PAGE LOAD FAILED: ${err.message}`);
    }
    await page.close();
  }

  // CLI / Pong Test on homepage
  console.log(`\n${'='.repeat(60)}`);
  console.log('HIDDEN FEATURE TEST: CLI Terminal & Pong Game');
  console.log('='.repeat(60));

  const page = await browser.newPage();
  try {
    await page.goto('https://www.jxdesign.dev/', { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(3000);

    // Check if CLI panel exists
    const cliPanel = await page.evaluate(() => !!document.getElementById('cli-panel'));
    console.log(`CLI panel in DOM: ${cliPanel ? '✅' : '❌'}`);

    // Trigger Ctrl+K
    await page.keyboard.down('Control');
    await page.keyboard.press('k');
    await page.keyboard.up('Control');
    await wait(800);

    const cliVisible = await page.evaluate(() => {
      const p = document.getElementById('cli-panel');
      return p && window.getComputedStyle(p).opacity > 0;
    });
    console.log(`CLI opens via Ctrl+K: ${cliVisible ? '✅' : '❌'}`);

    if (cliVisible) {
      // Test 'help' command
      await page.type('#cli-input', 'help');
      await page.keyboard.press('Enter');
      await wait(500);
      const helpOutput = await page.evaluate(() => {
        const out = document.getElementById('cli-output');
        return out ? out.textContent.includes('AVAILABLE COMMANDS') : false;
      });
      console.log(`'help' command works: ${helpOutput ? '✅' : '❌'}`);

      // Clear and test 'pong'
      await page.evaluate(() => document.getElementById('cli-input').value = '');
      await page.type('#cli-input', 'pong');
      await page.keyboard.press('Enter');
      await wait(3000);
      const pongActive = await page.evaluate(() => document.body.classList.contains('pong-active'));
      console.log(`'pong' activates: ${pongActive ? '✅' : '❌ (likely requires WebGL)'}`);
    }
  } catch (e) {
    console.log(`CLI test error: ${e.message}`);
  }
  await page.close();

  await browser.close();
  console.log('\n✅ Full live audit complete.');
})();
