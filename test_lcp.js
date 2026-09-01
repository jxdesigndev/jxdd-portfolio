const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Emulate mobile for accuracy
  await page.emulate(puppeteer.KnownDevices['iPhone 12']);

  let lcpNodeHTML = null;
  page.on('console', msg => {
    if (msg.text().startsWith('LCP_NODE:')) {
      lcpNodeHTML = msg.text().replace('LCP_NODE:', '').trim();
    }
  });

  await page.evaluateOnNewDocument(() => {
    window.lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry && lastEntry.element) {
        console.log('LCP_NODE:' + lastEntry.element.outerHTML.substring(0, 200));
      }
    });
    window.lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  });

  await page.goto('https://www.jxdesign.dev', { waitUntil: 'networkidle2' });

  // Wait extra time for the loader to finish
  await new Promise(r => setTimeout(r, 6000));

  console.log("Recorded LCP Element:", lcpNodeHTML);
  await browser.close();
})();
