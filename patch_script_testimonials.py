import re

with open('script.js', 'r') as f:
    content = f.read()

# Replace the logo logic in logoStrip loop
old_logo_logic = """      testimonials.forEach(t => {
        if (t.logo_url) {
          const img = document.createElement('img');
          img.src = t.logo_url;
          img.alt = t.role_company || 'Company Logo';
          img.loading = 'lazy';
          logoStrip.appendChild(img);
        }
      });"""

new_logo_logic = """      testimonials.forEach(t => {
        if (t.logo_url) {
          const img = document.createElement('img');
          img.src = t.logo_url;
          img.alt = t.role_company || 'Company Logo';
          img.loading = 'lazy';
          
          if (t.client_website_url) {
            const a = document.createElement('a');
            a.href = t.client_website_url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.appendChild(img);
            logoStrip.appendChild(a);
          } else {
            logoStrip.appendChild(img);
          }
        }
      });"""

content = content.replace(old_logo_logic, new_logo_logic)

with open('script.js', 'w') as f:
    f.write(content)
