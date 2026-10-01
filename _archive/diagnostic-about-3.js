const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:4173/about.html', { waitUntil: 'networkidle2' });
  
  // Wait for React/Supabase to inject DOM
  await page.waitForSelector('#tools-grid img', { timeout: 10000 }).catch(() => {});
  
  // Scroll entire page slowly to trigger all lazy loads
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if(totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const images = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      complete: img.complete,
      width: img.naturalWidth
    }));
  });

  const videos = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('video')).map(v => ({
      src: v.src || v.currentSrc,
      readyState: v.readyState,
      videoWidth: v.videoWidth
    }));
  });

  console.log(`\n=== About Page Images ===`);
  let brokenImages = images.filter(img => !img.complete || img.width === 0);
  console.log(`Total Images: ${images.length}, Broken: ${brokenImages.length}`);
  brokenImages.forEach(img => console.log(`  - Broken: ${img.src}`));

  console.log(`\n=== About Page Videos ===`);
  let brokenVideos = videos.filter(v => v.readyState === 0 || v.videoWidth === 0);
  console.log(`Total Videos: ${videos.length}, Broken: ${brokenVideos.length}`);
  brokenVideos.forEach(v => console.log(`  - Broken: ${v.src}`));

  await browser.close();
})();
