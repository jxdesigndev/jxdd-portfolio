const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:4173/about.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  // scroll down to load lazy images
  await page.evaluate(() => {
    window.scrollBy(0, document.body.scrollHeight);
  });
  await new Promise(r => setTimeout(r, 2000));

  const toolsHTML = await page.evaluate(() => {
    const grid = document.getElementById('tools-grid');
    return grid ? grid.innerHTML : 'NOT FOUND';
  });
  console.log('Tools Grid HTML:');
  console.log(toolsHTML);

  const images = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      complete: img.complete,
      width: img.naturalWidth
    }));
  });
  console.log('\nImages:', JSON.stringify(images, null, 2));

  const video = await page.evaluate(() => {
    const v = document.getElementById('int-video');
    return v ? v.src || v.currentSrc || 'NO_SRC' : 'NOT FOUND';
  });
  console.log('\nVideo src:', video);

  await browser.close();
})();
