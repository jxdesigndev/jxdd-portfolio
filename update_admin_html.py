import re

with open('admin.html', 'r') as f:
    html = f.read()

import_old = """    import { Editor } from 'https://esm.sh/@tiptap/core@2';
    import StarterKit from 'https://esm.sh/@tiptap/starter-kit@2';
    window.TipTap = { Editor, StarterKit };
    window.dispatchEvent(new Event('tiptap-ready'));"""

import_new = """    import { Editor } from 'https://esm.sh/@tiptap/core@2';
    import StarterKit from 'https://esm.sh/@tiptap/starter-kit@2';
    import Image from 'https://esm.sh/@tiptap/extension-image@2';
    window.TipTap = { Editor, StarterKit, Image };
    window.dispatchEvent(new Event('tiptap-ready'));"""

html = html.replace(import_old, import_new)

with open('admin.html', 'w') as f:
    f.write(html)
