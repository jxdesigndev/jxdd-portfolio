const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 19092;
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
        args: ['--no-sandbox']
    });

    const widths = [1920, 1600, 1440, 1200];
    
    for (const w of widths) {
        const page = await browser.newPage();
        await page.setViewport({ width: w, height: 1080 });
        await page.goto(BASE, { waitUntil: 'networkidle0' });
        
        // Wait for GSAP animations to complete (initial load animations)
        await new Promise(r => setTimeout(r, 3000));
        
        const rects = await page.evaluate(() => {
            const hl2 = document.querySelector('#hl-2').getBoundingClientRect();
            const role = document.querySelector('.hero-role').getBoundingClientRect();
            const desc = document.querySelector('.hero-desc').getBoundingClientRect();
            const heroName = document.querySelector('.hero-name').getBoundingClientRect();
            
            return {
                width: window.innerWidth,
                hl2: { top: hl2.top, bottom: hl2.bottom, height: hl2.height },
                role: { top: role.top, bottom: role.bottom, height: role.height },
                desc: { top: desc.top, bottom: desc.bottom, height: desc.height },
                heroName: { top: heroName.top, bottom: heroName.bottom, height: heroName.height }
            };
        });
        
        console.log(`\nWidth: ${w}px`);
        console.log(`- .hero-name bottom: ${rects.heroName.bottom}`);
        console.log(`- #hl-2 bottom:      ${rects.hl2.bottom} (Height: ${rects.hl2.height})`);
        console.log(`- .hero-role top:    ${rects.role.top}`);
        console.log(`- .hero-desc top:    ${rects.desc.top}`);
        
        if (rects.hl2.bottom > rects.role.top) {
            console.log(`=> OVERLAP DETECTED! #hl-2 bottom (${rects.hl2.bottom}) > .hero-role top (${rects.role.top})`);
        } else {
            console.log(`=> No overlap with .hero-role.`);
        }
        
        if (rects.hl2.bottom > rects.desc.top) {
            console.log(`=> OVERLAP DETECTED! #hl-2 bottom (${rects.hl2.bottom}) > .hero-desc top (${rects.desc.top})`);
        } else {
            console.log(`=> No overlap with .hero-desc.`);
        }
        
        await page.close();
    }
    
    await browser.close();
    server.close();
}

main().catch(console.error);
