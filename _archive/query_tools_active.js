const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ahduvfbpnxmxzijbmteq.supabase.co', 'sb_publishable_UzPwB5eXx3-fAcPv_7K0VQ_JVAtybPh');
async function run() {
  const { data: tools } = await supabase.from('tools').select('*').eq('is_active', true);
  console.log("Active tools count:", tools ? tools.length : 0);
}
run();
