const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ahduvfbpnxmxzijbmteq.supabase.co';
const supabaseKey = 'sb_publishable_UzPwB5eXx3-fAcPv_7K0VQ_JVAtybPh';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: tools, error } = await supabase.from('tools').select('*');
  if (error) {
    console.error(error);
    return;
  }
  console.log("Total tools:", tools.length);
  const categories = [...new Set(tools.map(t => t.category))];
  console.log("Categories found in DB:", categories);
  tools.forEach(t => console.log(`- ${t.name} (Active: ${t.is_active}) [Category: ${t.category}]`));
}

run();
