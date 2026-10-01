const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Inject performance observer to catch LCP
  await page.evaluateOnNewDocument(() => {
    window.lcpCandidate = null;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        window.lcpCandidate = {
          tag: lastEntry.element ? lastEntry.element.tagName : 'unknown',
          id: lastEntry.element ? lastEntry.element.id : 'unknown',
          className: lastEntry.element ? lastEntry.element.className : 'unknown',
          text: lastEntry.element ? lastEntry.element.textContent.slice(0, 30).trim() : 'none',
          time: lastEntry.startTime
        };
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });

  await page.goto('file:///home/jx/Documents/JX/jxdd-portfolio/index.html', { waitUntil: 'networkidle0' });
  
  // Wait a bit just in case
  await new Promise(r => setTimeout(r, 2000));
  
  const lcp = await page.evaluate(() => window.lcpCandidate);
  console.log(JSON.stringify(lcp));
  
  await browser.close();
})();
