const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 2500 });
  await page.goto('file:///home/jx/Documents/JX/jxdd-portfolio/projects/zenflow.html', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/home/jx/.gemini/antigravity/brain/4c64f8e8-4ff9-49f0-913d-5609635902fa/zenflow_preview.jpg' });
  await browser.close();
  console.log('Screenshot saved.');
})();
