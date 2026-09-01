const puppeteer = require('puppeteer');
const fs = require('fs');

async function runAudit() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const results = {
    loads: {},
    console: {},
    network: {},
    splitText: false,
    scrollProgress: false,
    cliButton: false,
    webGL: false,
    navLinks: false,
    adminPanel: false,
    responsiveness: {},
    supabaseQuery: null,
    rlsWrite: null,
    storageWrite: null,
    skipToContent: false,
    jsonLD: {},
    canonical: {},
  };

  const pagesToTest = [
    { url: 'https://www.jxdesign.dev/', name: 'index' },
    { url: 'https://www.jxdesign.dev/about.html', name: 'about' },
    { url: 'https://www.jxdesign.dev/work.html', name: 'work' },
    { url: 'https://www.jxdesign.dev/services.html', name: 'services' },
    { url: 'https://www.jxdesign.dev/contact.html', name: 'contact' },
    { url: 'https://www.jxdesign.dev/project.html?slug=zenflow', name: 'project' },
    { url: 'https://www.jxdesign.dev/admin.html', name: 'admin' },
    { url: 'https://www.jxdesign.dev/nonsense-url-404', name: '404' }
  ];

  for (const p of pagesToTest) {
    results.console[p.name] = [];
    results.network[p.name] = [];
    
    const page = await browser.newPage();
    
    page.on('console', msg => {
      results.console[p.name].push({ type: msg.type(), text: msg.text() });
    });
    
    page.on('response', resp => {
      if (resp.status() >= 400 && resp.url().startsWith('https://www.jxdesign.dev')) {
        results.network[p.name].push({ url: resp.url(), status: resp.status() });
      }
    });

    try {
      const response = await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 30000 });
      results.loads[p.name] = response.ok() || response.status() === 404; // 404 is expected for nonsense
      
      // SEO & A11y tests
      const seoData = await page.evaluate(() => {
        const canonical = document.querySelector('link[rel="canonical"]');
        const jsonLD = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => s.innerText);
        const skipLink = document.querySelector('.skip-to-content');
        return {
          canonical: canonical ? canonical.href : null,
          jsonLD: jsonLD,
          hasSkipLink: !!skipLink
        };
      });
      
      results.canonical[p.name] = seoData.canonical;
      results.jsonLD[p.name] = seoData.jsonLD;
      if (seoData.hasSkipLink) results.skipToContent = true;

      // Special tests based on page
      if (p.name === 'index') {
        // SplitText check
        results.splitText = await page.evaluate(() => {
          const title = document.querySelector('#wh-title');
          return title && title.querySelectorAll('div').length > 0;
        });

        // WebGL check
        results.webGL = await page.evaluate(() => {
          return !!document.querySelector('canvas') && typeof THREE !== 'undefined';
        });

        // Scroll Progress
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await new Promise(r => setTimeout(r, 500));
        results.scrollProgress = await page.evaluate(() => {
          const bar = document.querySelector('#jx-scroll-progress');
          return bar && bar.style.transform.includes('scaleX') && parseFloat(bar.style.transform.match(/scaleX\(([^)]+)\)/)[1]) > 0;
        });

        // Backend RLS / Storage unauthorized test
        results.supabaseQuery = await page.evaluate(async () => {
          if (!window.supabase) return 'No window.supabase';
          const { data, error } = await window.supabase.from('projects').select('*').limit(1);
          return { data, error };
        });

        results.rlsWrite = await page.evaluate(async () => {
          if (!window.supabase) return 'No window.supabase';
          const { data, error } = await window.supabase.from('projects').insert([{ title: 'Hack', slug: 'hack' }]);
          return { data, error };
        });

        results.storageWrite = await page.evaluate(async () => {
          if (!window.supabase) return 'No window.supabase';
          const blob = new Blob(['test'], { type: 'text/plain' });
          const { data, error } = await window.supabase.storage.from('portfolio_media').upload('hack.txt', blob);
          return { data, error };
        });
      }

      if (p.name === 'admin') {
        // Just verify it loads and shows login
        results.adminPanel = await page.evaluate(() => {
          return !!document.querySelector('#login-container');
        });
      }

      // Responsiveness test (Home, About, Work, Project)
      if (['index', 'about', 'work', 'project'].includes(p.name)) {
        results.responsiveness[p.name] = {};
        const widths = [375, 768, 1024, 1440];
        for (const w of widths) {
          await page.setViewport({ width: w, height: 800 });
          await new Promise(r => setTimeout(r, 500));
          
          if (w === 768 && p.name === 'index') {
             results.cliButton = await page.evaluate(() => {
               const btn = document.querySelector('#mobile-cli-btn');
               return btn && window.getComputedStyle(btn).display !== 'none';
             });
          }

          // Check for horizontal overflow
          const overflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
          });
          results.responsiveness[p.name][w] = { hasHorizontalOverflow: overflow };
          
          await page.screenshot({ path: `screenshot_${p.name}_${w}.png`, fullPage: true });
        }
      }

    } catch (e) {
      console.error('Error on ' + p.name, e);
      results.loads[p.name] = false;
    }
    await page.close();
  }

  fs.writeFileSync('audit_results.json', JSON.stringify(results, null, 2));
  await browser.close();
  console.log('Audit completed.');
}

runAudit();
