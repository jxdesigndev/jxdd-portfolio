import re

with open('script.js', 'r') as f:
    content = f.read()

# Replace the description slice
# We'll extract plain text first
def replacement_slice(m):
    return """<p class="project-card-desc">${(p.description || '').replace(/<[^>]*>?/gm, '').slice(0, 100)}${(p.description || '').replace(/<[^>]*>?/gm, '').length > 100 ? '…' : ''}</p>"""

content = re.sub(r'<p class="project-card-desc">\$\{\(p\.description \|\| \'\'\)\.slice\(0, 100\)\}\$\{\(p\.description \|\| \'\'\)\.length > 100 \? \'…\' : \'\'\}</p>', replacement_slice, content)

# Replace cursor tooltip
def replacement_tooltip(m):
    return """            ${window.DOMPurify ? window.DOMPurify.sanitize(p.description || '', { ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'blockquote', 'p', 'br'] }) : (p.description || '').replace(/<[^>]*>?/gm, '')}"""

content = re.sub(r'            \$\{p\.description \|\| \'\'\}', replacement_tooltip, content)

with open('script.js', 'w') as f:
    f.write(content)
