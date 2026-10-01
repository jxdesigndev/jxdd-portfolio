import re

with open('admin.js', 'r') as f:
    content = f.read()

services_crud = """
  /* ── SERVICES ── */
  let allServices = [];

  async function loadServices() {
    if (!DOM.servicesTbody) return;
    const { data, error } = await supabase.from('services').select('*').order('priority', { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    allServices = data;
    renderServices();
  }

  function renderServices() {
    if (allServices.length === 0) {
      DOM.servicesTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No services found.</td></tr>`;
      return;
    }
    
    DOM.servicesTbody.innerHTML = allServices.map(sv => `
      <tr>
        <td>${sv.priority || 0}</td>
        <td style="color:var(--white);">${sv.name}</td>
        <td>${sv.tool_category || '-'}</td>
        <td style="text-align:center;">
          <span style="color:${sv.is_active ? 'var(--green)' : 'var(--red)'}">${sv.is_active ? 'Yes' : 'No'}</span>
        </td>
        <td style="text-align:right;">
          <button class="btn btn-ghost btn-sm" onclick="window.editService('${sv.id}')">Edit</button>
        </td>
      </tr>
    `).join('');
  }

  window.editService = (id) => {
    const sv = allServices.find(s => s.id === id);
    if (sv) openServiceModal(sv);
  };

  function openServiceModal(sv) {
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
    }
    DOM.serviceModal.classList.add('open');
  }

  if (DOM.btnNewService) {
    DOM.btnNewService.addEventListener('click', () => openServiceModal(null));
  }

  if (DOM.serviceModalClose) {
    DOM.serviceModalClose.addEventListener('click', () => {
      DOM.serviceModal.classList.remove('open');
    });
  }

  if (DOM.serviceForm) {
    DOM.serviceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const btn = DOM.serviceForm.querySelector('button[type="submit"]');
      const oldText = btn.textContent;
      btn.textContent = 'Saving...';
      btn.disabled = true;

      try {
        const id = document.getElementById('sv-id').value;
        const imgFile = document.getElementById('sv-image').files[0];
        const videoFile = document.getElementById('sv-video').files[0];
        
        let imgUrl = document.getElementById('sv-image-preview').textContent;
        let videoUrl = document.getElementById('sv-video-preview').textContent;
        
        if (imgFile) imgUrl = await uploadCompressedImage(imgFile);
        if (videoFile) videoUrl = await uploadMedia(videoFile);
        
        const rawDeliverables = document.getElementById('sv-deliverables').value || '';
        const deliverablesArr = rawDeliverables.split(',').map(s => s.trim()).filter(Boolean);

        const payload = {
          name: document.getElementById('sv-name').value.trim(),
          description: document.getElementById('sv-desc').value.trim() || null,
          icon: document.getElementById('sv-icon').value.trim() || null,
          label: document.getElementById('sv-label').value.trim() || null,
          tool_category: document.getElementById('sv-tool-category').value.trim() || null,
          deliverables: deliverablesArr,
          image_url: imgUrl || null,
          video_url: videoUrl || null,
          priority: parseInt(document.getElementById('sv-priority').value) || 0,
          is_active: document.getElementById('sv-active').checked,
        };

        if (id) {
          const { error } = await supabase.from('services').update(payload).eq('id', id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('services').insert([payload]);
          if (error) throw error;
        }

        DOM.serviceModal.classList.remove('open');
        loadServices();
      } catch (err) {
        console.error('Service save error:', err);
        alert('Failed to save service: ' + err.message);
      } finally {
        btn.textContent = oldText;
        btn.disabled = false;
      }
    });
  }

  if (DOM.btnDeleteService) {
    DOM.btnDeleteService.addEventListener('click', async () => {
      const id = document.getElementById('sv-id').value;
      if (!id) return;
      if (confirm('Are you sure you want to delete this service permanently?')) {
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (!error) {
          DOM.serviceModal.classList.remove('open');
          loadServices();
        }
      }
    });
  }
"""

content = content.replace("  // Init\n  checkAuth();", services_crud + "\n  // Init\n  checkAuth();")

with open('admin.js', 'w') as f:
    f.write(content)
