const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://www.jxdesign.dev', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));

  const a11y = await page.evaluate(() => {
    const results = {};

    // Focus indicators
    const focusableEls = document.querySelectorAll('a, button, input, [tabindex]');
    results.focusableCount = focusableEls.length;

    // Skip to content
    results.skipLinkExists = !!document.querySelector('.skip-to-content, [href="#page"], [href="#main"]');

    // ARIA labels on interactive elements
    const btnsNoLabel = [];
    document.querySelectorAll('button').forEach(btn => {
      if (!btn.textContent.trim() && !btn.getAttribute('aria-label') && !btn.getAttribute('aria-labelledby')) {
        btnsNoLabel.push(btn.className.slice(0, 50));
      }
    });
    results.buttonsWithoutLabel = btnsNoLabel;

    // Landmark regions
    results.mainExists = !!document.querySelector('main');
    results.headerExists = !!document.querySelector('header');
    results.navLandmark = !!document.querySelector('nav[aria-label], nav[aria-labelledby]');

    // Heading hierarchy
    const headings = [];
    document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
      headings.push({ tag: h.tagName, text: h.textContent.trim().slice(0, 60) });
    });
    results.headings = headings;

    // Color contrast approximation for text on background
    // hero name: #00FF41 green on #030508 dark
    // We'll just note the actual values
    results.heroNameColor = window.getComputedStyle(document.querySelector('.hero-name') || document.createElement('div')).color;
    results.bodyBg = window.getComputedStyle(document.body).backgroundColor;

    // prefers-reduced-motion respected
    results.reducedMotionMediaQueryPresent = true; // already checked in CSS audit

    // Tab trap / modal focus
    results.modalExists = !!document.querySelector('.modal, [role="dialog"]');

    // Form labels
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');
    const unlabeledInputs = [];
    inputs.forEach(inp => {
      const id = inp.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = inp.getAttribute('aria-label') || inp.getAttribute('aria-labelledby');
      if (!hasLabel && !hasAriaLabel) unlabeledInputs.push(inp.type || inp.tagName);
    });
    results.unlabeledInputs = unlabeledInputs;

    // Loading state - how loader looks
    results.loaderExists = !!document.querySelector('.loader, #loader, .jx-loader');

    return results;
  });

  console.log('\n=== ACCESSIBILITY AUDIT ===');
  console.log(JSON.stringify(a11y, null, 2));

  // Check Lighthouse-style performance
  const perfMetrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const totalResourceSize = resources.reduce((acc, r) => acc + (r.transferSize || 0), 0);
    const largestResources = resources
      .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
      .slice(0, 8)
      .map(r => ({ name: r.name.split('/').pop().slice(0,60), size: Math.round((r.transferSize || 0) / 1024) + 'KB', type: r.initiatorType }));

    return {
      totalTransferKB: Math.round(totalResourceSize / 1024),
      resourceCount: resources.length,
      largestResources,
      ttfb: Math.round(nav.responseStart - nav.requestStart),
      domInteractive: Math.round(nav.domInteractive - nav.startTime),
    };
  });

  console.log('\n=== PERFORMANCE METRICS ===');
  console.log(JSON.stringify(perfMetrics, null, 2));

  await browser.close();
})();
