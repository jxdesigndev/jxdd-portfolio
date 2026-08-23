// Initialize Supabase Client
const supabaseUrl = 'https://ahduvfbpnxmxzijbmteq.supabase.co';
const supabaseKey = 'sb_publishable_UzPwB5eXx3-fAcPv_7K0VQ_JVAtybPh';

window.initSupabase = async function() {
    if (window.supabaseClient) return window.supabaseClient;
    
    // Poll for the CDN to finish loading
    let retries = 0;
    while (!window.supabase || !window.supabase.createClient) {
        if (retries >= 100) throw new Error("Supabase CDN failed to load.");
        await new Promise(r => setTimeout(r, 50));
        retries++;
    }
    
    const client = window.supabase.createClient(supabaseUrl, supabaseKey);
    window.supabaseClient = client;
    window.sbClient = client;
    window.supabase = client;
    return client;
}

// Boot up immediately
window.initSupabase().catch(err => console.error("Supabase initialization failed:", err));
