const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Replace any existing CACHE_NAME assignment with a new timestamp
const timestamp = Date.now();
swContent = swContent.replace(
  /const CACHE_NAME = '.*';/,
  `const CACHE_NAME = 'jxdd-cache-v${timestamp}';`
);

fs.writeFileSync(swPath, swContent);
console.log(`Updated sw.js CACHE_NAME to jxdd-cache-v${timestamp}`);
