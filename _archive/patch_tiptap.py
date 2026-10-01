import re

# 1. Update admin.html
with open('admin.html', 'r') as f:
    admin_html = f.read()

tiptap_module = """
  <!-- DOMPurify -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script>
  <!-- TipTap -->
  <script type="module">
    import { Editor } from 'https://esm.sh/@tiptap/core@2';
    import StarterKit from 'https://esm.sh/@tiptap/starter-kit@2';
    window.TipTap = { Editor, StarterKit };
    window.dispatchEvent(new Event('tiptap-ready'));
  </script>
  <style>
    .tiptap-wrapper { border: 1px solid var(--border); border-radius: 4px; overflow: hidden; background: var(--surface); margin-top: var(--s-2); }
    .tiptap-toolbar { padding: var(--s-2); background: var(--surface-light); border-bottom: 1px solid var(--border); display: flex; gap: var(--s-2); }
    .tiptap-toolbar button { padding: var(--s-1) var(--s-3); font-size: var(--text-xs); background: transparent; border: 1px solid var(--border); color: var(--text); cursor: pointer; border-radius: 2px; }
    .tiptap-toolbar button:hover { background: var(--border); }
    .tiptap-editor { padding: var(--s-4); min-height: 120px; outline: none; }
    .tiptap-editor p { margin-bottom: var(--s-2); }
    .tiptap-editor blockquote { border-left: 3px solid var(--green); padding-left: var(--s-4); color: var(--gray-2); margin-left: 0; }
  </style>
"""

admin_html = admin_html.replace('</head>', tiptap_module + '\n</head>')
with open('admin.html', 'w') as f:
    f.write(admin_html)


# 2. Update admin.js
with open('admin.js', 'r') as f:
    admin_js = f.read()

tiptap_init = """
/* TipTap Initialization */
window.pfDescEditor = null;
window.pfContentEditor = null;
window.pfOutcomeEditor = null;

function initTipTap() {
  if (!window.TipTap) return;
  const { Editor, StarterKit } = window.TipTap;
  
  function createEditor(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return null;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'tiptap-wrapper';
    el.parentNode.insertBefore(wrapper, el);
    
    const toolbar = document.createElement('div');
    toolbar.className = 'tiptap-toolbar';
    toolbar.innerHTML = `
      <button type="button" data-command="bold"><b>B</b></button>
      <button type="button" data-command="italic"><i>I</i></button>
      <button type="button" data-command="blockquote">Quote</button>
    `;
    wrapper.appendChild(toolbar);
    
    const editorEl = document.createElement('div');
    editorEl.className = 'tiptap-editor';
    wrapper.appendChild(editorEl);
    
    el.style.display = 'none';
    
    const editor = new Editor({
      element: editorEl,
      extensions: [ StarterKit ],
      content: el.value,
      onUpdate: ({ editor }) => {
        el.value = editor.getHTML();
      }
    });
    
    toolbar.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
         e.preventDefault();
         const cmd = btn.getAttribute('data-command');
         if (cmd === 'bold') editor.chain().focus().toggleBold().run();
         if (cmd === 'italic') editor.chain().focus().toggleItalic().run();
         if (cmd === 'blockquote') editor.chain().focus().toggleBlockquote().run();
      });
    });
    
    return editor;
  }
  
  if (!window.pfDescEditor) window.pfDescEditor = createEditor('pf-desc');
  if (!window.pfContentEditor) window.pfContentEditor = createEditor('pf-content');
  if (!window.pfOutcomeEditor) window.pfOutcomeEditor = createEditor('pf-outcome');
}

window.addEventListener('tiptap-ready', initTipTap);
if (window.TipTap) initTipTap(); // In case it loaded before this script
"""

# Inject tiptap initialization at the bottom
admin_js += "\n" + tiptap_init

# Update the edit loading logic in openModal
edit_patch_str = """
      document.getElementById('pf-desc').value = project.description || '';
      if (window.pfDescEditor) window.pfDescEditor.commands.setContent(project.description || '');
      
      document.getElementById('pf-content').value = project.content || '';
      if (window.pfContentEditor) window.pfContentEditor.commands.setContent(project.content || '');

      document.getElementById('pf-outcome').value = project.outcome_text || '';
      if (window.pfOutcomeEditor) window.pfOutcomeEditor.commands.setContent(project.outcome_text || '');
"""

# We need to replace the old assignments in admin.js
admin_js = re.sub(r"document\.getElementById\('pf-desc'\)\.value = project\.description \|\| '';", "document.getElementById('pf-desc').value = project.description || '';\n      if (window.pfDescEditor) window.pfDescEditor.commands.setContent(project.description || '');", admin_js)
admin_js = re.sub(r"document\.getElementById\('pf-content'\)\.value = project\.content \|\| '';", "document.getElementById('pf-content').value = project.content || '';\n      if (window.pfContentEditor) window.pfContentEditor.commands.setContent(project.content || '');", admin_js)
admin_js = re.sub(r"document\.getElementById\('pf-outcome'\)\.value = project\.outcome_text \|\| '';", "document.getElementById('pf-outcome').value = project.outcome_text || '';\n      if (window.pfOutcomeEditor) window.pfOutcomeEditor.commands.setContent(project.outcome_text || '');", admin_js)

# Also clear the editors when opening for a NEW project
# Find the new project block:
new_project_block = """
      document.getElementById('pf-desc').value = '';
      if (window.pfDescEditor) window.pfDescEditor.commands.setContent('');
      document.getElementById('pf-content').value = '';
      if (window.pfContentEditor) window.pfContentEditor.commands.setContent('');
      document.getElementById('pf-outcome').value = '';
      if (window.pfOutcomeEditor) window.pfOutcomeEditor.commands.setContent('');
"""
admin_js = re.sub(r"document\.getElementById\('pf-desc'\)\.value = '';", "document.getElementById('pf-desc').value = '';\n      if (window.pfDescEditor) window.pfDescEditor.commands.setContent('');", admin_js)
admin_js = re.sub(r"document\.getElementById\('pf-content'\)\.value = '';", "document.getElementById('pf-content').value = '';\n      if (window.pfContentEditor) window.pfContentEditor.commands.setContent('');", admin_js)
admin_js = re.sub(r"document\.getElementById\('pf-outcome'\)\.value = '';", "document.getElementById('pf-outcome').value = '';\n      if (window.pfOutcomeEditor) window.pfOutcomeEditor.commands.setContent('');", admin_js)

with open('admin.js', 'w') as f:
    f.write(admin_js)

