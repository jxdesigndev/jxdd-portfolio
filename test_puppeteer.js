const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

const serverProcess = spawn('python3', ['-m', 'http.server', '3000'], { stdio: 'ignore' });

setTimeout(async () => {
  console.log('Server assumed running on http://localhost:3000');
  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    // 1. Test "Not Found" state
    await page.goto('http://localhost:3000/project.html?slug=doesnotexist', { waitUntil: 'networkidle0' });
    const h1Text = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : 'H1 NOT FOUND';
    });
    console.log('Test 1 (Not Found):', h1Text === 'Project Not Found' ? 'PASS' : 'FAIL (' + h1Text + ')');

    // 2. Set up a mock project with a slug using REST API
    const sbUrl = 'https://ahduvfbpnxmxzijbmteq.supabase.co/rest/v1/projects';
    const sbKey = 'sb_publishable_UzPwB5eXx3-fAcPv_7K0VQ_JVAtybPh';
    const headers = { 'apikey': sbKey, 'Authorization': 'Bearer ' + sbKey, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
    
    const res = await fetch(`${sbUrl}?select=id,slug,title&limit=1`, { headers });
    const projects = await res.json();
    
    let targetSlug = 'test-puppeteer-slug';
    if (projects.length > 0) {
      const pid = projects[0].id;
      await fetch(`${sbUrl}?id=eq.${pid}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          slug: targetSlug,
          persona_image_url: 'https://www.jxdesign.dev/assets/images/zenflow-amara.jpeg',
          screenshot_urls: ['https://www.jxdesign.dev/assets/images/zenflow-courses-screen.png'],
          outcome_text: 'Test outcome.'
        })
      });
      console.log('Updated project', pid, 'with test data.');
      
      // 3. Test the actual project
      await page.goto(`http://localhost:3000/project.html?slug=${targetSlug}`, { waitUntil: 'networkidle0' });
      
      // Wait for image loads so layout triggers frame classes
      await page.waitForTimeout(1000);
      
      const title = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        return h1 ? h1.textContent : 'H1 NOT FOUND';
      });
      console.log('Test 2 (Title):', title === projects[0].title ? 'PASS' : 'FAIL (' + title + ')');
      
      const screenshotsCount = await page.evaluate(() => document.querySelectorAll('.screenshot-frame img').length);
      console.log('Test 3 (Screenshots rendered):', screenshotsCount === 1 ? 'PASS' : 'FAIL (' + screenshotsCount + ')');
      
      // Check orientation
      const frameClass = await page.evaluate(() => {
        const frame = document.querySelector('.screenshot-frame');
        return frame ? frame.className : 'FRAME NOT FOUND';
      });
      console.log('Test 4 (Orientation Class applied):', frameClass.includes('frame-portrait') || frameClass.includes('frame-landscape') ? 'PASS' : 'FAIL (' + frameClass + ')');

    } else {
      console.log('No projects in DB to test.');
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    if (browser) await browser.close();
    serverProcess.kill();
    process.exit(0);
  }
}, 1500);
