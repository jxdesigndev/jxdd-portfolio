const fs = require('fs');

async function run() {
  const envFile = fs.readFileSync('supabase.js', 'utf8');
  const urlMatch = envFile.match(/const supabaseUrl = ['"](.*)['"]/);
  const keyMatch = envFile.match(/const supabaseAnonKey = ['"](.*)['"]/);
  
  const url = urlMatch[1] + '/rest/v1/projects?select=id,slug,title,image_url,persona_image_url,screenshot_urls&limit=3';
  const headers = { 'apikey': keyMatch[1], 'Authorization': 'Bearer ' + keyMatch[1], 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
  
  const res = await fetch(url, { headers });
  const data = await res.json();
  
  console.log("Current projects:", data);
  
  // Set a slug for the first project if it doesn't have one
  if (data.length > 0) {
    let target = data[0];
    if (!target.slug) {
      const updateUrl = urlMatch[1] + `/rest/v1/projects?id=eq.${target.id}`;
      await fetch(updateUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ slug: 'test-slug' })
      });
      console.log('Set slug to test-slug for project', target.title);
    } else {
      console.log('Project already has slug:', target.slug);
    }
  }
}
run();
