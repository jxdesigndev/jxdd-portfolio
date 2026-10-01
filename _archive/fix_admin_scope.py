import re

with open('admin.js', 'r') as f:
    js = f.read()

# Remove initTipTap from the bottom
tip_tap_block = """/* TipTap Initialization */
window.pfDescEditor = null;
window.pfContentEditor = null;
window.pfOutcomeEditor = null;

function initTipTap() {
  if (!window.TipTap) return;
  const { Editor, StarterKit, Image } = window.TipTap;
  
  function createEditor(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return null;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'tiptap-wrapper';
    el.parentNode.insertBefore(wrapper, el);
    
    const toolbar = document.createElement('div');
    toolbar.className = 'tiptap-toolbar';
    toolbar.innerHTML = `
      <button type="button" data-command="bold" title="Bold"><b>B</b></button>
      <button type="button" data-command="italic" title="Italic"><i>I</i></button>
      <button type="button" data-command="blockquote" title="Blockquote">❝</button>
      <button type="button" data-command="bulletList" title="Bullet List">• List</button>
      <button type="button" data-command="orderedList" title="Numbered List">1. List</button>
      <button type="button" data-command="image" title="Add Image">📸 Image</button>
    `;
    wrapper.appendChild(toolbar);
    
    const editorEl = document.createElement('div');
    editorEl.className = 'tiptap-editor';
    wrapper.appendChild(editorEl);
    
    el.style.display = 'none';
    
    const editor = new Editor({
      element: editorEl,
      extensions: [ StarterKit, Image.configure({ HTMLAttributes: { class: 'tiptap-img' } }) ],
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
         if (cmd === 'bulletList') editor.chain().focus().toggleBulletList().run();
         if (cmd === 'orderedList') editor.chain().focus().toggleOrderedList().run();
         if (cmd === 'image') {
           const input = document.createElement('input');
           input.type = 'file';
           input.accept = 'image/*';
           input.onchange = async (e) => {
             const file = e.target.files[0];
             if (!file) return;
             try {
               const url = await uploadCompressedImage(file);
               editor.chain().focus().setImage({ src: url }).run();
             } catch(err) {
               console.error('Image upload failed', err);
               alert('Image upload failed: ' + err.message);
             }
           };
           input.click();
         }
      });
    });
    
    return editor;
  }
  
  if (!window.pfDescEditor) window.pfDescEditor = createEditor('pf-desc');
  if (!window.pfContentEditor) window.pfContentEditor = createEditor('pf-content');
  if (!window.pfOutcomeEditor) window.pfOutcomeEditor = createEditor('pf-outcome');
}

window.addEventListener('tiptap-ready', initTipTap);
if (window.TipTap) initTipTap(); // In case it loaded before this script"""

if tip_tap_block in js:
    js = js.replace(tip_tap_block, "")

    # Now inject it inside the IIFE right before checkAuth();
    injection_point = """  // Init
  checkAuth();"""
    
    new_injection = tip_tap_block + "\n\n" + injection_point
    js = js.replace(injection_point, new_injection)

    with open('admin.js', 'w') as f:
        f.write(js)
    print("Success")
else:
    print("Failed to find TipTap block")
