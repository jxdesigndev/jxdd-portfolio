import re

# 1. Update admin.html
with open('admin.html', 'r') as f:
    admin_html = f.read()

# Replace the single logo_url group with a row containing both logo and website
old_html_group = """        <div class="form-group">
          <label class="form-label" for="ef-logo-url">Company Logo URL (For About Page)</label>
          <input type="text" id="ef-logo-url" class="form-input" placeholder="e.g. https://domain.com/logo.svg">
        </div>"""

new_html_group = """        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="ef-logo-url">Company Logo URL</label>
            <input type="text" id="ef-logo-url" class="form-input" placeholder="e.g. https://domain.com/logo.svg">
          </div>
          <div class="form-group">
            <label class="form-label" for="ef-company-url">Company Website URL</label>
            <input type="text" id="ef-company-url" class="form-input" placeholder="https://domain.com">
          </div>
        </div>"""

admin_html = admin_html.replace(old_html_group, new_html_group)

with open('admin.html', 'w') as f:
    f.write(admin_html)


# 2. Update admin.js
with open('admin.js', 'r') as f:
    admin_js = f.read()

admin_js = admin_js.replace(
    "if(document.getElementById('ef-logo-url')) document.getElementById('ef-logo-url').value = exp.logo_url || '';",
    "if(document.getElementById('ef-logo-url')) document.getElementById('ef-logo-url').value = exp.logo_url || '';\n      if(document.getElementById('ef-company-url')) document.getElementById('ef-company-url').value = exp.company_url || '';"
)

admin_js = admin_js.replace(
    "if(document.getElementById('ef-logo-url')) document.getElementById('ef-logo-url').value = '';",
    "if(document.getElementById('ef-logo-url')) document.getElementById('ef-logo-url').value = '';\n      if(document.getElementById('ef-company-url')) document.getElementById('ef-company-url').value = '';"
)

admin_js = admin_js.replace(
    "logo_url: document.getElementById('ef-logo-url') ? document.getElementById('ef-logo-url').value.trim() : null,",
    "logo_url: document.getElementById('ef-logo-url') ? document.getElementById('ef-logo-url').value.trim() : null,\n        company_url: document.getElementById('ef-company-url') ? document.getElementById('ef-company-url').value.trim() : null,"
)

with open('admin.js', 'w') as f:
    f.write(admin_js)


# 3. Update about_new.js
with open('about_new.js', 'r') as f:
    about_js = f.read()

old_logo_logic = """      if(logo.logo_url) {
        el.innerHTML = `<img src="${logo.logo_url}" alt="${logo.company || 'Client'}">`;
      } else {
        el.innerHTML = `<span style="color:var(--white); font-weight:600;">${logo.company}</span>`;
      }"""

new_logo_logic = """      let inner = '';
      if(logo.logo_url) {
        inner = `<img src="${logo.logo_url}" alt="${logo.company || 'Client'}">`;
      } else {
        inner = `<span style="color:var(--white); font-weight:600; text-align:center;">${logo.company}</span>`;
      }
      
      if(logo.company_url) {
        el.innerHTML = `<a href="${logo.company_url}" target="_blank" rel="noopener noreferrer" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; text-decoration:none;">${inner}</a>`;
      } else {
        el.innerHTML = inner;
      }"""

about_js = about_js.replace(old_logo_logic, new_logo_logic)

with open('about_new.js', 'w') as f:
    f.write(about_js)


# 4. Update setup_supabase_logos.sql
with open('setup_supabase_logos.sql', 'w') as f:
    f.write("""-- Run this in your Supabase SQL Editor to add the logo and URL columns to your existing experience table

ALTER TABLE public.experience 
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS company_url text;
""")

print("All URL patches applied successfully.")
