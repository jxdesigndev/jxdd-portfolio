import re

with open('admin.html', 'r') as f:
    html = f.read()

html = html.replace(
    '<label class="form-label" for="pf-image">Thumbnail Image (Listings, single)</label>\n          <input type="file" id="pf-image" class="form-input" accept="image/*">',
    '<label class="form-label" for="pf-image">Thumbnail — Image or Video (Listings, single)</label>\n          <input type="file" id="pf-image" class="form-input" accept="image/*,video/mp4,video/webm">'
)

html = html.replace(
    '<label class="form-label" for="pf-cover">Cover Image (single)</label>\n            <input type="file" id="pf-cover" class="form-input" accept="image/*">',
    '<label class="form-label" for="pf-cover">Cover — Image or Video (single)</label>\n            <input type="file" id="pf-cover" class="form-input" accept="image/*,video/mp4,video/webm">'
)

with open('admin.html', 'w') as f:
    f.write(html)


with open('admin.js', 'r') as f:
    js = f.read()

js = js.replace('''      let newImageUrl = currentEditingProject ? currentEditingProject.image_url : null;
      const imageFile = document.getElementById('pf-image').files[0];
      if (imageFile) {
        newImageUrl = await uploadCompressedImage(imageFile);
      }

      let newCoverUrl = currentEditingProject ? currentEditingProject.cover_image_url : null;
      const coverFile = document.getElementById('pf-cover').files[0];
      if (coverFile) {
        newCoverUrl = await uploadCompressedImage(coverFile);
      }''', '''      let newImageUrl = currentEditingProject ? currentEditingProject.image_url : null;
      const imageFile = document.getElementById('pf-image').files[0];
      if (imageFile) {
        if (imageFile.type.startsWith('video/')) {
          newImageUrl = await uploadRawFile(imageFile);
        } else {
          newImageUrl = await uploadCompressedImage(imageFile);
        }
      }

      let newCoverUrl = currentEditingProject ? currentEditingProject.cover_image_url : null;
      const coverFile = document.getElementById('pf-cover').files[0];
      if (coverFile) {
        if (coverFile.type.startsWith('video/')) {
          newCoverUrl = await uploadRawFile(coverFile);
        } else {
          newCoverUrl = await uploadCompressedImage(coverFile);
        }
      }''')

upload_raw = """
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
''' + upload_raw)

js = js.replace('''    const toolbar = document.createElement('div');
    toolbar.className = 'tiptap-toolbar';
    toolbar.innerHTML = `
      <button type="button" data-command="bold"><b>B</b></button>
      <button type="button" data-command="italic"><i>I</i></button>
      <button type="button" data-command="blockquote">Quote</button>
    `;''', '''    const toolbar = document.createElement('div');
    toolbar.className = 'tiptap-toolbar';
    toolbar.innerHTML = `
      <button type="button" data-command="bold" title="Bold"><b>B</b></button>
      <button type="button" data-command="italic" title="Italic"><i>I</i></button>
      <button type="button" data-command="blockquote" title="Blockquote">❝</button>
      <button type="button" data-command="bulletList" title="Bullet List">• List</button>
      <button type="button" data-command="orderedList" title="Numbered List">1. List</button>
    `;''')

js = js.replace('''         const cmd = btn.getAttribute('data-command');
         if (cmd === 'bold') editor.chain().focus().toggleBold().run();
         if (cmd === 'italic') editor.chain().focus().toggleItalic().run();
         if (cmd === 'blockquote') editor.chain().focus().toggleBlockquote().run();
      });''', '''         const cmd = btn.getAttribute('data-command');
         if (cmd === 'bold') editor.chain().focus().toggleBold().run();
         if (cmd === 'italic') editor.chain().focus().toggleItalic().run();
         if (cmd === 'blockquote') editor.chain().focus().toggleBlockquote().run();
         if (cmd === 'bulletList') editor.chain().focus().toggleBulletList().run();
         if (cmd === 'orderedList') editor.chain().focus().toggleOrderedList().run();
      });''')

with open('admin.js', 'w') as f:
    f.write(js)
