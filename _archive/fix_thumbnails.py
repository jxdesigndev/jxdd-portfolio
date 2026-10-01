import re

# 1. Update script.js
with open('script.js', 'r') as f:
    script_js = f.read()

# Helper for video
script_helper = """
  // Format Projects
  function renderProject(p) {
    const isVid = p.image_url && (p.image_url.toLowerCase().endsWith('.mp4') || p.image_url.toLowerCase().endsWith('.webm'));
"""
script_js = re.sub(r'  // Format Projects\n  function renderProject\(p\) \{', script_helper, script_js)

# Image part
img_part_old = """    const imagePart = p.image_url
      ? `<img src="${p.image_url}" alt="${p.title}" class="project-card-image" loading="lazy">`
      : `<div class="project-card-placeholder">${(p.title || 'JX').slice(0,2).toUpperCase()}</div>`;"""
img_part_new = """    const imagePart = p.image_url
      ? (isVid 
          ? `<video src="${p.image_url}" class="project-card-image" autoplay loop muted playsinline loading="lazy"></video>` 
          : `<img src="${p.image_url}" alt="${p.title}" class="project-card-image" loading="lazy">`)
      : `<div class="project-card-placeholder">${(p.title || 'JX').slice(0,2).toUpperCase()}</div>`;"""
script_js = script_js.replace(img_part_old, img_part_new)

# Modal image part
modal_img_old = """    const imagePart = p.image_url
      ? `<div class="modal-image-pane" style="background:var(--surface-2);">
           <img src="${p.image_url}" alt="${p.title}" style="object-fit:contain;background:var(--surface-2);">
           <div class="modal-image-overlay"></div>
         </div>`
      : `<div class="modal-image-pane" style="background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:5rem;font-weight:800;color:var(--green);">
           ${(p.title || '').slice(0,2).toUpperCase()}
         </div>`;"""
modal_img_new = """    const isVidModal = p.image_url && (p.image_url.toLowerCase().endsWith('.mp4') || p.image_url.toLowerCase().endsWith('.webm'));
    const imagePart = p.image_url
      ? `<div class="modal-image-pane" style="background:var(--surface-2);">
           ${isVidModal 
             ? `<video src="${p.image_url}" style="object-fit:cover;background:var(--surface-2);width:100%;height:100%;" autoplay loop muted playsinline></video>`
             : `<img src="${p.image_url}" alt="${p.title}" style="object-fit:contain;background:var(--surface-2);">`}
           <div class="modal-image-overlay"></div>
         </div>`
      : `<div class="modal-image-pane" style="background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:5rem;font-weight:800;color:var(--green);">
           ${(p.title || '').slice(0,2).toUpperCase()}
         </div>`;"""
script_js = script_js.replace(modal_img_old, modal_img_new)

with open('script.js', 'w') as f:
    f.write(script_js)


# 2. Update work.js
with open('work.js', 'r') as f:
    work_js = f.read()

# Helper for video
work_helper = """
  // Render a project card
  function renderProject(p) {
    const isVid = p.image_url && (p.image_url.toLowerCase().endsWith('.mp4') || p.image_url.toLowerCase().endsWith('.webm'));
"""
work_js = re.sub(r'  // Render a project card\n  function renderProject\(p\) \{', work_helper, work_js)

img_old = """    const img   = p.image_url
      ? `<img src="${p.image_url}" alt="${p.title}" class="work-card-image" loading="lazy">`
      : `<div class="work-card-placeholder">${(p.title || 'JX').slice(0, 2).toUpperCase()}</div>`;"""
img_new = """    const img   = p.image_url
      ? (isVid 
          ? `<video src="${p.image_url}" class="work-card-image" autoplay loop muted playsinline loading="lazy"></video>`
          : `<img src="${p.image_url}" alt="${p.title}" class="work-card-image" loading="lazy">`)
      : `<div class="work-card-placeholder">${(p.title || 'JX').slice(0, 2).toUpperCase()}</div>`;"""
work_js = work_js.replace(img_old, img_new)

vault_old = """    const imagePart = p.image_url
      ? `<div class="vault-modal-image" style="background:var(--surface-2);">
           <img src="${p.image_url}" alt="${p.title}" style="object-fit:contain;width:100%;height:100%;background:var(--surface-2);">
           <div class="vault-modal-image-overlay"></div>
         </div>`
      : `<div class="vault-modal-image" style="background:var(--surface-2); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-size:4rem; font-weight:800; color:var(--green);">
           ${(p.title || '').slice(0,2).toUpperCase()}
         </div>`;"""
vault_new = """    const isVidModal = p.image_url && (p.image_url.toLowerCase().endsWith('.mp4') || p.image_url.toLowerCase().endsWith('.webm'));
    const imagePart = p.image_url
      ? `<div class="vault-modal-image" style="background:var(--surface-2);">
           ${isVidModal
             ? `<video src="${p.image_url}" style="object-fit:cover;width:100%;height:100%;background:var(--surface-2);" autoplay loop muted playsinline></video>`
             : `<img src="${p.image_url}" alt="${p.title}" style="object-fit:contain;width:100%;height:100%;background:var(--surface-2);">`}
           <div class="vault-modal-image-overlay"></div>
         </div>`
      : `<div class="vault-modal-image" style="background:var(--surface-2); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-size:4rem; font-weight:800; color:var(--green);">
           ${(p.title || '').slice(0,2).toUpperCase()}
         </div>`;"""
work_js = work_js.replace(vault_old, vault_new)

with open('work.js', 'w') as f:
    f.write(work_js)

