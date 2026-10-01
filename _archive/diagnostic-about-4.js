const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1200, height: 2000 });
  await page.goto('http://localhost:4173/about.html', { waitUntil: 'networkidle0' });
  
  await new Promise(r => setTimeout(r, 5000)); // wait 5 full seconds
  
  await page.screenshot({ path: '/home/jx/Documents/JX/jxdd-portfolio/about-arsenal-test.png', fullPage: true });

  await browser.close();
})();
