import re

with open('project.js', 'r') as f:
    project_js = f.read()

with open('work.js', 'r') as f:
    work_js = f.read()

# Add DOMPurify to the public HTML pages if not present
import os
for page in ['index.html', 'project.html']:
    if os.path.exists(page):
        with open(page, 'r') as f:
            html = f.read()
        if 'dompurify' not in html.lower():
            html = html.replace('</head>', '  <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script>\n</head>')
            with open(page, 'w') as f:
                f.write(html)

def purify(js_content):
    # We must sanitize the HTML when it is injected into the DOM.
    # The user says: "Use DOMPurify.sanitize(html) and only allow a strict tag whitelist (b, strong, i, em, blockquote, p, br - nothing else)"
    
    # In project.js, content and outcome_text are split by '\n\n' and put into <p> tags.
    # BUT wait! If they are now HTML from TipTap, they ALREADY contain <p> tags. TipTap outputs <p>hello</p>.
    # Splitting by '\n\n' and wrapping in <p> will break the HTML!
    return js_content

# We need to manually fix project.js rendering
