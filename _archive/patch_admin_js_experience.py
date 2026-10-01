import re

with open('admin.js', 'r') as f:
    js = f.read()

# Injection 1: Fill existing value
js = js.replace("document.getElementById('ef-desc').value = exp.description || '';",
                "document.getElementById('ef-desc').value = exp.description || '';\n      if(document.getElementById('ef-logo-url')) document.getElementById('ef-logo-url').value = exp.logo_url || '';")

# Injection 2: Clear value
js = js.replace("document.getElementById('ef-id').value = '';",
                "document.getElementById('ef-id').value = '';\n      if(document.getElementById('ef-logo-url')) document.getElementById('ef-logo-url').value = '';")

# Injection 3: Payload
js = js.replace("company: document.getElementById('ef-company').value.trim(),",
                "company: document.getElementById('ef-company').value.trim(),\n        logo_url: document.getElementById('ef-logo-url') ? document.getElementById('ef-logo-url').value.trim() : null,")

with open('admin.js', 'w') as f:
    f.write(js)

print("Admin JS patched for logo_url.")
