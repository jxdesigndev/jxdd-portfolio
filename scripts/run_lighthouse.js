const fs = require('fs');
const { execSync } = require('child_process');

const urls = [
  '/',
  '/about.html',
  '/work.html',
  '/services.html',
  '/contact.html'
];

console.log('Starting local server...');
const server = require('child_process').spawn('node', ['serve.js']);

setTimeout(() => {
  console.log('Running Lighthouse tests...');
  const results = {};
  for (const url of urls) {
    const fullUrl = `http://localhost:8080${url}`;
    const filename = url === '/' ? 'index' : url.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_|_$/g, '');
    console.log(`Testing ${fullUrl}...`);
    try {
      execSync(`CI=1 npx lighthouse ${fullUrl} --output=json --output-path=lh_${filename}.json --chrome-flags="--headless=new --no-sandbox"`, { stdio: 'inherit' });
      
      const report = JSON.parse(fs.readFileSync(`lh_${filename}.json`, 'utf8'));
      
      const scores = {
        Performance: report.categories.performance?.score * 100,
        Accessibility: report.categories.accessibility?.score * 100,
        'Best Practices': report.categories['best-practices']?.score * 100,
        SEO: report.categories.seo?.score * 100,
      };
      
      const audits = Object.values(report.audits).filter(a => a.score !== null && a.score < 1 && a.weight !== 0);
      results[url] = { scores, issues: audits.map(a => ({ id: a.id, title: a.title, score: a.score })) };
      
      console.log(`Scores for ${url}:`, scores);
    } catch (e) {
      console.error(`Failed on ${url}: ${e.message}`);
    }
  }
  
  fs.writeFileSync('lh_summary.json', JSON.stringify(results, null, 2));
  server.kill();
  console.log('Done.');
}, 2000);
