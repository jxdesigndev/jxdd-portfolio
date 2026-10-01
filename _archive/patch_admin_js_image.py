import re

with open('admin.js', 'r') as f:
    content = f.read()

# 1. Add reset for pf-image-preview
content = content.replace(
    "document.getElementById('pf-cover-preview').textContent = '';",
    "document.getElementById('pf-image-preview').textContent = '';\n    document.getElementById('pf-cover-preview').textContent = '';"
)

# 2. Change how pf-image is populated initially (it was `.value = project.image_url || ''`)
# Remove the old .value assignment
content = content.replace("document.getElementById('pf-image').value = project.image_url || '';", "")

# Add preview setting
preview_code = """      if (project.cover_image_url) {"""
new_preview_code = """      if (project.image_url) {
        document.getElementById('pf-image-preview').textContent = `Current: ${project.image_url.split('/').pop()}`;
      }
""" + preview_code
content = content.replace(preview_code, new_preview_code)

# 3. Update the submit handler upload logic for pf-image
upload_logic_marker = "      let newCoverUrl = currentEditingProject ? currentEditingProject.cover_image_url : null;"
new_upload_logic = """      let newImageUrl = currentEditingProject ? currentEditingProject.image_url : null;
      const imageFile = document.getElementById('pf-image').files[0];
      if (imageFile) {
        newImageUrl = await uploadCompressedImage(imageFile);
      }

""" + upload_logic_marker
content = content.replace(upload_logic_marker, new_upload_logic)

# 4. Update the payload object to use newImageUrl instead of getting from DOM
payload_marker = "image_url: document.getElementById('pf-image').value.trim(),"
new_payload_marker = "image_url: newImageUrl,"
content = content.replace(payload_marker, new_payload_marker)

with open('admin.js', 'w') as f:
    f.write(content)
