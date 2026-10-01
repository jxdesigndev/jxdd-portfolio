import re

with open('admin.js', 'r') as f:
    js = f.read()

# Locate the experience form submit event handler
target_block = """  DOM.experienceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const id = document.getElementById('ef-id').value;
      const payload = {"""

replacement_block = """  DOM.experienceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const id = document.getElementById('ef-id').value;
      
      let finalLogoUrl = null;
      const logoFile = document.getElementById('ef-logo-file') ? document.getElementById('ef-logo-file').files[0] : null;
      if (logoFile) {
        finalLogoUrl = await uploadMedia(logoFile);
      } else if (document.getElementById('ef-logo-preview')) {
        finalLogoUrl = document.getElementById('ef-logo-preview').dataset.existingUrl || null;
      }

      const payload = {"""

js = js.replace(target_block, replacement_block)

old_payload = "logo_url: document.getElementById('ef-logo-url') ? document.getElementById('ef-logo-url').value.trim() : null,"
new_payload = "logo_url: finalLogoUrl,"

js = js.replace(old_payload, new_payload)

with open('admin.js', 'w') as f:
    f.write(js)

print("Submit logic patched.")
