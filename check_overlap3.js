const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 19094;
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

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1080 });
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    
    await new Promise(r => setTimeout(r, 3000));
    
    // First, check overlap
    let rects = await page.evaluate(() => {
        const hl2 = document.querySelector('#hl-2').getBoundingClientRect();
        const role = document.querySelector('.hero-role').getBoundingClientRect();
        return { hl2Bottom: hl2.bottom, roleTop: role.top };
    });
    console.log(`Original: #hl-2 bottom: ${rects.hl2Bottom}, .hero-role top: ${rects.roleTop}`);
    
    // Remove transform
    await page.evaluate(() => {
        document.querySelectorAll('.hero-name-line').forEach(el => {
            el.style.transform = 'none';
        });
    });
    
    rects = await page.evaluate(() => {
        const hl2 = document.querySelector('#hl-2').getBoundingClientRect();
        const role = document.querySelector('.hero-role').getBoundingClientRect();
        return { hl2Bottom: hl2.bottom, roleTop: role.top };
    });
    console.log(`After removing transform: #hl-2 bottom: ${rects.hl2Bottom}, .hero-role top: ${rects.roleTop}`);
    
    await browser.close();
    server.close();
}

main().catch(console.error);
