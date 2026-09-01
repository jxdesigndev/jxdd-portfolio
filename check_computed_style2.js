const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 19096;
const BASE = `http://localhost:${PORT}`;

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? '/index.html' : req.url.split('?')[0]);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.writeHead(200);
        res.end(fs.readFileSync(filePath));
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

async function main() {
    server.listen(PORT);
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--ignore-certificate-errors'] // FIX FOR CDN SSL
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1080 });
    
    // Capture console logs to see if there are any errors
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    
    // Wait for GSAP animations to complete
    await new Promise(r => setTimeout(r, 4000));
    
    const computed = await page.evaluate(() => {
        const hl1 = document.querySelector('#hl-1');
        const hl2 = document.querySelector('#hl-2');
        const role = document.querySelector('.hero-role');
        
        return {
            hl1: {
                transform: window.getComputedStyle(hl1).transform,
                opacity: window.getComputedStyle(hl1).opacity,
                bottom: hl1.getBoundingClientRect().bottom
            },
            hl2: {
                transform: window.getComputedStyle(hl2).transform,
                opacity: window.getComputedStyle(hl2).opacity,
                bottom: hl2.getBoundingClientRect().bottom
            },
            roleTop: role ? role.getBoundingClientRect().top : null,
            hasSplitText: !!window.SplitText,
            hasGSAP: !!window.gsap
        };
    });
    
    console.log('\n--- COMPUTED STYLES (After 4s) ---');
    console.log(`GSAP loaded: ${computed.hasGSAP}`);
    console.log(`SplitText loaded on window: ${computed.hasSplitText}`);
    console.log(`\n#hl-1:`);
    console.log(`  Transform: ${computed.hl1.transform}`);
    console.log(`  Opacity:   ${computed.hl1.opacity}`);
    console.log(`  Bottom Y:  ${computed.hl1.bottom}`);
    
    console.log(`\n#hl-2:`);
    console.log(`  Transform: ${computed.hl2.transform}`);
    console.log(`  Opacity:   ${computed.hl2.opacity}`);
    console.log(`  Bottom Y:  ${computed.hl2.bottom}`);
    
    console.log(`\n.hero-role Top Y: ${computed.roleTop}`);
    
    if (computed.hl2.bottom > computed.roleTop) {
        console.log(`\n=> OVERLAP DETECTED! #hl-2 bottom (${computed.hl2.bottom}) > .hero-role top (${computed.roleTop})`);
    } else {
        console.log(`\n=> NO OVERLAP. Everything is positioned correctly.`);
    }
    
    await browser.close();
    server.close();
}

main().catch(console.error);
