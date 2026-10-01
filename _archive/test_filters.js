const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://www.jxdesign.dev/work.html', { waitUntil: 'networkidle2' });
  
  async function getGridState() {
    return await page.evaluate(() => {
      const cards = document.querySelectorAll('.work-card');
      const empty = document.querySelector('.work-empty');
      return {
        cards: Array.from(cards).map(c => ({ opacity: c.style.opacity, cat: c.dataset.category })),
        empty: empty ? empty.textContent : null
      };
    });
  }

  console.log("Initial load:", await getGridState());

  await page.evaluate(() => document.querySelector('.filter-btn[data-filter="design"]').click());
  await new Promise(r => setTimeout(r, 1000));
  console.log("After clicking Product Design:", await getGridState());

  await page.evaluate(() => document.querySelector('.filter-btn[data-filter="dev"]').click());
  await new Promise(r => setTimeout(r, 1000));
  console.log("After clicking Development:", await getGridState());

  await page.evaluate(() => document.querySelector('.filter-btn[data-filter="all"]').click());
  await new Promise(r => setTimeout(r, 1000));
  console.log("After clicking All:", await getGridState());

  await browser.close();
})();
