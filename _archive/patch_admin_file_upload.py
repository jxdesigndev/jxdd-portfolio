import re

# 1. Patch admin.html
with open('admin.html', 'r') as f:
    admin_html = f.read()

old_logo_input = """          <div class="form-group">
            <label class="form-label" for="ef-logo-url">Company Logo URL</label>
            <input type="text" id="ef-logo-url" class="form-input" placeholder="e.g. https://domain.com/logo.svg">
          </div>"""

new_logo_input = """          <div class="form-group">
            <label class="form-label" for="ef-logo-file">Company Logo (Upload)</label>
            <input type="file" id="ef-logo-file" class="form-input" accept="image/*">
            <div id="ef-logo-preview" style="margin-top:0.5rem; max-width:80px;"></div>
          </div>"""

admin_html = admin_html.replace(old_logo_input, new_logo_input)

with open('admin.html', 'w') as f:
    f.write(admin_html)

# 2. Patch admin.js
with open('admin.js', 'r') as f:
    admin_js = f.read()

# Replace the ef-logo-url set/clear logic with the new preview logic
old_set_logic = "if(document.getElementById('ef-logo-url')) document.getElementById('ef-logo-url').value = exp.logo_url || '';"
new_set_logic = """if (document.getElementById('ef-logo-file')) {
        document.getElementById('ef-logo-file').value = '';
        const prev = document.getElementById('ef-logo-preview');
        if(exp.logo_url) {
          prev.innerHTML = `<img src="${exp.logo_url}" style="width:100%; border-radius:4px;">`;
          prev.dataset.existingUrl = exp.logo_url;
        } else {
          prev.innerHTML = '';
          prev.dataset.existingUrl = '';
        }
      }"""

old_clear_logic = "if(document.getElementById('ef-logo-url')) document.getElementById('ef-logo-url').value = '';"
new_clear_logic = """if (document.getElementById('ef-logo-file')) {
        document.getElementById('ef-logo-file').value = '';
        document.getElementById('ef-logo-preview').innerHTML = '';
        document.getElementById('ef-logo-preview').dataset.existingUrl = '';
      }"""

admin_js = admin_js.replace(old_set_logic, new_set_logic)
admin_js = admin_js.replace(old_clear_logic, new_clear_logic)

# Replace the submit payload logic
old_payload_logic = "logo_url: document.getElementById('ef-logo-url') ? document.getElementById('ef-logo-url').value.trim() : null,"
new_payload_logic = """logo_url: (() => {
          if (!document.getElementById('ef-logo-preview')) return null;
          return document.getElementById('ef-logo-preview').dataset.finalUrl || document.getElementById('ef-logo-preview').dataset.existingUrl || null;
        })(),"""

# Wait, we need to await the upload BEFORE payload creation. 
# Let's use regex to find the submit block for experience form and inject the upload logic.

