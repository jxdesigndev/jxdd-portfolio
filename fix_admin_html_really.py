import re

with open('admin.html', 'r') as f:
    html = f.read()

# I will find ef-company and inject after it
target_html = """          <div class="form-group">
            <label class="form-label" for="ef-company">Company *</label>
            <input type="text" id="ef-company" class="form-input" required>
          </div>
        </div>"""

new_html = """          <div class="form-group">
            <label class="form-label" for="ef-company">Company *</label>
            <input type="text" id="ef-company" class="form-input" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="ef-logo-file">Company Logo (Upload)</label>
            <input type="file" id="ef-logo-file" class="form-input" accept="image/*">
            <div id="ef-logo-preview" style="margin-top:0.5rem; max-width:80px;"></div>
          </div>
          <div class="form-group">
            <label class="form-label" for="ef-company-url">Company Website URL</label>
            <input type="text" id="ef-company-url" class="form-input" placeholder="https://domain.com">
          </div>
        </div>"""

if target_html in html:
    html = html.replace(target_html, new_html)
    with open('admin.html', 'w') as f:
        f.write(html)
    print("SUCCESS")
else:
    print("FAILED TO MATCH")
