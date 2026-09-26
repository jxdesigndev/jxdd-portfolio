const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ahduvfbpnxmxzijbmteq.supabase.co', 'sb_publishable_UzPwB5eXx3-fAcPv_7K0VQ_JVAtybPh');
async function run() {
  const { data: tools } = await supabase.from('tools').select('name, logo_url');
  tools.forEach(t => console.log(`${t.name} -> ${t.logo_url}`));
}
run();
