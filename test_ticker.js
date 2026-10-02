const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
  
  const tickData = await page.evaluate(() => {
    return new Promise(resolve => {
      if (!window.gsap) return resolve('no gsap');
      
      let calls = 0;
      let data = [];
      const cb = (time, deltaTime, frame, elapsed) => {
        data.push({ time, deltaTime, frame, elapsed });
        calls++;
        if (calls >= 3) {
          window.gsap.ticker.remove(cb);
          resolve(data);
        }
      };
      window.gsap.ticker.add(cb);
    });
  });
  
  console.log("Ticker data:", JSON.stringify(tickData, null, 2));

  await browser.close();
})();
