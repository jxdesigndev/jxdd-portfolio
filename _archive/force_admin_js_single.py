import re

with open('admin.js', 'r') as f:
    js = f.read()

# 1. State variables
state_old = """  let currentEditingProject = null;
  let currentEditingProcess = [];
  let currentEditingScreenshots = [];"""

state_new = """  let currentEditingProject = null;
  let currentEditingProcess = [];
  let currentEditingScreenshots = [];
  let currentEditingThumbnail = null;
  let currentEditingCover = null;
  let currentEditingPersona = null;"""

js = js.replace(state_old, state_new)

# 2. Add single thumbnail render function
render_single = """  function renderSingleGallery(containerId, url, stateKey) {
    const container = document.getElementById(containerId);
    if (!url) {
      container.innerHTML = '';
      return;
    }
    
    // Check if it's a video
    const isVid = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
    const mediaTag = isVid ? `<video src="${url}" muted playsinline></video>` : `<img src="${url}">`;
    
    container.innerHTML = `
      <div class="admin-gallery-item">
        ${mediaTag}
        <button type="button" class="btn-remove" data-target="${containerId}">×</button>
      </div>
    `;
    
    container.querySelector('.btn-remove').addEventListener('click', () => {
      if (stateKey === 'thumbnail') currentEditingThumbnail = null;
      if (stateKey === 'cover') currentEditingCover = null;
      if (stateKey === 'persona') currentEditingPersona = null;
      renderSingleGallery(containerId, null, stateKey);
    });
  }
"""
js = js.replace('  function renderMiniGallery(containerId, urlsArray) {', render_single + '\n  function renderMiniGallery(containerId, urlsArray) {')

# 3. Update openProjectModal resets
reset_old = """    DOM.projectForm.reset();
    document.getElementById('pf-image-preview').textContent = '';
    document.getElementById('pf-cover-preview').textContent = '';
    currentEditingProcess = [];
    currentEditingScreenshots = [];
    document.getElementById('pf-process-preview').innerHTML = '';
    document.getElementById('pf-persona-preview').textContent = '';
    document.getElementById('pf-screenshots-preview').innerHTML = '';"""

reset_new = """    DOM.projectForm.reset();
    currentEditingThumbnail = null;
    currentEditingCover = null;
    currentEditingPersona = null;
    currentEditingProcess = [];
    currentEditingScreenshots = [];
    document.getElementById('pf-image-preview').innerHTML = '';
    document.getElementById('pf-cover-preview').innerHTML = '';
    document.getElementById('pf-process-preview').innerHTML = '';
    document.getElementById('pf-persona-preview').innerHTML = '';
    document.getElementById('pf-screenshots-preview').innerHTML = '';"""

js = js.replace(reset_old, reset_new)

# 4. Update openProjectModal loads
load_old = """      if (project.image_url) {
        document.getElementById('pf-image-preview').textContent = `Current: ${project.image_url.split('/').pop()}`;
      }
      if (project.cover_image_url) {
        document.getElementById('pf-cover-preview').textContent = `Current: ${project.cover_image_url.split('/').pop()}`;
      }
      currentEditingProcess = project.process_image_urls ? [...project.process_image_urls] : [];
      renderMiniGallery('pf-process-preview', currentEditingProcess);

      if (project.persona_image_url) {
        document.getElementById('pf-persona-preview').textContent = `Current: ${project.persona_image_url.split('/').pop()}`;
      }"""

load_new = """      currentEditingThumbnail = project.image_url || null;
      renderSingleGallery('pf-image-preview', currentEditingThumbnail, 'thumbnail');
      
      currentEditingCover = project.cover_image_url || null;
      renderSingleGallery('pf-cover-preview', currentEditingCover, 'cover');

      currentEditingProcess = project.process_image_urls ? [...project.process_image_urls] : [];
      renderMiniGallery('pf-process-preview', currentEditingProcess);

      currentEditingPersona = project.persona_image_url || null;
      renderSingleGallery('pf-persona-preview', currentEditingPersona, 'persona');"""

js = js.replace(load_old, load_new)

# 5. Update submit logic
sub_old_img = """      let newImageUrl = currentEditingProject ? currentEditingProject.image_url : null;
      const imageFile = document.getElementById('pf-image').files[0];"""
sub_new_img = """      let newImageUrl = currentEditingThumbnail;
      const imageFile = document.getElementById('pf-image').files[0];"""
js = js.replace(sub_old_img, sub_new_img)

sub_old_cov = """      let newCoverUrl = currentEditingProject ? currentEditingProject.cover_image_url : null;
      const coverFile = document.getElementById('pf-cover').files[0];"""
sub_new_cov = """      let newCoverUrl = currentEditingCover;
      const coverFile = document.getElementById('pf-cover').files[0];"""
js = js.replace(sub_old_cov, sub_new_cov)

sub_old_per = """      let newPersonaUrl = currentEditingProject ? currentEditingProject.persona_image_url : null;
      const personaFile = document.getElementById('pf-persona').files[0];"""
sub_new_per = """      let newPersonaUrl = currentEditingPersona;
      const personaFile = document.getElementById('pf-persona').files[0];"""
js = js.replace(sub_old_per, sub_new_per)

with open('admin.js', 'w') as f:
    f.write(js)
