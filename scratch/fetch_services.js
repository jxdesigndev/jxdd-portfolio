import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahduvfbpnxmxzijbmteq.supabase.co';
const supabaseKey = 'sb_publishable_UzPwB5eXx3-fAcPv_7K0VQ_JVAtybPh';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('services').select('*');
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("Services Table Data:");
  console.log(JSON.stringify(data, null, 2));
  
  if (data.length > 0) {
    console.log("Schema Keys:", Object.keys(data[0]));
  }
}
run();
