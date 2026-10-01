const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleLogs = [];
  const consoleErrors = [];
  page.on('console', msg => {
    const t = msg.type();
    if (t === 'error') consoleErrors.push(msg.text());
    if (t === 'warn') consoleLogs.push('WARN: ' + msg.text());
  });
  page.on('pageerror', err => consoleErrors.push('PAGE ERROR: ' + err.toString()));

  await page.goto('https://www.jxdesign.dev', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));

  const audit = await page.evaluate(() => {
    const results = {};

    // ── Layout & overflow ──
    results.bodyWidth = document.body.scrollWidth;
    results.windowWidth = window.innerWidth;
    results.hasHorizontalScroll = document.body.scrollWidth > window.innerWidth;

    // ── Hero section ──
    const hero = document.querySelector('.hero');
    const heroName = document.querySelector('.hero-name');
    const heroDesc = document.querySelector('.hero-desc');
    const heroCTA = document.querySelector('.hero-cta-group');
    results.heroHeight = hero ? hero.offsetHeight : null;
    results.heroNameFontSize = heroName ? window.getComputedStyle(heroName).fontSize : null;
    results.heroDescVisible = heroDesc ? window.getComputedStyle(heroDesc).opacity !== '0' : false;
    results.heroCTAVisible = heroCTA ? window.getComputedStyle(heroCTA).opacity !== '0' : false;

    // ── Images: missing alt text ──
    const imgs = document.querySelectorAll('img');
    const imgsNoAlt = [];
    imgs.forEach(img => { if (!img.alt) imgsNoAlt.push(img.src.split('/').pop()); });
    results.imagesWithoutAlt = imgsNoAlt;

    // ── Color contrast: check green on black ──
    // (visual only — can't compute exact ratio in JS without library)
    results.primaryGreen = getComputedStyle(document.documentElement).getPropertyValue('--green').trim();
    results.surfaceColor = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();

    // ── Loading performance timings ──
    const perf = window.performance.timing;
    results.domContentLoaded = perf.domContentLoadedEventEnd - perf.navigationStart;
    results.pageLoadTime = perf.loadEventEnd - perf.navigationStart;

    // ── Tool section ──
    const toolSection = document.getElementById('tools-section');
    results.toolSectionVisible = toolSection ? toolSection.style.display !== 'none' : false;
    const toolItems = document.querySelectorAll('.tool-item');
    results.toolItemCount = toolItems.length;

    // ── Sections present ──
    results.sections = {
      hero: !!document.querySelector('#hero'),
      featured: !!document.querySelector('#featured'),
      about: !!document.querySelector('#about'),
      services: !!document.querySelector('#services'),
      tools: !!document.getElementById('tools-section'),
      footer: !!document.querySelector('footer'),
    };

    // ── Links: broken or empty ──
    const links = document.querySelectorAll('a[href]');
    const emptyLinks = [];
    links.forEach(a => { if (a.href === '' || a.href === '#') emptyLinks.push(a.textContent.trim()); });
    results.emptyLinks = emptyLinks;

    // ── Fonts loaded ──
    results.fontsLoaded = document.fonts.status;

    // ── Animations active ──
    const revealEls = document.querySelectorAll('.reveal');
    let unrevealed = 0;
    revealEls.forEach(el => {
      const style = window.getComputedStyle(el);
      if (parseFloat(style.opacity) < 0.5) unrevealed++;
    });
    results.unrevealedElements = unrevealed;
    results.totalRevealElements = revealEls.length;

    // ── Meta/SEO ──
    results.metaDescription = document.querySelector('meta[name="description"]')?.content || null;
    results.ogTitle = document.querySelector('meta[property="og:title"]')?.content || null;
    results.ogImage = document.querySelector('meta[property="og:image"]')?.content || null;
    results.canonicalUrl = document.querySelector('link[rel="canonical"]')?.href || null;
    results.titleTag = document.title;

    // ── Testimonials ──
    const testimonials = document.querySelectorAll('.testimonial-card');
    results.testimonialCount = testimonials.length;

    // ── Scrollbar presence ──
    results.scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    return results;
  });

  console.log('\n=== LIVE SITE AUDIT ===');
  console.log(JSON.stringify(audit, null, 2));

  if (consoleErrors.length > 0) {
    console.log('\n=== CONSOLE ERRORS ===');
    consoleErrors.forEach(e => console.log(e));
  }
  if (consoleLogs.length > 0) {
    console.log('\n=== CONSOLE WARNINGS ===');
    consoleLogs.forEach(w => console.log(w));
  }

  await browser.close();
})();
