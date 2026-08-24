const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const fs = require('fs');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runLiveTest() {
  console.log('--- STARTING FULL LIVE TEST ---');
  
  // Start server
  const server = spawn('node', ['serve.js']);
  await delay(2000); // Wait for server to boot
  
  console.log('\n[1] Launching Browser...');
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--ignore-certificate-errors'] });
  const page = await browser.newPage();
  
  const errors = [];
  const failedRequests = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  
  page.on('requestfailed', request => {
    failedRequests.push(`${request.url()} - ${request.failure().errorText}`);
  });
  
  page.on('response', response => {
    if (!response.ok() && response.status() !== 200) {
      if (response.status() !== 204 && response.status() !== 206) {
         failedRequests.push(`HTTP ${response.status()} - ${response.url()}`);
      }
    }
  });

  const routes = ['/', '/about.html', '/services.html', '/work.html', '/contact.html'];
  const results = {};

  for (let route of routes) {
    console.log(`\n[2] Testing Route: ${route}`);
    errors.length = 0;
    failedRequests.length = 0;
    
    try {
      await page.goto(`http://localhost:8080${route}`, { waitUntil: 'networkidle0', timeout: 15000 });
      
      const title = await page.title();
      console.log(`    Page Title: ${title}`);
      
      if (errors.length > 0) {
        console.log(`    Console Errors: ${errors.length}`);
        errors.forEach(e => console.log(`      - ${e}`));
      } else {
        console.log('    Console Errors: None');
      }
      
      if (failedRequests.length > 0) {
        console.log(`    Failed Requests: ${failedRequests.length}`);
        failedRequests.forEach(f => console.log(`      - ${f}`));
      } else {
        console.log('    Failed Requests: None');
      }
      
      results[route] = { title, errors: [...errors], failedRequests: [...failedRequests] };
    } catch (e) {
      console.log(`    FAILED to load ${route}: ${e.message}`);
    }
  }
  
  console.log('\n[3] Testing User Flow: Modal on Work Page');
  try {
    await page.goto('http://localhost:8080/work.html', { waitUntil: 'domcontentloaded' });
    // Try to click a project card
    const cardExists = await page.evaluate(() => {
      const card = document.querySelector('.work-card');
      if (card) {
        card.click();
        return true;
      }
      return false;
    });
    
    if (cardExists) {
      await delay(1000); // Wait for modal
      const isModalVisible = await page.evaluate(() => {
        const modal = document.querySelector('#project-modal');
        return modal && modal.classList.contains('active');
      });
      console.log(`    Modal opened successfully: ${isModalVisible}`);
    } else {
      console.log('    No project cards found to click.');
    }
  } catch (e) {
    console.log(`    Modal test failed: ${e.message}`);
  }

  console.log('\n--- LIVE TEST COMPLETE ---');
  await browser.close();
  server.kill();
}

runLiveTest().catch(console.error);
