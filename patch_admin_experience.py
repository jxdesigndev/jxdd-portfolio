import re

with open('admin.html', 'r') as f:
    html = f.read()

# Add logo_url to the experience modal
new_field = """        </div>

        <div class="form-group">
          <label class="form-label" for="ef-logo-url">Company Logo URL (For About Page)</label>
          <input type="text" id="ef-logo-url" class="form-input" placeholder="e.g. https://domain.com/logo.svg">
        </div>"""

html = html.replace('        </div>\n\n        <div class="form-group">\n          <label class="form-label" for="ef-description">Description', new_field + '\n\n        <div class="form-group">\n          <label class="form-label" for="ef-description">Description')

with open('admin.html', 'w') as f:
    f.write(html)

print("Admin HTML patched.")
