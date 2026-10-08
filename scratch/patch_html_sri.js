const fs = require('fs');

const OLD_SRC = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
const NEW_SRC = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js';
const NEW_INTEGRITY = 'sha384-Rj26LVGvoeRVR6+mwQmFfcR3QOBEwT+ZmuCWpuiqeTzJpCs0ER4ITAWGb4Hiy3Ok';

const files = ['404.html', 'about.html', 'admin.html', 'contact.html', 'index.html', 'privacy.html', 'project.html', 'services.html', 'work.html'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2"[^>]*><\/script>/g, 
    `<script src="${NEW_SRC}" defer integrity="${NEW_INTEGRITY}" crossorigin="anonymous"></script>`);
    
  fs.writeFileSync(file, content);
  console.log('Patched ' + file);
});
