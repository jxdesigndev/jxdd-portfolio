const puppeteer = require('puppeteer');
const fs = require('fs');
const http = require('http');
const path = require('path');

// Basic server to serve the local files
const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? '/about.html' : req.url);
  filePath = filePath.split('?')[0]; // strip query strings
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(200);
      res.end(content);
    }
  });
});

server.listen(9090, async () => {
  console.log("Local server running on 9090");
  
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:9090/about.html', { waitUntil: 'networkidle2' });

  // Evaluate the current state
  const data = await page.evaluate(() => {
    const hero = document.querySelector('.hero-cell');
    const heroRect = hero ? hero.getBoundingClientRect() : null;
    
    const grid = document.querySelector('.dbx-grid');
    const gridRect = grid ? grid.getBoundingClientRect() : null;

    const cells = Array.from(document.querySelectorAll('.content-cell')).map(c => {
      const rect = c.getBoundingClientRect();
      const style = window.getComputedStyle(c);
      return {
        route: c.getAttribute('data-route'),
        y: rect.y,
        opacity: style.opacity,
        transform: style.transform
      };
    });

    return {
      heroRect,
      gridRect,
      cells,
      hasGridlines: !!document.querySelector('.tile-line, .grid-line')
    };
  });

  console.log(JSON.stringify(data, null, 2));

  await browser.close();
  server.close();
});
