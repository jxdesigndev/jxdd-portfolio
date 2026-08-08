const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE_URL = 'https://jxdesigndev.vercel.app';
const REPORT_FILE = 'live_audit_results.json';

const report = {
  desktop: { pages: {}, errors: [], animations: {}, form: {}, projects: {} },
  mobile: { pages: {}, errors: [], animations: {}, form: {}, projects: {} }
};

async function measureFPS(page, actionFn, durationMs = 2000) {
  await page.evaluate(() => {
    window.__fps_frames = 0;
    window.__fps_lastTime = performance.now();
    window.__fps_rafId = null;
    function loop(time) {
      window.__fps_frames++;
      window.__fps_rafId = requestAnimationFrame(loop);
    }
    window.__fps_rafId = requestAnimationFrame(loop);
  });
  
  await actionFn();
  await new Promise(r => setTimeout(r, durationMs));
  
  const fps = await page.evaluate(() => {
    cancelAnimationFrame(window.__fps_rafId);
    const duration = performance.now() - window.__fps_lastTime;
    return (window.__fps_frames / duration) * 1000;
  });
  return Math.round(fps);
}

async function runAudit(viewportName, width, height) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const vReport = report[viewportName];

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    
    page.on('console', msg => {
      vReport.errors.push(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    page.on('pageerror', e => vReport.errors.push(`[PAGE ERROR] ${e.message}`));
    
    // ==========================================
    // 1. INDEX PAGE (Animations, CLI, Pong)
    // ==========================================
    console.log(`[${viewportName}] Testing Index...`);
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4000)); // wait for boot sequence
    
    // Measure scroll FPS
    const scrollFps = await measureFPS(page, async () => {
      await page.evaluate(() => window.scrollBy({ top: 2000, behavior: 'smooth' }));
      await new Promise(r => setTimeout(r, 1000));
      await page.evaluate(() => window.scrollBy({ top: -2000, behavior: 'smooth' }));
    }, 2000);
    vReport.animations.scrollFps = scrollFps;

    // Test Audio Toggle
    console.log(`[${viewportName}] Testing Audio...`);
    if (viewportName === 'desktop') {
      await page.evaluate(() => document.getElementById('nav-audio-toggle')?.click());
      await new Promise(r => setTimeout(r, 1000));
      vReport.pages.indexAudio = await page.evaluate(() => !!document.getElementById('jx-audio-toast'));
    }

    // Test CLI
    console.log(`[${viewportName}] Testing CLI...`);
    const cliBtnVisible = await page.evaluate(() => {
      const btn = document.getElementById('cli-trigger');
      if(!btn) return false;
      const style = window.getComputedStyle(btn);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    if (cliBtnVisible) {
      await page.evaluate(() => document.getElementById('cli-trigger').click());
      await new Promise(r => setTimeout(r, 1000));
      await page.type('#cli-input', 'help');
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 1000));
      vReport.pages.cliHelp = await page.evaluate(() => document.getElementById('cli-output').innerHTML);
      
      await page.type('#cli-input', 'nonsense_command');
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 1000));
      vReport.pages.cliNonsense = await page.evaluate(() => document.getElementById('cli-output').innerHTML);
      
      await page.evaluate(() => document.getElementById('cli-close').click());
      await new Promise(r => setTimeout(r, 1000));
    } else {
      vReport.pages.cliVisible = false;
    }

    // Test Pong
    console.log(`[${viewportName}] Testing Pong...`);
    if (cliBtnVisible) {
      await page.evaluate(() => document.getElementById('cli-trigger').click());
      await new Promise(r => setTimeout(r, 1000));
      await page.type('#cli-input', 'pong');
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 3000));
      const isPongActive = await page.evaluate(() => document.body.classList.contains('pong-active'));
      vReport.animations.pongActive = isPongActive;
      if (isPongActive) {
         await page.keyboard.down('ArrowUp');
         await new Promise(r => setTimeout(r, 500));
         await page.keyboard.up('ArrowUp');
         await page.evaluate(() => document.getElementById('pong-close-btn').click());
         await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Test Hamburger (Mobile)
    if (viewportName === 'mobile') {
      console.log(`[${viewportName}] Testing Hamburger...`);
      await page.evaluate(() => document.getElementById('nav-hamburger').click());
      await new Promise(r => setTimeout(r, 1000));
      vReport.pages.mobileMenuOpen = await page.evaluate(() => document.getElementById('mobile-menu').classList.contains('open'));
      await page.evaluate(() => document.getElementById('nav-hamburger').click());
      await new Promise(r => setTimeout(r, 1000));
    }

    // ==========================================
    // 2. ABOUT PAGE
    // ==========================================
    console.log(`[${viewportName}] Testing About...`);
    await page.goto(`${BASE_URL}/about.html`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    vReport.pages.aboutScroll = await measureFPS(page, async () => {
      await page.evaluate(() => window.scrollBy({ top: 1500, behavior: 'smooth' }));
    }, 2000);

    // ==========================================
    // 3. SERVICES PAGE
    // ==========================================
    console.log(`[${viewportName}] Testing Services...`);
    await page.goto(`${BASE_URL}/services.html`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    vReport.pages.servicesCTAClick = await page.evaluate(() => {
      const cta = document.querySelector('.services-cta a.btn');
      return !!cta;
    });

    // ==========================================
    // 4. WORK PAGE (Modals & Filters)
    // ==========================================
    console.log(`[${viewportName}] Testing Work...`);
    await page.goto(`${BASE_URL}/work.html`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Filters
    await page.evaluate(() => {
      const filters = document.querySelectorAll('.filter-btn');
      if (filters.length > 1) filters[1].click();
    });
    await new Promise(r => setTimeout(r, 1000));
    vReport.projects.filterWorked = await page.evaluate(() => {
       const visibleCards = Array.from(document.querySelectorAll('.work-card')).filter(c => c.style.opacity === "1");
       return visibleCards.length;
    });
    await page.evaluate(() => {
      document.querySelector('.filter-btn[data-filter="all"]')?.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Modal
    const hasCards = await page.evaluate(() => document.querySelectorAll('.work-card').length > 0);
    if (hasCards) {
      await page.evaluate(() => document.querySelector('.work-card').click());
      await new Promise(r => setTimeout(r, 2000));
      vReport.projects.modalOpen = await page.evaluate(() => !!document.querySelector('.vault-modal-overlay'));
      vReport.projects.modalData = await page.evaluate(() => {
         const m = document.querySelector('.vault-modal');
         if(!m) return null;
         return {
           title: m.querySelector('.modal-title')?.textContent,
           role: m.querySelector('.modal-meta-value')?.textContent,
           hasImage: !!m.querySelector('.modal-img'),
           hasLink: !!m.querySelector('.modal-link')
         };
      });
      // Try scrolling inside modal
      await page.evaluate(() => {
        const m = document.querySelector('.vault-modal');
        if (m) m.scrollTop = 500;
      });
      await new Promise(r => setTimeout(r, 500));
      vReport.projects.modalScrollTop = await page.evaluate(() => document.querySelector('.vault-modal')?.scrollTop);
      
      await page.evaluate(() => document.querySelector('.modal-close-btn')?.click());
      await new Promise(r => setTimeout(r, 1000));
      vReport.projects.modalClosed = await page.evaluate(() => !document.querySelector('.vault-modal-overlay'));
    }

    // ==========================================
    // 5. CONTACT PAGE (Form Submit)
    // ==========================================
    console.log(`[${viewportName}] Testing Contact...`);
    await page.goto(`${BASE_URL}/contact.html`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Test Invalid Submit
    await page.evaluate(() => {
      document.getElementById('cf-name').value = '';
      document.getElementById('cf-email').value = 'not-an-email';
      document.getElementById('form-submit').click();
    });
    await new Promise(r => setTimeout(r, 500));
    vReport.form.invalidState = await page.evaluate(() => {
       const emailInvalid = document.getElementById('cf-email').getAttribute('aria-invalid');
       const nameInvalid = document.getElementById('cf-name').getAttribute('aria-invalid');
       return { email: emailInvalid, name: nameInvalid };
    });

    // Test Valid Submit (Test Data)
    await page.evaluate(() => {
      document.getElementById('cf-name').value = 'Live Test AI Bot';
      document.getElementById('cf-email').value = 'test@example.com';
      document.getElementById('cf-message').value = '[TEST DATA] Automated QA live submission checking Supabase integration.';
      document.getElementById('form-submit').click();
    });
    
    // Wait for network response (max 5s)
    let statusMsg = '';
    for(let i=0; i<10; i++) {
      await new Promise(r => setTimeout(r, 500));
      const isVisible = await page.evaluate(() => {
         const s = document.getElementById('form-status');
         return s && s.style.display !== 'none' && window.getComputedStyle(s).display !== 'none';
      });
      if(isVisible) {
        statusMsg = await page.evaluate(() => document.getElementById('form-status').textContent);
        break;
      }
    }
    vReport.form.validState = statusMsg;

  } catch (err) {
    vReport.errors.push(`[FATAL] ${err.message}`);
  } finally {
    await browser.close();
  }
}

(async () => {
  await runAudit('mobile', 375, 812);
  fs.writeFileSync('live_audit_results_mobile.json', JSON.stringify(report.mobile, null, 2));
  console.log('Audit complete.');
})();
