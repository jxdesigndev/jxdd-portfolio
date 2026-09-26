const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = '/home/jx/Documents/JX/jxdd-portfolio';

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url.split('?')[0] === '/' ? '/about.html' : req.url.split('?')[0]);
  const ext = path.extname(filePath);
  const types = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript',
                  '.webp':'image/webp', '.jpg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml' };
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});

server.listen(8889, async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('pageerror', e => errors.push('JS: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('Console: ' + m.text()); });

  await page.goto('http://localhost:8889/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ROOT, 'v71_t0.png') });

  await new Promise(r => setTimeout(r, 3500));
  await page.screenshot({ path: path.join(ROOT, 'v71_t4s.png') });

  // Check DOM state
  const state = await page.evaluate(() => {
    const logoTile  = document.getElementById('tile-logo');
    const origin    = document.getElementById('tile-origin');
    const philosophy = document.getElementById('tile-philosophy');
    const getStyle = el => {
      if (!el) return null;
      const s = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { opacity: s.opacity, transform: s.transform, left: s.left, top: s.top,
               rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
    };
    return {
      logoTile: getStyle(logoTile),
      origin:   getStyle(origin),
      philosophy: getStyle(philosophy),
      bodyOverflow: document.body.style.overflow,
      jxSupabaseDefined: typeof window.jxSupabase !== 'undefined',
      supabaseClientDefined: typeof window.supabaseClient !== 'undefined',
      originGridHTML: (document.getElementById('origin-grid') || {}).innerHTML || '',
    };
  });
  console.log('=== STATE ===');
  console.log(JSON.stringify(state, null, 2));
  console.log('=== ERRORS ===');
  errors.forEach(e => console.log(e));

  // Scroll and check assembly
  await page.evaluate(() => window.scrollTo(0, 1200));
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ROOT, 'v71_scroll.png') });

  await browser.close();
  server.close();
});
