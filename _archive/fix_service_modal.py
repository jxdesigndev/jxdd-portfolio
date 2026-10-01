import re

with open('admin.js', 'r') as f:
    js = f.read()

old_serv = """  function openServiceModal(sv) {
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
      document.getElementById('sv-priority').value = sv.priority || 0;
      document.getElementById('sv-active').checked = sv.is_active !== false;
      DOM.btnDeleteService.style.display = 'block';
    } else {
      DOM.serviceModalTitle.textContent = 'Add Service';
      document.getElementById('sv-id').value = '';
      document.getElementById('sv-active').checked = true;
      document.getElementById('sv-image-preview').textContent = '';
      document.getElementById('sv-video-preview').textContent = '';
      DOM.btnDeleteService.style.display = 'none';
    }"""

new_serv = """  function openServiceModal(sv) {
    if (!DOM.serviceForm) return;
    currentEditingService = sv || null;
    DOM.serviceForm.reset();
    
    currentEditingServiceImage = null;
    currentEditingServiceVideo = null;
    document.getElementById('sv-image-preview').innerHTML = '';
    document.getElementById('sv-video-preview').innerHTML = '';

    if (sv) {
      DOM.serviceModalTitle.textContent = 'Edit Service';
      document.getElementById('sv-id').value = sv.id;
      document.getElementById('sv-name').value = sv.name || '';
      document.getElementById('sv-desc').value = sv.description || '';
      document.getElementById('sv-icon').value = sv.icon || '';
      document.getElementById('sv-label').value = sv.label || '';
      document.getElementById('sv-tool-category').value = sv.tool_category || '';
      document.getElementById('sv-deliverables').value = (sv.deliverables || []).join(', ');
      
      currentEditingServiceImage = sv.image_url || null;
      renderSingleGallery('sv-image-preview', currentEditingServiceImage, 'serviceImg');
      
      currentEditingServiceVideo = sv.video_url || null;
      renderSingleGallery('sv-video-preview', currentEditingServiceVideo, 'serviceVid');
      
      document.getElementById('sv-priority').value = sv.priority || 0;
      document.getElementById('sv-active').checked = sv.is_active !== false;
      DOM.btnDeleteService.style.display = 'block';
    } else {
      DOM.serviceModalTitle.textContent = 'Add Service';
      document.getElementById('sv-id').value = '';
      document.getElementById('sv-active').checked = true;
      DOM.btnDeleteService.style.display = 'none';
    }"""

js = js.replace(old_serv, new_serv)

with open('admin.js', 'w') as f:
    f.write(js)
