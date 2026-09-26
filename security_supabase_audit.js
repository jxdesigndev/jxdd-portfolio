// Comprehensive security and Supabase audit
const SUPABASE_URL = 'https://ahduvfbpnxmxzijbmteq.supabase.co';
const ANON_KEY = 'sb_publishable_UzPwB5eXx3-fAcPv_7K0VQ_JVAtybPh';

async function run() {
  const hdr = { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY, 'Content-Type': 'application/json' };

  console.log('=== SUPABASE RLS & SECURITY AUDIT ===\n');

  // 1. Test READ access on all known tables
  const tables = ['experience', 'tools', 'site_settings', 'projects', 'contact_submissions', 'testimonials', 'services'];
  for (const t of tables) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=*&limit=5`, { headers: hdr });
      const d = await r.json();
      if (Array.isArray(d)) {
        console.log(`READ ${t}: ✅ ${d.length} rows returned (anon can read)`);
      } else {
        console.log(`READ ${t}: ❌ ${JSON.stringify(d).substring(0, 100)}`);
      }
    } catch (e) {
      console.log(`READ ${t}: ERROR — ${e.message}`);
    }
  }

  // 2. Test WRITE access (INSERT) on tables that should be read-only
  console.log('\n--- WRITE ACCESS TESTS (should FAIL for read-only tables) ---');
  const readOnlyTables = ['experience', 'tools', 'site_settings', 'projects', 'testimonials', 'services'];
  for (const t of readOnlyTables) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}`, {
        method: 'POST',
        headers: { ...hdr, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ id: 99999, name: '__SECURITY_TEST__' })
      });
      if (r.status === 201 || r.status === 200) {
        console.log(`⚠️ WRITE ${t}: ALLOWED (status ${r.status}) — RLS TOO PERMISSIVE!`);
        // Clean up
        await fetch(`${SUPABASE_URL}/rest/v1/${t}?id=eq.99999`, { method: 'DELETE', headers: hdr });
      } else {
        const body = await r.text();
        console.log(`✅ WRITE ${t}: BLOCKED (${r.status}) — ${body.substring(0, 80)}`);
      }
    } catch (e) {
      console.log(`WRITE ${t}: ERROR — ${e.message}`);
    }
  }

  // 3. Test DELETE access
  console.log('\n--- DELETE ACCESS TESTS (should FAIL) ---');
  for (const t of readOnlyTables) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?id=eq.1`, { method: 'DELETE', headers: hdr });
      if (r.status === 204 || r.status === 200) {
        // Check if anything was actually deleted
        const check = await fetch(`${SUPABASE_URL}/rest/v1/${t}?id=eq.1`, { headers: hdr });
        const data = await check.json();
        if (data.length === 0) {
          console.log(`🔴 DELETE ${t}: DATA ACTUALLY DELETED! CRITICAL RLS FAILURE!`);
        } else {
          console.log(`⚠️ DELETE ${t}: Status ${r.status} but data still exists (RLS might be blocking silently)`);
        }
      } else {
        console.log(`✅ DELETE ${t}: BLOCKED (${r.status})`);
      }
    } catch (e) {
      console.log(`DELETE ${t}: ERROR — ${e.message}`);
    }
  }

  // 4. Test UPDATE access
  console.log('\n--- UPDATE ACCESS TESTS (should FAIL) ---');
  for (const t of readOnlyTables) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?id=eq.1`, {
        method: 'PATCH',
        headers: { ...hdr, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ name: '__HACKED__' })
      });
      if (r.status === 200 || r.status === 204) {
        console.log(`⚠️ UPDATE ${t}: Status ${r.status} — checking if data changed...`);
        const check = await fetch(`${SUPABASE_URL}/rest/v1/${t}?id=eq.1`, { headers: hdr });
        const data = await check.json();
        if (data[0]?.name === '__HACKED__') {
          console.log(`🔴 UPDATE ${t}: DATA ACTUALLY MODIFIED! CRITICAL RLS FAILURE!`);
        } else {
          console.log(`✅ UPDATE ${t}: RLS silently blocked (data unchanged)`);
        }
      } else {
        console.log(`✅ UPDATE ${t}: BLOCKED (${r.status})`);
      }
    } catch (e) {
      console.log(`UPDATE ${t}: ERROR — ${e.message}`);
    }
  }

  // 5. Contact submissions - should allow INSERT but not READ/UPDATE/DELETE
  console.log('\n--- CONTACT_SUBMISSIONS WRITE-ONLY TEST ---');
  const testPayload = {
    name: '__AUDIT_TEST__',
    email: 'audit@test.local',
    project_type: 'Security Audit',
    budget: 'N/A',
    message: 'Automated security test — safe to delete'
  };
  try {
    const insR = await fetch(`${SUPABASE_URL}/rest/v1/contact_submissions`, {
      method: 'POST',
      headers: { ...hdr, 'Prefer': 'return=representation' },
      body: JSON.stringify(testPayload)
    });
    const insData = await insR.json();
    console.log(`INSERT contact_submissions: ${insR.status === 201 ? '✅ Works' : '❌ Failed'} (status ${insR.status})`);

    if (insR.status === 201 && insData[0]?.id) {
      // Try to READ all submissions (should be blocked for anon)
      const readR = await fetch(`${SUPABASE_URL}/rest/v1/contact_submissions?select=*`, { headers: hdr });
      const readD = await readR.json();
      if (Array.isArray(readD) && readD.length > 0) {
        console.log(`⚠️ READ contact_submissions: ${readD.length} rows visible! Anon can read other submissions!`);
      } else {
        console.log(`✅ READ contact_submissions: Properly blocked`);
      }

      // Try to DELETE the test record
      const delR = await fetch(`${SUPABASE_URL}/rest/v1/contact_submissions?name=eq.__AUDIT_TEST__`, {
        method: 'DELETE',
        headers: hdr
      });
      console.log(`DELETE contact_submissions: Status ${delR.status}`);
    }
  } catch (e) {
    console.log(`contact_submissions test: ERROR — ${e.message}`);
  }

  // 6. Check for service role key exposure
  console.log('\n--- SERVICE ROLE KEY EXPOSURE CHECK ---');
  const pagesToCheck = [
    'https://www.jxdesign.dev/',
    'https://www.jxdesign.dev/supabase.js',
    'https://www.jxdesign.dev/admin.js',
  ];
  for (const url of pagesToCheck) {
    try {
      const r = await fetch(url);
      const text = await r.text();
      if (text.includes('service_role') || text.includes('eyJhbGciOiJIUzI1NiIs')) {
        console.log(`🔴 ${url}: SERVICE ROLE KEY EXPOSED!`);
      } else {
        console.log(`✅ ${url}: No service role key found`);
      }
    } catch (e) {
      console.log(`CHECK ${url}: ERROR — ${e.message}`);
    }
  }

  // 7. Security headers check
  console.log('\n--- SECURITY HEADERS ---');
  try {
    const r = await fetch('https://www.jxdesign.dev/');
    const headers = {};
    r.headers.forEach((v, k) => headers[k] = v);

    const checks = [
      ['x-content-type-options', 'nosniff'],
      ['x-frame-options', 'SAMEORIGIN'],
      ['x-xss-protection', '1'],
      ['referrer-policy', 'strict-origin'],
      ['permissions-policy', 'camera'],
      ['content-security-policy', null],
      ['strict-transport-security', 'max-age'],
    ];

    for (const [header, expected] of checks) {
      const val = headers[header];
      if (val) {
        console.log(`✅ ${header}: ${val.substring(0, 60)}`);
      } else {
        console.log(`❌ MISSING: ${header}`);
      }
    }
  } catch (e) {
    console.log(`Headers check error: ${e.message}`);
  }

  // 8. CORS check
  console.log('\n--- CORS CHECK ---');
  try {
    const r = await fetch('https://www.jxdesign.dev/', {
      headers: { 'Origin': 'https://evil-site.com' }
    });
    const acao = r.headers.get('access-control-allow-origin');
    if (acao === '*') {
      console.log(`⚠️ CORS: access-control-allow-origin is wildcard (*) — allows any origin`);
    } else if (acao) {
      console.log(`✅ CORS: ${acao}`);
    } else {
      console.log(`✅ CORS: No ACAO header (restrictive)`);
    }
  } catch (e) {
    console.log(`CORS check error: ${e.message}`);
  }

  // 9. Check Supabase storage bucket policies
  console.log('\n--- STORAGE BUCKET CHECK ---');
  try {
    const r = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, { headers: hdr });
    const buckets = await r.json();
    if (Array.isArray(buckets)) {
      buckets.forEach(b => {
        console.log(`Bucket "${b.name}": public=${b.public}, file_size_limit=${b.file_size_limit || 'none'}`);
      });
    } else {
      console.log(`Buckets response: ${JSON.stringify(buckets).substring(0, 100)}`);
    }
  } catch (e) {
    console.log(`Storage check error: ${e.message}`);
  }

  // 10. Check for open storage listing
  try {
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/list/portfolio_media`, {
      method: 'POST',
      headers: hdr,
      body: JSON.stringify({ prefix: '', limit: 100, offset: 0 })
    });
    const files = await r.json();
    if (Array.isArray(files)) {
      console.log(`\nStorage "portfolio_media" listing: ${files.length} files visible to anon`);
      files.slice(0, 5).forEach(f => console.log(`  - ${f.name} (${(f.metadata?.size || 0)} bytes)`));
    }
  } catch (e) {
    console.log(`Storage listing error: ${e.message}`);
  }
}

run().catch(console.error);
