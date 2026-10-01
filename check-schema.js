const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ahduvfbpnxmxzijbmteq.supabase.co';
const supabaseKey = 'sb_publishable_UzPwB5eXx3-fAcPv_7K0VQ_JVAtybPh';
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  let { data, error } = await supabase.from('admins').select('*').limit(1);
  if (error) console.log('Admins table error:', error.message);
  else console.log('Admins table exists!');
  
  ({ data, error } = await supabase.from('users').select('*').limit(1));
  if (error) console.log('Users table error:', error.message);
  else console.log('Users table exists!');
})();
