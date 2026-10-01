import re

with open('admin.js', 'r') as f:
    js = f.read()

# 1. Add uploadRawFile function
upload_raw_func = """
  async function uploadRawFile(file) {
    if (!file) throw new Error('No file selected.');
    const ext = file.name.split('.').pop().toLowerCase();
    const uniqueName = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { data, error } = await supabase.storage
      .from('portfolio_media')
      .upload(uniqueName, file, { contentType: file.type });
    if (error) throw error;
    const { data: publicData } = supabase.storage
      .from('portfolio_media')
      .getPublicUrl(uniqueName);
    if (!publicData || !publicData.publicUrl) throw new Error('Failed to get public URL.');
    return publicData.publicUrl;
  }
"""

js = js.replace('''    img.onerror = () => reject(new Error('Failed to load image for compression.'));
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }''', '''    img.onerror = () => reject(new Error('Failed to load image for compression.'));
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
''' + upload_raw_func)

# 2. Update TipTap Init
tiptap_old = """function initTipTap() {
  if (!window.TipTap) return;
  const { Editor, StarterKit } = window.TipTap;
  
  function createEditor(elementId) {"""

tiptap_new = """function initTipTap() {
  if (!window.TipTap) return;
  const { Editor, StarterKit, Image } = window.TipTap;
  
  function createEditor(elementId) {"""
js = js.replace(tiptap_old, tiptap_new)

ext_old = """      extensions: [StarterKit],"""
ext_new = """      extensions: [StarterKit, Image.configure({ HTMLAttributes: { class: 'tiptap-img' } })],"""
js = js.replace(ext_old, ext_new)

toolbar_old = """      <button type="button" data-command="bulletList" title="Bullet List">• List</button>
      <button type="button" data-command="orderedList" title="Numbered List">1. List</button>
    `;"""

toolbar_new = """      <button type="button" data-command="bulletList" title="Bullet List">• List</button>
      <button type="button" data-command="orderedList" title="Numbered List">1. List</button>
      <button type="button" data-command="image" title="Add Image">📸 Image</button>
    `;"""
js = js.replace(toolbar_old, toolbar_new)

click_old = """         if (cmd === 'orderedList') editor.chain().focus().toggleOrderedList().run();
      });"""

click_new = """         if (cmd === 'orderedList') editor.chain().focus().toggleOrderedList().run();
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
      });"""
js = js.replace(click_old, click_new)

with open('admin.js', 'w') as f:
    f.write(js)
