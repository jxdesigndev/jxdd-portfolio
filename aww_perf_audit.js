// Lightweight Lighthouse-style audit using puppeteer + performance API
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 19101;
const BASE = `http://localhost:${PORT}`;

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? '/index.html' : req.url.split('?')[0]);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const mimeTypes = {
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.html': 'text/html',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.woff2': 'font/woff2',
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        res.end(fs.readFileSync(filePath));
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

async function measurePage(browser, url, label, viewport) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    
    // Clear cache each time
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCache');
    
    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    const ttLoad = Date.now() - startTime;
    
    const metrics = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        const fcp = paint.find(p => p.name === 'first-contentful-paint');
        const lcp = performance.getEntriesByType('largest-contentful-paint').slice(-1)[0];
        
        // Resources
        const resources = performance.getEntriesByType('resource');
        const totalTransfer = resources.reduce((acc, r) => acc + (r.transferSize || 0), 0);
        const totalResources = resources.length;
        
        // Scripts
        const scripts = resources.filter(r => r.initiatorType === 'script');
        const totalScriptSize = scripts.reduce((acc, r) => acc + (r.transferSize || 0), 0);
        
        // Images
        const images = resources.filter(r => r.initiatorType === 'img');
        const totalImageSize = images.reduce((acc, r) => acc + (r.transferSize || 0), 0);
        
        // Check for JS errors
        return {
            domContentLoaded: Math.round(nav?.domContentLoadedEventEnd - nav?.startTime),
            loadEvent: Math.round(nav?.loadEventEnd - nav?.startTime),
            fcp: fcp ? Math.round(fcp.startTime) : null,
            lcp: lcp ? Math.round(lcp.startTime) : null,
            totalTransferKB: Math.round(totalTransfer / 1024),
            totalResources,
            totalScriptSizeKB: Math.round(totalScriptSize / 1024),
            totalImageSizeKB: Math.round(totalImageSize / 1024),
            numScripts: scripts.length,
            numImages: images.length,
        };
    });
    
    // Check accessibility basics
    const a11y = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const missingAlt = images.filter(img => !img.alt && !img.getAttribute('aria-hidden')).length;
        
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
        const unlabeledButtons = buttons.filter(b => !b.textContent.trim() && !b.getAttribute('aria-label')).length;
        
        const links = Array.from(document.querySelectorAll('a'));
        const unlabeledLinks = links.filter(l => !l.textContent.trim() && !l.getAttribute('aria-label')).length;
        
        const h1s = document.querySelectorAll('h1').length;
        
        return { missingAlt, unlabeledButtons, unlabeledLinks, h1s };
    });
    
    await page.close();
    
    return { label, viewport: `${viewport.width}x${viewport.height}`, ttLoad, ...metrics, a11y };
}

async function main() {
    server.listen(PORT);
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--ignore-certificate-errors'],
    });
    
    const results = [];
    
    // Desktop
    results.push(await measurePage(browser, `${BASE}/`, 'index (desktop)', { width: 1440, height: 900 }));
    results.push(await measurePage(browser, `${BASE}/about.html`, 'about (desktop)', { width: 1440, height: 900 }));
    results.push(await measurePage(browser, `${BASE}/work.html`, 'work (desktop)', { width: 1440, height: 900 }));
    results.push(await measurePage(browser, `${BASE}/services.html`, 'services (desktop)', { width: 1440, height: 900 }));
    results.push(await measurePage(browser, `${BASE}/contact.html`, 'contact (desktop)', { width: 1440, height: 900 }));
    results.push(await measurePage(browser, `${BASE}/project.html?slug=zenflow`, 'project (desktop)', { width: 1440, height: 900 }));

    // Mobile
    results.push(await measurePage(browser, `${BASE}/`, 'index (mobile)', { width: 375, height: 812 }));
    results.push(await measurePage(browser, `${BASE}/about.html`, 'about (mobile)', { width: 375, height: 812 }));
    results.push(await measurePage(browser, `${BASE}/work.html`, 'work (mobile)', { width: 375, height: 812 }));
    
    console.log('\n====== PERFORMANCE AUDIT ======\n');
    for (const r of results) {
        console.log(`--- ${r.label} [${r.viewport}] ---`);
        console.log(`  FCP:            ${r.fcp}ms`);
        console.log(`  LCP:            ${r.lcp}ms`);
        console.log(`  DOMContentLoaded: ${r.domContentLoaded}ms`);
        console.log(`  Load Event:     ${r.loadEvent}ms`);
        console.log(`  Total Transfer: ${r.totalTransferKB}KB (${r.totalResources} resources)`);
        console.log(`  JS Transfer:    ${r.totalScriptSizeKB}KB (${r.numScripts} scripts)`);
        console.log(`  Image Transfer: ${r.totalImageSizeKB}KB (${r.numImages} images)`);
        console.log(`  A11Y: missing-alt=${r.a11y.missingAlt}, unlabeled-buttons=${r.a11y.unlabeledButtons}, unlabeled-links=${r.a11y.unlabeledLinks}, h1-count=${r.a11y.h1s}`);
        console.log('');
    }
    
    await browser.close();
    server.close();
}

main().catch(err => { console.error(err); process.exit(1); });
