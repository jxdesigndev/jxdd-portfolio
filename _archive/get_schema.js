const fs = require('fs');

async function run() {
  const envFile = fs.readFileSync('supabase.js', 'utf8');
  const urlMatch = envFile.match(/const supabaseUrl = ['"](.*)['"]/);
  const keyMatch = envFile.match(/const supabaseAnonKey = ['"](.*)['"]/);
  
  const url = urlMatch[1] + '/rest/v1/projects?select=*&limit=1';
  const headers = { 'apikey': keyMatch[1], 'Authorization': 'Bearer ' + keyMatch[1] };
  
  const res = await fetch(url, { headers });
  const data = await res.json();
  
  if(data && data.length > 0) {
    console.log(Object.keys(data[0]));
  } else {
    console.log("No data, try OPTIONS");
  }
}
run();
