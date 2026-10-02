const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE ERROR] ${err.toString()}`));

  console.log("Loading homepage...");
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
  
  // 1. Initial State
  const initialCursorData = await page.evaluate(() => {
    const cursors = ['.cursor', '.cursor-ring', '.cursor-aura'];
    const data = {};
    cursors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) {
        const style = window.getComputedStyle(el);
        data[sel] = {
          exists: true,
          display: style.display,
          opacity: style.opacity,
          visibility: style.visibility,
          transform: style.transform,
          left: style.left,
          top: style.top
        };
      } else {
        data[sel] = { exists: false };
      }
    });
    return data;
  });
  
  console.log("--- Initial Cursor State ---");
  console.log(JSON.stringify(initialCursorData, null, 2));

  // 2. Mouse Move
  console.log("Moving mouse to (100, 100)...");
  await page.mouse.move(100, 100);
  await new Promise(r => setTimeout(r, 500));
  
  console.log("Moving mouse to (500, 500)...");
  await page.mouse.move(500, 500, { steps: 10 });
  await new Promise(r => setTimeout(r, 500));
  
  const movedCursorData = await page.evaluate(() => {
    const cursors = ['.cursor', '.cursor-ring', '.cursor-aura'];
    const data = {};
    cursors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) {
        const style = window.getComputedStyle(el);
        data[sel] = {
          transform: style.transform,
          left: style.left,
          top: style.top
        };
      }
    });
    return data;
  });

  console.log("--- Moved Cursor State ---");
  console.log(JSON.stringify(movedCursorData, null, 2));

  console.log("--- Console Logs ---");
  logs.forEach(l => console.log(l));

  await browser.close();
})();
