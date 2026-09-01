const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 19093;
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
    
    const info = await page.evaluate(() => {
        const hl2 = document.querySelector('#hl-2');
        const heroName = document.querySelector('.hero-name');
        
        return {
            heroName: {
                html: heroName.outerHTML,
                height: heroName.getBoundingClientRect().height,
                display: window.getComputedStyle(heroName).display
            },
            hl2: {
                height: hl2.getBoundingClientRect().height,
                display: window.getComputedStyle(hl2).display,
                position: window.getComputedStyle(hl2).position
            }
        };
    });
    
    console.log(`heroName html:\n${info.heroName.html}\n`);
    console.log(`heroName display: ${info.heroName.display}, height: ${info.heroName.height}`);
    console.log(`hl2 display: ${info.hl2.display}, position: ${info.hl2.position}, height: ${info.hl2.height}`);
    
    await browser.close();
    server.close();
}

main().catch(console.error);
