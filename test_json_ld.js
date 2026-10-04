const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:4173/work.html', { waitUntil: 'networkidle0' });

  // Get the JSON-LD script content
  const schemaContent = await page.$eval('#schema-work', el => el.textContent);
  
  try {
    const data = JSON.parse(schemaContent);
    console.log("Parsed JSON-LD data:");
    console.log(JSON.stringify(data, null, 2));
    if (data.hasPart && data.hasPart.length > 1) {
      console.log(`\nSUCCESS: hasPart contains ${data.hasPart.length} dynamic projects!`);
    } else {
      console.log("\nFAIL: hasPart missing or only 1 item.");
      process.exit(1);
    }
  } catch (e) {
    console.error("Failed to parse JSON-LD:", e);
    process.exit(1);
  }

  await browser.close();
  process.exit(0);
})();
