import re

with open('admin.html', 'r') as f:
    content = f.read()

content = content.replace('<section id="tab-services" class="admin-tab-content" style="display:none;">', '<section id="tab-services" class="admin-tab-content">')

with open('admin.html', 'w') as f:
    f.write(content)
