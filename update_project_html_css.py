import re

with open('project.html', 'r') as f:
    html = f.read()

tiptap_img_css = """  .tiptap-content h4 { font-size: var(--text-lg); }

  /* ── TipTap Images ── */
  .tiptap-content img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: var(--s-6) 0;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  }"""

html = html.replace('  .tiptap-content h4 { font-size: var(--text-lg); }', tiptap_img_css)

with open('project.html', 'w') as f:
    f.write(html)
