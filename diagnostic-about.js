const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  let failedRequests = [];
  page.on('requestfailed', req => {
    failedRequests.push(`${req.method()} ${req.url()} - ${req.failure().errorText}`);
  });

  page.on('response', res => {
    if (!res.ok() && res.status() !== 200 && res.status() !== 304 && res.status() !== 204 && res.status() !== 206) {
      failedRequests.push(`${res.request().method()} ${res.url()} - HTTP ${res.status()}`);
    }
  });

  await page.goto('http://localhost:4173/about.html', { waitUntil: 'networkidle2' });
  
  const images = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.map(img => ({
      src: img.src,
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    }));
  });

  const videos = await page.evaluate(() => {
    const vids = Array.from(document.querySelectorAll('video'));
    return vids.map(v => ({
      src: v.src || v.currentSrc,
      readyState: v.readyState,
      videoWidth: v.videoWidth
    }));
  });

  console.log(`\n=== About Page Images ===`);
  let brokenImages = images.filter(img => !img.complete || img.naturalWidth === 0);
  console.log(`Total Images: ${images.length}, Broken: ${brokenImages.length}`);
  brokenImages.forEach(img => console.log(`  - Broken: ${img.src}`));

  console.log(`\n=== About Page Videos ===`);
  let brokenVideos = videos.filter(v => v.readyState === 0 || v.videoWidth === 0);
  console.log(`Total Videos: ${videos.length}, Broken: ${brokenVideos.length}`);
  brokenVideos.forEach(v => console.log(`  - Broken: ${v.src}`));

  console.log(`\n=== Failed Requests ===`);
  failedRequests.forEach(req => console.log(`  - ${req}`));

  await browser.close();
})();
