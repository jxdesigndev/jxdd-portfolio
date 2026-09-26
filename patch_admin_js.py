import re

with open('admin.js', 'r') as f:
    content = f.read()

# Add to openTestimonialModal
old_open = "document.getElementById('tf-quote').value = testm.quote_text || '';"
new_open = "document.getElementById('tf-quote').value = testm.quote_text || '';\n      document.getElementById('tf-website').value = testm.client_website_url || '';"
content = content.replace(old_open, new_open)

# Add to payload
old_payload = "quote_text: document.getElementById('tf-quote').value.trim(),"
new_payload = "quote_text: document.getElementById('tf-quote').value.trim(),\n        client_website_url: document.getElementById('tf-website').value.trim() || null,"
content = content.replace(old_payload, new_payload)

with open('admin.js', 'w') as f:
    f.write(content)

