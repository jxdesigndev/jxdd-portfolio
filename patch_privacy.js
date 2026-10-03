const fs = require('fs');

let content = fs.readFileSync('privacy.html', 'utf8');

content = content.replace(
  /<li><strong>Analytics \(Optional\):<\/strong> If you grant consent via our cookie banner, we may use basic analytics to understand aggregate traffic patterns. If you decline, no analytics scripts are loaded.<\/li>/,
  '<li><strong>Analytics (Optional):</strong> If you grant explicit consent via our cookie banner, we use Google Analytics (GA4) to understand aggregate traffic patterns and page views. This helps us improve the site. GA4 is configured to anonymize your IP address by default. If you decline consent, the Google Analytics script is entirely blocked from loading.</li>'
);

content = content.replace(
  /<li><strong>Sentry:<\/strong> Processes anonymized error logs.<\/li>/,
  '<li><strong>Sentry:</strong> Processes anonymized error logs.</li>\n        <li><strong>Google Analytics:</strong> Processes aggregate site traffic data (only if you consent).</li>'
);

fs.writeFileSync('privacy.html', content);
