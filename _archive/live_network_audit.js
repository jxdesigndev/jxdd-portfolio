const fs = require('fs');

async function auditNetwork() {
  const pages = ['/', '/about.html', '/work.html', '/contact.html', '/services.html'];
  const base = 'https://jxdesign.dev';
  
  for (const p of pages) {
    const url = base + p;
    console.log(`\n=== Fetching ${url} ===`);
    try {
      const start = Date.now();
      const res = await fetch(url, { headers: { 'Accept-Encoding': 'gzip, deflate, br' } });
      const ttfb = Date.now() - start;
      const html = await res.text();
      
      console.log(`Status: ${res.status}`);
      console.log(`TTFB: ${ttfb}ms`);
      
      // Extract links to check
      const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]);
      const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
      const css = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^"]*)"/g)].map(m => m[1]);
      
      console.log(`Found Assets: ${imgs.length} Images, ${scripts.length} Scripts, ${css.length} CSS files.`);
      
      // Let's verify a few critical assets
      const assets = [...new Set([...imgs, ...scripts, ...css])].filter(a => !a.startsWith('http') && !a.startsWith('//'));
      for (const a of assets) {
        const aUrl = base + (a.startsWith('/') ? a : '/' + a);
        const aRes = await fetch(aUrl, { method: 'HEAD' });
        if (aRes.status >= 400) {
          console.log(`❌ BROKEN LINK: ${aUrl} (${aRes.status})`);
        }
      }
      
    } catch(e) {
      console.log(`Error: ${e.message}`);
    }
  }
}
auditNetwork();
