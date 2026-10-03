const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace('<script src="/compliance.js" defer></script>', '<script type="module" src="/compliance.js"></script>');
  fs.writeFileSync(file, content);
});
