const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Wait function replacement
  const wait = ms => new Promise(r => setTimeout(r, ms));
  
  try {
    console.log('Navigating to live index...');
    await page.goto('https://jxdesign.dev/', { waitUntil: 'networkidle2' });
    
    // Check initial state
    const cliExists = await page.evaluate(() => !!document.getElementById('cli-trigger'));
    console.log(`CLI Trigger button present: ${cliExists}`);
    
    console.log('Triggering Ctrl+K...');
    await page.keyboard.down('Control');
    await page.keyboard.press('k');
    await page.keyboard.up('Control');
    
    await wait(1000);
    
    const cliVisible = await page.evaluate(() => {
      const panel = document.getElementById('cli-panel');
      return panel && window.getComputedStyle(panel).opacity > 0;
    });
    console.log(`CLI Panel Visible: ${cliVisible}`);
    
    if (cliVisible) {
      console.log('Typing pong command...');
      await page.type('#cli-input', 'pong');
      await page.keyboard.press('Enter');
      
      await wait(3000);
      
      const isPong = await page.evaluate(() => document.body.classList.contains('pong-active'));
      console.log(`Pong active on body class: ${isPong}`);
      
      const hasPongUI = await page.evaluate(() => !!document.getElementById('pong-hud'));
      console.log(`Pong HUD injected in DOM: ${hasPongUI}`);
    }
    
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
  
  await browser.close();
})();
