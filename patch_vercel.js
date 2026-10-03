const fs = require('fs');
let vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));

vercel.headers.forEach(h => {
  if (h.source === "/(.*)") {
    h.headers.forEach(hh => {
      if (hh.key === "Content-Security-Policy") {
        hh.value = hh.value.replace(
          /script-src 'self' 'unsafe-inline' https:\/\/cdn\.jsdelivr\.net https:\/\/cdnjs\.cloudflare\.com https:\/\/esm\.sh https:\/\/browser\.sentry-cdn\.com;/,
          "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://esm.sh https://browser.sentry-cdn.com https://www.googletagmanager.com;"
        );
        hh.value = hh.value.replace(
          /connect-src 'self' https:\/\/ahduvfbpnxmxzijbmteq\.supabase\.co https:\/\/cdn\.jsdelivr\.net https:\/\/cdnjs\.cloudflare\.com https:\/\/esm\.sh \*\.ingest\.de\.sentry\.io;/,
          "connect-src 'self' https://ahduvfbpnxmxzijbmteq.supabase.co https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://esm.sh *.ingest.de.sentry.io https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com;"
        );
      }
    });
  }
});

fs.writeFileSync('vercel.json', JSON.stringify(vercel, null, 2));
