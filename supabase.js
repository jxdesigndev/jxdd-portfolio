// Initialize Supabase Client
const supabaseUrl = 'https://ahduvfbpnxmxzijbmteq.supabase.co';
const supabaseKey = 'sb_publishable_UzPwB5eXx3-fAcPv_7K0VQ_JVAtybPh';

window.initSupabase = async function() {
    if (window.supabaseClient) return window.supabaseClient;
    
    // Poll for the CDN to finish loading
    while (!window.supabase) {
        await new Promise(r => setTimeout(r, 50));
    }
    
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    return window.supabaseClient;
}

// Boot up immediately
window.initSupabase();
