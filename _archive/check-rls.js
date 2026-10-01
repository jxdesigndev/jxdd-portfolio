const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ahduvfbpnxmxzijbmteq.supabase.co';
const supabaseKey = 'sb_publishable_UzPwB5eXx3-fAcPv_7K0VQ_JVAtybPh';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const table = 'site_settings';
  let { data: rows } = await supabase.from(table).select('key').limit(1);
  if (rows && rows.length > 0) {
    const key = rows[0].key;
    let { data, error } = await supabase.from(table).update({ value: 'test' }).eq('key', key).select();
    if (error) console.log('ERROR:', error);
    else if (data.length) console.log('UPDATE ALLOWED!');
    else console.log('UPDATE BLOCKED (0 rows)');
  }
})();
