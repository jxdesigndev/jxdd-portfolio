import re

with open('work.js', 'r') as f:
    content = f.read()

def replacement_slice(m):
    return """<p class="work-card-desc">${(p.description || '').replace(/<[^>]*>?/gm, '').slice(0, 110)}${(p.description || '').replace(/<[^>]*>?/gm, '').length > 110 ? '…' : ''}</p>"""
content = re.sub(r'<p class="work-card-desc">\$\{\(p\.description \|\| \'\'\)\.slice\(0, 110\)\}\$\{\(p\.description \|\| \'\'\)\.length > 110 \? \'…\' : \'\'\}</p>', replacement_slice, content)

def replacement_desc_modal(m):
    return """<div style="font-family:var(--font-body); font-size:var(--text-sm); color:var(--gray-2); line-height:var(--lead-relaxed);overflow-wrap:anywhere;" class="tiptap-content">
            ${window.DOMPurify ? window.DOMPurify.sanitize(p.description || '', { ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'blockquote', 'p', 'br'] }) : (p.description || '').replace(/<[^>]*>?/gm, '')}
          </div>"""
content = re.sub(r'<p style="font-family:var\(--font-body\); font-size:var\(--text-sm\); color:var\(--gray-2\); line-height:var\(--lead-relaxed\);overflow-wrap:anywhere;">\$\{p\.description \|\| \'\'\}</p>', replacement_desc_modal, content)

def replacement_content(m):
    return """<div style="font-family:var(--font-body); font-size:var(--text-sm); color:var(--gray-2); line-height:var(--lead-relaxed);overflow-wrap:anywhere;" class="tiptap-content">
            ${window.DOMPurify ? window.DOMPurify.sanitize(p.content || '', { ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'blockquote', 'p', 'br'] }) : (p.content || '').replace(/<[^>]*>?/gm, '')}
          </div>"""
content = re.sub(r'<p style="font-family:var\(--font-body\); font-size:var\(--text-sm\); color:var\(--gray-2\); line-height:var\(--lead-relaxed\);overflow-wrap:anywhere;">\$\{p\.content\.replace\(/\\n/g, \'<br>\'\)\}</p>', replacement_content, content)

with open('work.js', 'w') as f:
    f.write(content)
