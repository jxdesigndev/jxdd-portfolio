import re

with open('admin.html', 'r') as f:
    html = f.read()

# Replace previews
html = html.replace('<div id="pf-image-preview" style="margin-top:var(--s-2); font-size:var(--text-xs); color:var(--gray-2); word-break: break-all;"></div>', '<div id="pf-image-preview" class="admin-gallery-preview"></div>')
html = html.replace('<div id="pf-cover-preview" style="margin-top:var(--s-2); font-size:var(--text-xs); color:var(--gray-2); word-break: break-all;"></div>', '<div id="pf-cover-preview" class="admin-gallery-preview"></div>')
html = html.replace('<div id="pf-persona-preview" style="margin-top:var(--s-2); font-size:var(--text-xs); color:var(--gray-2); word-break: break-all;"></div>', '<div id="pf-persona-preview" class="admin-gallery-preview"></div>')

with open('admin.html', 'w') as f:
    f.write(html)
