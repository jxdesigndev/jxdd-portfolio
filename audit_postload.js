const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-gpu'] });
  
  const viewports = [
    { name: 'desktop_1440', width: 1440, height: 900 },
    { name: 'mobile_390', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('https://www.jxdesign.dev', { waitUntil: 'networkidle2' });
    
    // Wait a long time so loader finishes and all animations play through
    console.log(`${vp.name}: waiting for loader...`);
    await new Promise(r => setTimeout(r, 12000));
    
    // Full page screenshot
    await page.screenshot({ 
      path: `/home/jx/.gemini/antigravity/brain/4c64f8e8-4ff9-49f0-913d-5609635902fa/postload_${vp.name}.png`, 
      fullPage: true 
    });
    console.log(`Captured full page: ${vp.name}`);

    // Also capture just the above-fold view
    await page.screenshot({ 
      path: `/home/jx/.gemini/antigravity/brain/4c64f8e8-4ff9-49f0-913d-5609635902fa/postload_${vp.name}_fold.png`, 
      fullPage: false 
    });
    console.log(`Captured fold: ${vp.name}`);

    await page.close();
  }

  // Now do a section-by-section capture on desktop
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://www.jxdesign.dev', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 12000));

  const sections = [
    { name: 'hero', scroll: 0 },
    { name: 'featured', scroll: 950 },
    { name: 'about', scroll: 2000 },
    { name: 'testimonials', scroll: 2900 },
    { name: 'services', scroll: 3600 },
    { name: 'tools', scroll: 4400 },
    { name: 'footer', scroll: 5200 },
  ];

  for (const s of sections) {
    await page.evaluate(y => window.scrollTo(0, y), s.scroll);
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ 
      path: `/home/jx/.gemini/antigravity/brain/4c64f8e8-4ff9-49f0-913d-5609635902fa/section_${s.name}.png`,
      fullPage: false 
    });
    console.log(`Section captured: ${s.name}`);
  }

  // Also do audit of DOM state post-load
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));

  const postLoadAudit = await page.evaluate(() => {
    const r = {};
    // Hero opacity state
    r.heroNameOpacity = window.getComputedStyle(document.querySelector('.hero-name') || document.createElement('div')).opacity;
    r.heroCTAOpacity = window.getComputedStyle(document.querySelector('.hero-cta-group') || document.createElement('div')).opacity;
    r.heroDescOpacity = window.getComputedStyle(document.querySelector('.hero-desc') || document.createElement('div')).opacity;
    
    // Check for loader overlay still visible
    const loader = document.querySelector('.jx-loader, .loader, #loader, [class*="loader"]');
    r.loaderVisible = loader ? window.getComputedStyle(loader).display !== 'none' && window.getComputedStyle(loader).opacity !== '0' : false;
    r.loaderOpacity = loader ? window.getComputedStyle(loader).opacity : 'no loader';
    
    // Project cards
    r.projectCards = document.querySelectorAll('.project-card').length;
    
    // Tool items
    r.toolItems = document.querySelectorAll('.tool-item').length;
    r.toolSectionDisplay = document.getElementById('tools-section')?.style.display;
    
    // Testimonials
    r.testimonials = document.querySelectorAll('.testimonial-card, .testimonial').length;

    // Scroll to bottom to trigger all lazy loads
    return r;
  });

  console.log('\n=== POST-LOAD STATE ===');
  console.log(JSON.stringify(postLoadAudit, null, 2));

  await browser.close();
  console.log('\nAll done.');
})();
