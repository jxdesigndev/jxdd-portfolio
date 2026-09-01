const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://www.jxdesign.dev/work.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.work-card'));
      const zf = cards.find(c => c.textContent.toLowerCase().includes('zenflow'));
      if (zf) zf.click();
    })
  ]);
  
  console.log("Navigated URL:", page.url());
  await page.screenshot({ path: '/home/jx/.gemini/antigravity/brain/4c64f8e8-4ff9-49f0-913d-5609635902fa/zenflow_live.png' });
  
  await browser.close();
})();
