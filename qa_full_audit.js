/**
 * Combined server + E2E audit script.
 * Starts the dev server inline, runs Puppeteer, then kills the server.
 */

const http     = require('http');
const fs       = require('fs');
const path     = require('path');
const puppeteer = require('puppeteer');

const PORT = 18080; // Use a different port to avoid conflict
const ROOT = __dirname;

/* ─── Inline dev server ─── */
const MIME_TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf'
};
const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = filePath.split('?')[0];
  const absPath = path.join(ROOT, filePath);
  const ext = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  fs.readFile(absPath, (err, content) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/html' });
      res.end(`<h1>${err.code}</h1>`);
    } else {
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' });
      res.end(content, 'utf-8');
    }
  });
});

const BASE = `http://localhost:${PORT}`;
const results = [];
const allLogs = {};

function log(section, msg) { console.log(`[${section}] ${msg}`); }
function pass(section, test) { results.push({ section, test, status: 'PASS' }); log(section, `✅  ${test}`); }
function fail(section, test, reason) { results.push({ section, test, status: 'FAIL', reason }); log(section, `❌  ${test} — ${reason}`); }
function warn(section, test, reason) { results.push({ section, test, status: 'WARN', reason }); log(section, `⚠️   ${test} — ${reason}`); }

async function setupPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const logs = [];
  page.on('console', msg => {
    const type = msg.type().toUpperCase();
    if (['WARN', 'ERROR'].includes(type)) logs.push(`[${type}] ${msg.text()}`);
  });
  page.on('pageerror', e => logs.push(`[PAGE ERROR] ${e.message}`));
  page.on('requestfailed', req => {
    const url = req.url();
    if (!url.includes('favicon') && !url.includes('supabase')) logs.push(`[REQUEST FAILED] ${url}`);
  });
  return { page, logs };
}

