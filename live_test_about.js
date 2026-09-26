const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  const url = 'file://' + path.resolve('about.html');
  await page.goto(url, { waitUntil: 'networkidle0' });
  
  // Wait a moment for animations
  await new Promise(r => setTimeout(r, 1000));
  
  const results = await page.evaluate(() => {
    const data = {};
    
    // 1. Grid Metrics
    const grid = document.querySelector('.dbx-grid-wrapper');
    if (grid) {
      const rect = grid.getBoundingClientRect();
      const style = window.getComputedStyle(grid);
      data.grid = {
        width: rect.width,
        viewportWidth: window.innerWidth,
        isFullWidth: rect.width >= window.innerWidth - 10, // scrollbar allowance
        columns: style.gridTemplateColumns,
        gap: style.gap
      };
      
      const cells = document.querySelectorAll('.dbx-cell');
      data.cells = Array.from(cells).map(c => {
        const cStyle = window.getComputedStyle(c);
        return {
          classes: c.className,
          gridArea: cStyle.gridArea
        };
      });
    }

    // 2. Typography
    const title = document.querySelector('.c-title');
    if (title) {
      const style = window.getComputedStyle(title);
      data.typography = {
        fontSize: style.fontSize,
        textTransform: style.textTransform
      };
    }
    
    const textContainer = document.querySelector('.cell-text');
    if (textContainer) {
      const style = window.getComputedStyle(textContainer);
      data.textPosition = {
        position: style.position,
        top: style.top,
        left: style.left
      };
    }

    // 3. Logo
    const logo = document.querySelector('.logo-text');
    if (logo) {
      const style = window.getComputedStyle(logo);
      data.logo = {
        fill: style.fill,
        stroke: style.stroke
      };
    }
    
    // 4. Backgrounds
    const bg = document.querySelector('.cell-bg');
    if (bg) {
      const style = window.getComputedStyle(bg);
      data.background = {
        filter: style.filter
      };
    }

    return data;
  });

  // Take a screenshot to prove the visual state
  await page.screenshot({ path: 'scratch/about_live_test.png', fullPage: true });
  
  console.log(JSON.stringify(results, null, 2));
  
  await browser.close();
})();
