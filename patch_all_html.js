const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

const sentryAndManifest = `
  <link rel="manifest" href="/site.webmanifest">
  <link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png">
  <script src="https://browser.sentry-cdn.com/8.32.0/bundle.tracing.min.js" integrity="sha384-azPZNenw1tFrK+792hW27tmLnD4rHaeVToH/tzGQEC8vTwaE8DeelviliETYPmdA" crossorigin="anonymous"></script>
  <script>
    if (window.Sentry) {
      Sentry.init({
        dsn: "https://4dc0504b7ed168eca887ddcf377af5c6@o4512191041568768.ingest.de.sentry.io/4512191058214992",
        sendDefaultPii: false,
        integrations: [ Sentry.browserTracingIntegration() ],
        tracesSampleRate: 1.0,
      });
    }
  </script>
  <script src="/compliance.js" defer></script>
`;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // 1. Insert into <head>
  if (!content.includes('site.webmanifest')) {
    content = content.replace(/(<\/head>)/i, sentryAndManifest.trim() + '\n$1');
  }

  // 2. Insert into footer
  if (!content.includes('privacy.html')) {
    if (content.includes('<p class="footer-copy">')) {
      content = content.replace(
        /(<p class="footer-copy">© 2026[^<]*)(<\/p>)/,
        '$1 | <a href="privacy.html" style="color:inherit;text-decoration:underline;">Privacy</a>$2'
      );
    } else if (content.includes('© 2026')) {
      content = content.replace(
        /(© 2026[^<]*)/,
        '$1 | <a href="privacy.html" style="color:inherit;text-decoration:underline;">Privacy</a>'
      );
    }
  }
  
  fs.writeFileSync(file, content);
});
