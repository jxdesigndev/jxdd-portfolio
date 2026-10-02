const puppeteer = require('puppeteer');
const fs = require('fs');

const OUT_DIR = '/home/jx/.gemini/antigravity/brain/4c64f8e8-4ff9-49f0-913d-5609635902fa/';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  // Helper to tab and screenshot
  async function tabAndScreenshot(url, namePrefix, numTabs) {
    await page.goto(url, { waitUntil: 'networkidle2' });
    // Wait for initial animations to settle
    await new Promise(r => setTimeout(r, 2000));
    
    for (let i = 1; i <= numTabs; i++) {
      await page.keyboard.press('Tab');
      await new Promise(r => setTimeout(r, 500)); // wait for focus ring to appear
      await page.screenshot({ path: `${OUT_DIR}${namePrefix}-tab${i}.png` });
    }
  }

  console.log("Taking homepage screenshots...");
  await tabAndScreenshot('http://localhost:4173/', 'home', 4);

  console.log("Taking about page screenshots...");
  await tabAndScreenshot('http://localhost:4173/about.html', 'about', 4);

  console.log("Taking contact page screenshots...");
  // For contact, we might need to tab more to reach the social links, or just evaluate focus directly
  await page.goto('http://localhost:4173/contact.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Make social links visible for the test so we can focus them
  await page.evaluate(() => {
    document.querySelectorAll('.contact-social-link').forEach(el => {
      el.style.display = 'block';
      el.href = '#test'; // Make them focusable
    });
  });
  
  for (let i = 1; i <= 6; i++) {
    await page.keyboard.press('Tab');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `${OUT_DIR}contact-tab${i}.png` });
  }

  await browser.close();
  console.log("Done.");
})();
