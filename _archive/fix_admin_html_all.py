import re

with open('admin.html', 'r') as f:
    html = f.read()

# Settings
html = html.replace('<input type="url" id="setting-about-video-preview" class="form-input" readonly placeholder="No video uploaded yet">', '<div id="setting-about-video-preview" class="admin-gallery-preview"></div>')
html = html.replace('<input type="url" id="setting-about-poster-preview" class="form-input" readonly placeholder="No poster uploaded yet">', '<div id="setting-about-poster-preview" class="admin-gallery-preview"></div>')

# Testimonials
html = html.replace('<input type="url" id="tf-logo-preview" class="form-input" readonly placeholder="No logo uploaded yet">', '<div id="tf-logo-preview" class="admin-gallery-preview"></div>')
html = html.replace('<input type="url" id="tf-video-preview" class="form-input" readonly placeholder="No video uploaded yet">', '<div id="tf-video-preview" class="admin-gallery-preview"></div>')
html = html.replace('<input type="url" id="tf-photo-preview" class="form-input" readonly placeholder="No photo uploaded yet">', '<div id="tf-photo-preview" class="admin-gallery-preview"></div>')

# Tools
html = html.replace('<input type="url" id="tlf-logo-preview" class="form-input" readonly placeholder="No logo uploaded yet">', '<div id="tlf-logo-preview" class="admin-gallery-preview"></div>')

# Services
html = html.replace('<div id="sv-image-preview" style="margin-top:var(--s-2); font-size:var(--text-xs); color:var(--gray-2); word-break: break-all;"></div>', '<div id="sv-image-preview" class="admin-gallery-preview"></div>')
html = html.replace('<div id="sv-video-preview" style="margin-top:var(--s-2); font-size:var(--text-xs); color:var(--gray-2); word-break: break-all;"></div>', '<div id="sv-video-preview" class="admin-gallery-preview"></div>')

with open('admin.html', 'w') as f:
    f.write(html)
