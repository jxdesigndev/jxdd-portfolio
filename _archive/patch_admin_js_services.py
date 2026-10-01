import re

with open('admin.js', 'r') as f:
    content = f.read()

# 1. Add currentEditingService
old_all_services = """  /* ── SERVICES ── */
  let allServices = [];"""
new_all_services = """  /* ── SERVICES ── */
  let allServices = [];
  let currentEditingService = null;"""
content = content.replace(old_all_services, new_all_services)


# 2. Update openServiceModal
old_modal_open = """  function openServiceModal(sv) {
    if (!DOM.serviceForm) return;
    DOM.serviceForm.reset();
    if (sv) {
      DOM.serviceModalTitle.textContent = 'Edit Service';
      document.getElementById('sv-id').value = sv.id;
      document.getElementById('sv-name').value = sv.name || '';
      document.getElementById('sv-desc').value = sv.description || '';
      document.getElementById('sv-icon').value = sv.icon || '';
      document.getElementById('sv-label').value = sv.label || '';
      document.getElementById('sv-tool-category').value = sv.tool_category || '';
      document.getElementById('sv-deliverables').value = (sv.deliverables || []).join(', ');
      document.getElementById('sv-image-preview').textContent = sv.image_url || '';
      document.getElementById('sv-video-preview').textContent = sv.video_url || '';
      document.getElementById('sv-priority').value = sv.priority || 0;"""

new_modal_open = """  function openServiceModal(sv) {
    if (!DOM.serviceForm) return;
    currentEditingService = sv || null;
    DOM.serviceForm.reset();
    if (sv) {
      DOM.serviceModalTitle.textContent = 'Edit Service';
      document.getElementById('sv-id').value = sv.id;
      document.getElementById('sv-name').value = sv.name || '';
      document.getElementById('sv-desc').value = sv.description || '';
      document.getElementById('sv-icon').value = sv.icon || '';
      document.getElementById('sv-label').value = sv.label || '';
      document.getElementById('sv-tool-category').value = sv.tool_category || '';
      document.getElementById('sv-deliverables').value = (sv.deliverables || []).join(', ');
      document.getElementById('sv-image-preview').textContent = sv.image_url ? `Current: ${sv.image_url.split('/').pop()}` : '';
      document.getElementById('sv-video-preview').textContent = sv.video_url ? `Current: ${sv.video_url.split('/').pop()}` : '';
      document.getElementById('sv-priority').value = sv.priority || 0;"""
content = content.replace(old_modal_open, new_modal_open)


# 3. Update submit handler
old_submit = """        const imgFile = document.getElementById('sv-image').files[0];
        const videoFile = document.getElementById('sv-video').files[0];
        
        let imgUrl = document.getElementById('sv-image-preview').textContent;
        let videoUrl = document.getElementById('sv-video-preview').textContent;
        
        if (imgFile) imgUrl = await uploadCompressedImage(imgFile);"""

new_submit = """        const imgFile = document.getElementById('sv-image').files[0];
        const videoFile = document.getElementById('sv-video').files[0];
        
        let imgUrl = currentEditingService ? currentEditingService.image_url : null;
        let videoUrl = currentEditingService ? currentEditingService.video_url : null;
        
        if (imgFile) imgUrl = await uploadCompressedImage(imgFile);"""
content = content.replace(old_submit, new_submit)


with open('admin.js', 'w') as f:
    f.write(content)
