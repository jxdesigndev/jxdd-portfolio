const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ahduvfbpnxmxzijbmteq.supabase.co', 'sb_publishable_UzPwB5eXx3-fAcPv_7K0VQ_JVAtybPh');
async function run() {
  const { data: tools } = await supabase.from('tools').select('category').eq('is_active', true);
  const counts = {};
  if (tools) {
      tools.forEach(t => {
          let cat = (t.category || 'unknown').toLowerCase();
          counts[cat] = (counts[cat] || 0) + 1;
      });
  }
  console.log("Counts per category:", counts);
}
run();
