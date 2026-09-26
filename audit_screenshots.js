const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-gpu'] });
  
  const viewports = [
    { name: 'desktop_1440', width: 1440, height: 900 },
    { name: 'laptop_1280', width: 1280, height: 800 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'mobile_390', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('https://www.jxdesign.dev', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: `/home/jx/.gemini/antigravity/brain/4c64f8e8-4ff9-49f0-913d-5609635902fa/audit_${vp.name}.png`, fullPage: true });
    console.log(`Captured ${vp.name}`);
    await page.close();
  }

  await browser.close();
  console.log('All screenshots done.');
})();
