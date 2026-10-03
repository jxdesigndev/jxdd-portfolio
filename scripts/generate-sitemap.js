const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://ahduvfbpnxmxzijbmteq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_UzPwB5eXx3-fAcPv_7K0VQ_JVAtybPh';

async function fetchProjects() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ahduvfbpnxmxzijbmteq.supabase.co',
      path: '/rest/v1/projects?select=slug,created_at',
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Failed to fetch: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

const STATIC_URLS = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/about.html', priority: '0.8', changefreq: 'monthly' },
  { loc: '/work.html', priority: '0.9', changefreq: 'weekly' },
  { loc: '/services.html', priority: '0.8', changefreq: 'monthly' },
  { loc: '/contact.html', priority: '0.7', changefreq: 'monthly' }
];

async function generate() {
  console.log('[Sitemap] Fetching projects from Supabase...');
  let projects = [];
  try {
    projects = await fetchProjects();
    console.log(`[Sitemap] Fetched ${projects.length} projects.`);
  } catch (err) {
    console.warn('[Sitemap] WARNING: Could not fetch projects. Generating base sitemap only.', err.message);
  }

  const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
  const date = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
  xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
  xml += `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;

  // Add static URLs
  for (const item of STATIC_URLS) {
    xml += `  <url>\n`;
    xml += `    <loc>https://www.jxdesign.dev${item.loc}</loc>\n`;
    xml += `    <lastmod>${date}</lastmod>\n`;
    xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
    xml += `    <priority>${item.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // Add dynamic project URLs
  for (const p of projects) {
    if (!p.slug) continue;
    const projectDate = p.created_at ? p.created_at.split('T')[0] : date;
    xml += `  <url>\n`;
    xml += `    <loc>https://www.jxdesign.dev/project.html?slug=${p.slug}</loc>\n`;
    xml += `    <lastmod>${projectDate}</lastmod>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;

  fs.writeFileSync(sitemapPath, xml);
  console.log('[Sitemap] Generated public/sitemap.xml successfully.');
}

generate();
