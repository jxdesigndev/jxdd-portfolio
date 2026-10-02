const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // not headless so hover might work, or force emulation
  const page = await browser.newPage();
  
  // Emulate a mouse environment
  const client = await page.target().createCDPSession();
  await client.send('Emulation.setEmitTouchEventsForMouse', { enabled: false });
  await page.emulateMediaFeatures([{ name: 'pointer', value: 'fine' }, { name: 'hover', value: 'hover' }]);

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
  
  const cursorData = await page.evaluate(() => {
    return {
      dot: document.querySelector('.cursor') ? window.getComputedStyle(document.querySelector('.cursor')).transform : 'missing'
    };
  });
  console.log("Cursor initially:", cursorData);

  await page.mouse.move(500, 500, { steps: 50 });
  await new Promise(r => setTimeout(r, 1000));

  const cursorDataMoved = await page.evaluate(() => {
    return {
      dot: document.querySelector('.cursor') ? window.getComputedStyle(document.querySelector('.cursor')).transform : 'missing'
    };
  });
  console.log("Cursor after move:", cursorDataMoved);
  
  await browser.close();
})();
