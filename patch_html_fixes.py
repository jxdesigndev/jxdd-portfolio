with open('index.html', 'r') as f:
    html = f.read()

# FIX 8: Remove Matter.js — completely unused after physics teardown
old_matter = '  <script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js" defer></script>\n'
if old_matter in html:
    html = html.replace(old_matter, '')
    print("FIX 8: matter.min.js removed (87KB dead weight) ✓")
else:
    print("FIX 8: matter.js tag not found — check manually")

# FIX 9: Add defer to DOMPurify (render-blocking)
old_dompurify = '  <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script>'
new_dompurify = '  <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js" defer></script>'
if old_dompurify in html:
    html = html.replace(old_dompurify, new_dompurify)
    print("FIX 9: defer added to DOMPurify (unblocks First Contentful Paint) ✓")
else:
    print("FIX 9: DOMPurify tag not found — check manually")

with open('index.html', 'w') as f:
    f.write(html)

print("\nAll HTML fixes written to index.html.")
