const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  console.log("Navigating to work.html...");
  await page.goto('https://www.jxdesign.dev/work.html', { waitUntil: 'networkidle2' });
  
  console.log("Looking for Zenflow card...");
  // Try to find the link for Zenflow
  const zenflowLink = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const zf = links.find(a => a.href.includes('zenflow') || (a.textContent && a.textContent.toLowerCase().includes('zenflow')));
    return zf ? zf.href : null;
  });
  
  console.log("Found Zenflow link href:", zenflowLink);
  
  if (zenflowLink) {
    console.log("Clicking the link...");
    await page.goto(zenflowLink, { waitUntil: 'networkidle2' });
    console.log("Arrived at:", page.url());
    await page.screenshot({ path: 'zenflow_click_result.png' });
  } else {
    console.log("Could not find Zenflow link.");
    await page.screenshot({ path: 'zenflow_work_page.png' });
  }
  
  await browser.close();
})();
