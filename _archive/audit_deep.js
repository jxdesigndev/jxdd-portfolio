const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://www.jxdesign.dev', { waitUntil: 'networkidle2' });
  
  // Wait for loader to finish + animations to run
  await new Promise(r => setTimeout(r, 6000));

  const deepAudit = await page.evaluate(() => {
    const results = {};

    // ── Hero CTA after animations ──
    const heroCTA = document.querySelector('.hero-cta-group');
    const heroDesc = document.querySelector('.hero-desc');
    const heroMeta = document.querySelector('.hero-meta');
    const heroEyebrow = document.querySelector('.hero-eyebrow');
    results.heroCTAOpacity = heroCTA ? window.getComputedStyle(heroCTA).opacity : 'not found';
    results.heroDescOpacity = heroDesc ? window.getComputedStyle(heroDesc).opacity : 'not found';
    results.heroMetaOpacity = heroMeta ? window.getComputedStyle(heroMeta).opacity : 'not found';
    results.heroEyebrowOpacity = heroEyebrow ? window.getComputedStyle(heroEyebrow).opacity : 'not found';

    // ── Scroll down and check reveals ──
    window.scrollTo(0, 500);
    
    // ── Featured section ──
    const featuredGrid = document.querySelector('.featured-grid');
    const projectCards = document.querySelectorAll('.project-card');
    results.projectCardCount = projectCards.length;
    results.featuredGridColumns = featuredGrid ? window.getComputedStyle(featuredGrid).gridTemplateColumns : null;

    // ── Tool section after Supabase load ──
    const toolSection = document.getElementById('tools-section');
    results.toolSectionDisplay = toolSection ? toolSection.style.display : 'not found';

    // ── About / testimonials ──
    results.aboutSectionExists = !!document.querySelector('.about-strip');
    results.testimonialGrid = !!document.querySelector('.testimonials-grid');

    // ── Nav ──
    const nav = document.querySelector('nav');
    results.navBackdrop = nav ? window.getComputedStyle(nav).backdropFilter : null;
    results.navPosition = nav ? window.getComputedStyle(nav).position : null;

    // ── Check all visible text readability (look for very small font sizes) ──
    const allText = document.querySelectorAll('p, span, li, h1, h2, h3, h4');
    const smallText = [];
    allText.forEach(el => {
      const size = parseFloat(window.getComputedStyle(el).fontSize);
      if (size < 10 && window.getComputedStyle(el).display !== 'none') {
        smallText.push({ tag: el.tagName, class: el.className.slice(0,50), size });
      }
    });
    results.smallTextElements = smallText.length;

    // ── Check button styles ──
    const btns = document.querySelectorAll('.btn, button');
    results.buttonCount = btns.length;
    const firstBtn = btns[0];
    if (firstBtn) {
      const s = window.getComputedStyle(firstBtn);
      results.firstBtnPadding = s.padding;
      results.firstBtnBorderRadius = s.borderRadius;
    }

    // ── Check for any visible overflow clipping ──
    const overflowHiddenWithChildren = [];
    document.querySelectorAll('*').forEach(el => {
      const s = window.getComputedStyle(el);
      if ((s.overflow === 'hidden' || s.overflowX === 'hidden') && el.scrollWidth > el.clientWidth + 2) {
        overflowHiddenWithChildren.push(el.className.slice(0, 60));
      }
    });
    results.clippedElements = overflowHiddenWithChildren.slice(0, 10);

    // ── Check marquee/ticker ──
    results.marqueeExists = !!document.querySelector('.marquee-wrapper, .marquee, .ticker');

    // ── Check scroll indicator ──
    results.scrollIndicatorExists = !!document.querySelector('.scroll-hint, .scroll-indicator, .scroll-arrow');

    // ── Check CLI terminal ──
    results.cliExists = !!document.querySelector('#cli-panel, .cli-panel');

    // ── Particle canvas present ──
    results.particleCanvasPresent = !!document.getElementById('hero-canvas');

    // ── Check image loading status ──
    const allImgs = Array.from(document.querySelectorAll('img'));
    const brokenImgs = allImgs.filter(img => !img.complete || img.naturalWidth === 0);
    results.brokenImageCount = brokenImgs.length;
    results.brokenImageSrcs = brokenImgs.slice(0, 5).map(img => img.src.split('/').pop());

    return results;
  });

  console.log('\n=== DEEP AUDIT ===');
  console.log(JSON.stringify(deepAudit, null, 2));
  
  // Scroll down slowly and re-check testimonials/tools
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
  await new Promise(r => setTimeout(r, 3000));
  
  const afterScroll = await page.evaluate(() => {
    return {
      toolItemsAfterScroll: document.querySelectorAll('.tool-item').length,
      toolSectionDisplay: document.getElementById('tools-section')?.style.display,
      testimonialsAfterScroll: document.querySelectorAll('.testimonial-card, .testimonial').length,
    };
  });

  console.log('\n=== AFTER SCROLL ===');
  console.log(JSON.stringify(afterScroll, null, 2));

  await browser.close();
})();