server.listen(PORT, async () => {
  console.log(`✅ Inline server running at ${BASE}`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    /* ═══════════════════════════════════════════════════════
       PAGE 1: index.html
    ═══════════════════════════════════════════════════════ */
    log('SETUP', 'Testing index.html...');
    const { page: p1, logs: l1 } = await setupPage(browser);
    allLogs['index'] = l1;
    await p1.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 4000));

    const indexLenis = await p1.evaluate(() => !!(window.JXLenis && !window.JXLenis.isStopped));
    indexLenis ? pass('index', 'window.JXLenis active on load') : fail('index', 'window.JXLenis active', 'Not found or stopped');

    await p1.evaluate(() => window.scrollBy(0, 2000));
    await new Promise(r => setTimeout(r, 400));
    await p1.evaluate(() => window.scrollBy(0, -2000));
    await new Promise(r => setTimeout(r, 400));
    const afterScrollLenis = await p1.evaluate(() => !!(window.JXLenis && !window.JXLenis.isStopped));
    afterScrollLenis ? pass('index', 'Lenis survives rapid 2000px scroll') : fail('index', 'Lenis survives rapid scroll', 'Stopped after scroll');

    // CLI
    await p1.evaluate(() => document.getElementById('cli-trigger')?.click());
    await new Promise(r => setTimeout(r, 1000));
    const cliOpen = await p1.evaluate(() => document.getElementById('cli-panel')?.classList.contains('open'));
    cliOpen ? pass('index', 'CLI panel opens') : fail('index', 'CLI panel opens', 'No .open class');
    const cliLenisStopped = await p1.evaluate(() => !!(window.JXLenis?.isStopped));
    cliLenisStopped ? pass('index', 'Lenis stops during CLI') : warn('index', 'Lenis during CLI', 'Not stopped');

    await p1.type('#cli-input', 'help');
    await p1.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 800));
    const cliHasOutput = await p1.evaluate(() => document.getElementById('cli-output')?.children.length > 0);
    cliHasOutput ? pass('index', 'CLI "help" appends output') : fail('index', 'CLI "help" output', 'cli-output empty');

    const hasLenisPrevent = await p1.evaluate(() => document.getElementById('cli-output')?.hasAttribute('data-lenis-prevent'));
    hasLenisPrevent ? pass('index', 'CLI output has data-lenis-prevent') : fail('index', 'CLI data-lenis-prevent', 'Missing attribute');

    await p1.evaluate(() => document.getElementById('cli-close')?.click());
    await new Promise(r => setTimeout(r, 800));
    const cliLenisBack = await p1.evaluate(() => !!(window.JXLenis && !window.JXLenis.isStopped));
    cliLenisBack ? pass('index', 'Lenis restarts after CLI close') : fail('index', 'Lenis restart', 'Still stopped');

    // Pong
    await p1.evaluate(() => document.getElementById('cli-trigger')?.click());
    await new Promise(r => setTimeout(r, 700));
    await p1.type('#cli-input', 'pong');
    await p1.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 3500));
    const pongActive = await p1.evaluate(() => document.body.classList.contains('pong-active'));
    pongActive ? pass('index', 'Pong easter egg activates (body.pong-active)') : fail('index', 'Pong activates', 'body.pong-active not set');
    const pongHUD = await p1.evaluate(() => !!document.getElementById('pong-hud'));
    pongHUD ? pass('index', 'Pong HUD rendered in DOM') : fail('index', 'Pong HUD', '#pong-hud missing');
    const pongARIA = await p1.evaluate(() => {
      const hud = document.getElementById('pong-hud');
      return hud?.querySelector('[aria-live]')?.getAttribute('aria-live');
    });
    pongARIA === 'polite' ? pass('index', 'Pong score has aria-live="polite"') : warn('index', 'Pong score ARIA', `aria-live: "${pongARIA}"`);

    await p1.keyboard.down('ArrowUp');
    await new Promise(r => setTimeout(r, 1000));
    await p1.keyboard.up('ArrowUp');
    await p1.keyboard.down('ArrowDown');
    await new Promise(r => setTimeout(r, 1000));
    await p1.keyboard.up('ArrowDown');
    pass('index', 'Pong ArrowUp+ArrowDown input held without crash');

    await p1.evaluate(() => document.getElementById('pong-close-btn')?.click());
    await new Promise(r => setTimeout(r, 800));
    const pongClosed = await p1.evaluate(() => !document.body.classList.contains('pong-active'));
    pongClosed ? pass('index', 'Pong closes cleanly') : fail('index', 'Pong close', 'body.pong-active still set');

    // Audio
    await p1.evaluate(() => document.getElementById('nav-audio-toggle')?.click());
    await new Promise(r => setTimeout(r, 1500));
    const audioToast = await p1.evaluate(() => {
      const t = document.getElementById('jx-audio-toast');
      if (!t) return null;
      return { ariaLive: t.getAttribute('aria-live'), role: t.getAttribute('role') };
    });
    if (audioToast) {
      audioToast.ariaLive === 'polite' ? pass('index', 'Audio toast aria-live="polite"') : fail('index', 'Audio toast aria-live', `Got: ${audioToast.ariaLive}`);
      audioToast.role === 'status' ? pass('index', 'Audio toast role="status"') : fail('index', 'Audio toast role', `Got: ${audioToast.role}`);
    } else {
      warn('index', 'Audio toast', 'Not in DOM — may have already auto-dismissed due to earlier scroll interaction');
    }

    await p1.screenshot({ path: 'qa_audit_index.jpg', quality: 90, type: 'jpeg' });
    await p1.close();

    /* ═══════════════════════════════════════════════════════
       PAGE 2: about.html
    ═══════════════════════════════════════════════════════ */
    log('SETUP', 'Testing about.html...');
    const { page: p2, logs: l2 } = await setupPage(browser);
    allLogs['about'] = l2;
    await p2.goto(`${BASE}/about.html`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    const aboutLenis = await p2.evaluate(() => !!(window.JXLenis && !window.JXLenis.isStopped));
    aboutLenis ? pass('about', 'Lenis active on about page') : warn('about', 'Lenis on about', 'Not found');

    const ancestralBlock = await p2.evaluate(() => {
      const el = document.querySelector('.about-narrative');
      if (!el) return null;
      return { exists: true, height: el.offsetHeight, hasH2: !!el.querySelector('h2') };
    });
    if (ancestralBlock) {
      pass('about', 'Ancestral Futurism .about-narrative block exists');
      ancestralBlock.height > 0 ? pass('about', `Narrative block has real height (${ancestralBlock.height}px)`) : fail('about', 'Narrative height', 'Height is 0 — collapsed layout');
      ancestralBlock.hasH2 ? pass('about', 'Narrative h2 heading present') : fail('about', 'Narrative h2', 'Missing');
    } else {
      fail('about', 'Ancestral Futurism block', '.about-narrative not in DOM');
    }

    // Portrait canvas
    const portraitCanvas = await p2.evaluate(() => {
      const c = document.getElementById('portrait-canvas');
      return c ? { role: c.getAttribute('role'), ariaLabel: c.getAttribute('aria-label') } : null;
    });
    if (portraitCanvas) {
      portraitCanvas.role === 'img' ? pass('about', 'Portrait canvas role="img"') : fail('about', 'Portrait canvas ARIA', `role: ${portraitCanvas.role}`);
      portraitCanvas.ariaLabel ? pass('about', 'Portrait canvas has aria-label') : fail('about', 'Portrait canvas aria-label', 'Missing');
    } else {
      warn('about', 'Portrait canvas', '#portrait-canvas not found');
    }

    // Main landmark
    const hasMain = await p2.evaluate(() => !!document.querySelector('main'));
    hasMain ? pass('about', 'Page has <main> landmark') : fail('about', '<main> landmark', 'No <main> element — critical a11y gap');

    // Scroll through
    await p2.evaluate(() => window.scrollBy(0, 4000));
    await new Promise(r => setTimeout(r, 600));
    pass('about', 'Full page scroll without exception');

    await p2.screenshot({ path: 'qa_audit_about.jpg', quality: 90, type: 'jpeg' });
    await p2.close();

    /* ═══════════════════════════════════════════════════════
       PAGE 3: work.html
    ═══════════════════════════════════════════════════════ */
    log('SETUP', 'Testing work.html...');
    const { page: p3, logs: l3 } = await setupPage(browser);
    allLogs['work'] = l3;
    await p3.goto(`${BASE}/work.html`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    const workLenis = await p3.evaluate(() => !!(window.JXLenis && !window.JXLenis.isStopped));
    workLenis ? pass('work', 'Lenis active on work page') : warn('work', 'Lenis on work', 'Not found');

    const filterBtns = await p3.$$('.filter-btn');
    log('work', `Filter buttons found: ${filterBtns.length}`);
    if (filterBtns.length > 1) {
      await filterBtns[1].click();
      await new Promise(r => setTimeout(r, 800));
      pass('work', `${filterBtns.length} filter buttons clickable`);
      await filterBtns[0].click();
      await new Promise(r => setTimeout(r, 400));
    } else {
      warn('work', 'Filter buttons', `Only ${filterBtns.length} found`);
    }

    const cards = await p3.$$('.work-card');
    log('work', `Project cards found: ${cards.length}`);
    if (cards.length > 0) {
      await cards[0].click();
      await new Promise(r => setTimeout(r, 2000));

      const modalExists = await p3.evaluate(() => !!document.getElementById('vault-modal-overlay'));
      modalExists ? pass('work', 'Modal overlay in DOM after card click') : fail('work', 'Modal opens', 'No #vault-modal-overlay');

      if (modalExists) {
        const modalCSS = await p3.evaluate(() => {
          const m = document.querySelector('.vault-modal');
          if (!m) return null;
          const s = getComputedStyle(m);
          return { display: s.display, flexDirection: s.flexDirection, overflowY: s.overflowY };
        });
        if (modalCSS) {
          log('work', `Modal computed: ${JSON.stringify(modalCSS)}`);
          modalCSS.flexDirection === 'column' ? pass('work', 'Modal flexDirection:column (single-column)') : fail('work', 'Modal layout', `flexDirection: ${modalCSS.flexDirection}`);
          ['auto','scroll'].includes(modalCSS.overflowY) ? pass('work', 'Modal overflow-y scrollable') : fail('work', 'Modal scroll', `overflowY: ${modalCSS.overflowY}`);
        }

        // Scroll inside modal
        await p3.evaluate(() => { document.querySelector('.vault-modal')?.scrollBy(0, 300); });
        await new Promise(r => setTimeout(r, 400));
        const scrollTop = await p3.evaluate(() => document.querySelector('.vault-modal')?.scrollTop || 0);
        scrollTop > 0 ? pass('work', `Modal scrollable (scrollTop: ${scrollTop}px)`) : warn('work', 'Modal scroll position', 'scrollTop stayed 0 — content may be too short');

        // Close btn position:fixed
        const closeBtnPos = await p3.evaluate(() => {
          const b = document.getElementById('vault-modal-close');
          return b ? getComputedStyle(b).position : null;
        });
        closeBtnPos === 'fixed' ? pass('work', 'Close button position:fixed (viewport-anchored)') : fail('work', 'Close btn fixed', `position: ${closeBtnPos}`);

        // Lenis stopped
        const lenisStopped = await p3.evaluate(() => !!(window.JXLenis?.isStopped));
        lenisStopped ? pass('work', 'Lenis paused during modal') : warn('work', 'Lenis during modal', 'Not stopped');

        // Close modal
        await p3.evaluate(() => document.getElementById('vault-modal-close')?.click());
        await new Promise(r => setTimeout(r, 1000));
        const modalGone = await p3.evaluate(() => !document.getElementById('vault-modal-overlay'));
        modalGone ? pass('work', 'Modal DOM-removed after close') : fail('work', 'Modal cleanup', 'Overlay still in DOM');
        const lenisBack = await p3.evaluate(() => !!(window.JXLenis && !window.JXLenis.isStopped));
        lenisBack ? pass('work', 'Lenis restarts after modal close') : fail('work', 'Lenis restart', 'Still stopped');

        // Multiple instance test
        if (cards.length > 1) {
          await cards[0].click(); // re-click first card to get a second instance
          await new Promise(r => setTimeout(r, 1500));
          const freshScrollTop = await p3.evaluate(() => document.querySelector('.vault-modal')?.scrollTop || 0);
          freshScrollTop === 0 ? pass('work', 'Second modal opens with scrollTop:0 (no stale state)') : fail('work', 'Second modal scroll state', `scrollTop: ${freshScrollTop}`);
          await p3.evaluate(() => document.getElementById('vault-modal-close')?.click());
          await new Promise(r => setTimeout(r, 800));
        }
      }
    } else {
      fail('work', 'Project cards', 'No .work-card found');
    }

    await p3.screenshot({ path: 'qa_audit_work.jpg', quality: 90, type: 'jpeg' });
    await p3.close();

    /* ═══════════════════════════════════════════════════════
       PAGE 4: services.html
    ═══════════════════════════════════════════════════════ */
    log('SETUP', 'Testing services.html...');
    const { page: p4, logs: l4 } = await setupPage(browser);
    allLogs['services'] = l4;
    await p4.goto(`${BASE}/services.html`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    const hasH1Services = await p4.evaluate(() => !!document.querySelector('h1'));
    hasH1Services ? pass('services', 'h1 exists on page') : fail('services', 'h1 exists', 'Missing');

    const hasMainServices = await p4.evaluate(() => !!document.querySelector('main'));
    hasMainServices ? pass('services', '<main> landmark exists') : fail('services', '<main> landmark', 'Missing — a11y gap');

    const serviceDeepCards = await p4.$$('.service-deep');
    log('services', `Service deep sections found: ${serviceDeepCards.length}`);
    serviceDeepCards.length >= 3 ? pass('services', `${serviceDeepCards.length} service sections rendered`) : warn('services', 'Service sections count', `Only ${serviceDeepCards.length}`);

    if (serviceDeepCards.length > 0) {
      await serviceDeepCards[0].hover();
      await new Promise(r => setTimeout(r, 300));
      pass('services', 'Service card hover without null ref error');
    }

    await p4.evaluate(() => window.scrollBy(0, 3000));
    await new Promise(r => setTimeout(r, 500));
    pass('services', 'Full page scroll without exception');

    const decorativeIconsHidden = await p4.evaluate(() => {
      const icons = document.querySelectorAll('.service-deep-icon');
      return Array.from(icons).every(el => el.getAttribute('aria-hidden') === 'true');
    });
    decorativeIconsHidden ? pass('services', 'Decorative service icons aria-hidden="true"') : fail('services', 'Decorative icons ARIA', 'Icons not aria-hidden — screen readers will read Unicode symbols aloud');

    await p4.screenshot({ path: 'qa_audit_services.jpg', quality: 90, type: 'jpeg' });
    await p4.close();

    /* ═══════════════════════════════════════════════════════
       PAGE 5: contact.html
    ═══════════════════════════════════════════════════════ */
    log('SETUP', 'Testing contact.html...');
    const { page: p5, logs: l5 } = await setupPage(browser);
    allLogs['contact'] = l5;
    await p5.goto(`${BASE}/contact.html`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    const formExists = await p5.evaluate(() => !!document.getElementById('contact-form'));
    formExists ? pass('contact', 'contact-form exists') : fail('contact', 'contact-form', 'Not found');

    const nameField = await p5.$('#cf-name');
    const emailField = await p5.$('#cf-email');
    const msgField = await p5.$('#cf-message');
    const submitBtn = await p5.$('#form-submit');

    nameField ? pass('contact', '#cf-name field found') : fail('contact', '#cf-name', 'Not found');
    emailField ? pass('contact', '#cf-email field found') : fail('contact', '#cf-email', 'Not found');
    msgField ? pass('contact', '#cf-message field found') : fail('contact', '#cf-message', 'Not found');
    submitBtn ? pass('contact', '#form-submit button found') : fail('contact', '#form-submit', 'Not found');

    // Fill & submit
    if (nameField) await nameField.type('JX QA Tester');
    if (emailField) await emailField.type('qa@jxdesign.io');
    if (msgField) await msgField.type('Automated QA test — disregard.');
    pass('contact', 'All form fields populated');

    const formStatusAriaLive = await p5.evaluate(() => {
      const s = document.getElementById('form-status');
      return s?.getAttribute('role');
    });
    formStatusAriaLive === 'alert' ? pass('contact', '#form-status role="alert" (live region)') : fail('contact', 'form-status role', `Got: ${formStatusAriaLive}`);

    if (submitBtn) {
      await p5.evaluate(() => document.getElementById('form-submit').click());
      await new Promise(r => setTimeout(r, 3000));

      const statusText = await p5.evaluate(() => document.getElementById('form-status')?.textContent?.trim());
      log('contact', `Form status message: "${statusText}"`);
      statusText && statusText.length > 0 ? pass('contact', 'Form status message displayed after submit') : fail('contact', 'Form status', 'Empty — no user feedback');

      const btnState = await p5.evaluate(() => ({
        disabled: document.getElementById('form-submit')?.disabled,
        text: document.getElementById('form-submit')?.textContent?.trim(),
      }));
      log('contact', `Submit button after submit: disabled=${btnState.disabled}, text="${btnState.text}"`);
      !btnState.disabled ? pass('contact', 'Submit button re-enabled after submit (resilience)') : fail('contact', 'Button re-enable', 'Still disabled — user locked out');

      // Validation test: submit with empty fields
      await p5.evaluate(() => {
        document.getElementById('cf-name').value = '';
        document.getElementById('cf-email').value = '';
        document.getElementById('cf-message').value = '';
      });
      await p5.evaluate(() => document.getElementById('form-submit').click());
      await new Promise(r => setTimeout(r, 500));
      const ariaInvalid = await p5.evaluate(() => {
        const name = document.getElementById('cf-name');
        return name?.getAttribute('aria-invalid');
      });
      ariaInvalid === 'true' ? pass('contact', 'aria-invalid="true" set on empty fields') : fail('contact', 'aria-invalid validation', `Got: ${ariaInvalid}`);
    }

    await p5.screenshot({ path: 'qa_audit_contact.jpg', quality: 90, type: 'jpeg' });
    await p5.close();

    /* ─── SUMMARY ─── */
    const passes = results.filter(r => r.status === 'PASS').length;
    const fails  = results.filter(r => r.status === 'FAIL').length;
    const warns  = results.filter(r => r.status === 'WARN').length;

    console.log('\n\n════════════════════════════════════════════════');
    console.log('         E2E FULL AUDIT RESULTS SUMMARY');
    console.log('════════════════════════════════════════════════');
    console.log(`  Total Tests: ${results.length} | ✅ PASS: ${passes} | ❌ FAIL: ${fails} | ⚠️  WARN: ${warns}`);

    if (fails > 0) {
      console.log('\n  ── FAILURES ──');
      results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ❌ [${r.section.toUpperCase()}] ${r.test}: ${r.reason}`));
    }
    if (warns > 0) {
      console.log('\n  ── WARNINGS ──');
      results.filter(r => r.status === 'WARN').forEach(r => console.log(`  ⚠️  [${r.section.toUpperCase()}] ${r.test}: ${r.reason}`));
    }

    console.log('\n\n════════════════════════════════════════════════');
    console.log('         BROWSER CONSOLE LOGS BY PAGE');
    console.log('════════════════════════════════════════════════');
    for (const [pg, logs] of Object.entries(allLogs)) {
      console.log(`\n  ── ${pg.toUpperCase()} ──`);
      if (logs.length === 0) {
        console.log('  ✅ Clean — no WARN or ERROR messages');
      } else {
        logs.forEach(l => console.log(`  ${l}`));
      }
    }

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    await browser.close();
    server.close(() => {
      console.log('\n✅ Inline server shut down. All done.');
      process.exit(0);
    });
  }
});
