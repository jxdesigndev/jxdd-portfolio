const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 19102;
const BASE = `http://localhost:${PORT}`;
// Use local scratch dir
const ARTIFACTS = '/home/jx/Documents/JX/jxdd-portfolio/aww_shots';
fs.mkdirSync(ARTIFACTS, { recursive: true });

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

const pages = [
    { name: 'index', url: '/', wait: 5000 },
    { name: 'about', url: '/about.html', wait: 3000 },
    { name: 'work', url: '/work.html', wait: 3000 },
    { name: 'services', url: '/services.html', wait: 3000 },
    { name: 'contact', url: '/contact.html', wait: 3000 },
    { name: 'project', url: '/project.html?slug=zenflow', wait: 3000 },
];

const viewports = [
    { w: 375, h: 812 },
    { w: 1440, h: 900 },
];

async function main() {
    server.listen(PORT);
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--ignore-certificate-errors', '--disable-web-security'],
    });

    for (const vp of viewports) {
        const page = await browser.newPage();
        await page.setViewport({ width: vp.w, height: vp.h });
        for (const pg of pages) {
            await page.goto(`${BASE}${pg.url}`, { waitUntil: 'networkidle0', timeout: 30000 });
            await new Promise(r => setTimeout(r, pg.wait));
            const outPath = `${ARTIFACTS}/${pg.name}_${vp.w}.png`;
            await page.screenshot({ path: outPath, fullPage: true });
            console.log(`DONE: ${pg.name} @ ${vp.w}px -> ${outPath}`);
        }
        await page.close();
    }

    await browser.close();
    server.close();
    console.log('ALL SCREENSHOTS COMPLETE');
}

main().catch(err => { console.error(err); process.exit(1); });
