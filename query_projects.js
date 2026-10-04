const https = require('https');

const options = {
  hostname: 'ahduvfbpnxmxzijbmteq.supabase.co',
  path: '/rest/v1/projects?select=*',
  method: 'GET',
  headers: {
    'apikey': 'sb_publishable_UzPwB5eXx3-fAcPv_7K0VQ_JVAtybPh',
    'Authorization': 'Bearer sb_publishable_UzPwB5eXx3-fAcPv_7K0VQ_JVAtybPh'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      console.log('--- Row count:', parsed.length);
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', e => {
  console.error(e);
});

req.end();
