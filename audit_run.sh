#!/bin/bash
mkdir -p ~/.local

# Install vercel locally if npx fails
npm install -g vercel@59.5.0

# Install puppeteer chrome
npx puppeteer browsers install chrome

# Run Vercel info
echo "=== VERCEL LS ===" > audit_output.txt
vercel ls jxdd-portfolio >> audit_output.txt 2>&1

echo "=== VERCEL INSPECT ===" >> audit_output.txt
vercel inspect jxdd-portfolio >> audit_output.txt 2>&1

# Run Puppeteer Audit
echo "=== PUPPETEER AUDIT ===" >> audit_output.txt
node audit.js >> audit_output.txt 2>&1

# Run Lighthouse
echo "=== LIGHTHOUSE AUDIT ===" >> audit_output.txt
npx lighthouse https://www.jxdesign.dev --chrome-flags="--no-sandbox --headless" --output json --output-path ./lh-report.json --only-categories=performance,accessibility,best-practices,seo
npx lighthouse https://www.jxdesign.dev/about.html --chrome-flags="--no-sandbox --headless" --output json --output-path ./lh-report-about.json --only-categories=performance,accessibility,best-practices,seo
npx lighthouse https://www.jxdesign.dev/project.html?slug=zenflow --chrome-flags="--no-sandbox --headless" --output json --output-path ./lh-report-project.json --only-categories=performance,accessibility,best-practices,seo

echo "DONE"
