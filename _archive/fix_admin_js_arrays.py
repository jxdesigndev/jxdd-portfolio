import re

with open('admin.js', 'r') as f:
    js = f.read()

# 1. State variables and helper function
helper = """  let currentEditingProject = null;
  let currentEditingProcess = [];
  let currentEditingScreenshots = [];

  function renderMiniGallery(containerId, urlsArray) {
    const container = document.getElementById(containerId);
    container.innerHTML = urlsArray.map((url, i) => `
      <div class="admin-gallery-item">
        <img src="${url}">
        <button type="button" class="btn-remove" data-index="${i}" data-target="${containerId}">×</button>
      </div>
    `).join('');
    
    container.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        if (containerId === 'pf-process-preview') {
          currentEditingProcess.splice(idx, 1);
          renderMiniGallery('pf-process-preview', currentEditingProcess);
        } else {
          currentEditingScreenshots.splice(idx, 1);
          renderMiniGallery('pf-screenshots-preview', currentEditingScreenshots);
        }
      });
    });
  }
"""
js = js.replace('  let currentEditingProject = null;\n', helper)

# 2. Update openProjectModal preview setting
old_preview_logic = """      if (project.process_image_urls && project.process_image_urls.length > 0) {
        document.getElementById('pf-process-preview').textContent = `Current: ${project.process_image_urls.length} image(s) saved.`;
      }
      if (project.persona_image_url) {
        document.getElementById('pf-persona-preview').textContent = `Current: ${project.persona_image_url.split('/').pop()}`;
      }
      if (project.screenshot_urls && project.screenshot_urls.length > 0) {
        document.getElementById('pf-screenshots-preview').textContent = `Current: ${project.screenshot_urls.length} image(s) saved.`;
      }"""

new_preview_logic = """      currentEditingProcess = project.process_image_urls ? [...project.process_image_urls] : [];
      renderMiniGallery('pf-process-preview', currentEditingProcess);

      if (project.persona_image_url) {
        document.getElementById('pf-persona-preview').textContent = `Current: ${project.persona_image_url.split('/').pop()}`;
      }

      currentEditingScreenshots = project.screenshot_urls ? [...project.screenshot_urls] : [];
      renderMiniGallery('pf-screenshots-preview', currentEditingScreenshots);"""
js = js.replace(old_preview_logic, new_preview_logic)

# Also need to reset arrays when opening a blank new project
reset_old = """    document.getElementById('pf-process-preview').textContent = '';
    document.getElementById('pf-persona-preview').textContent = '';
    document.getElementById('pf-screenshots-preview').textContent = '';"""
reset_new = """    currentEditingProcess = [];
    currentEditingScreenshots = [];
    document.getElementById('pf-process-preview').innerHTML = '';
    document.getElementById('pf-persona-preview').textContent = '';
    document.getElementById('pf-screenshots-preview').innerHTML = '';"""
js = js.replace(reset_old, reset_new)

# 3. Update submit handler to append instead of overwrite
old_submit_process = """      let newProcessUrls = currentEditingProject ? currentEditingProject.process_image_urls : [];
      const processFiles = document.getElementById('pf-process').files;
      if (processFiles && processFiles.length > 0) {
        newProcessUrls = [];
        for (let i = 0; i < processFiles.length; i++) {
          const url = await uploadCompressedImage(processFiles[i]);
          newProcessUrls.push(url);
        }
      }"""

new_submit_process = """      let newProcessUrls = [...currentEditingProcess];
      const processFiles = document.getElementById('pf-process').files;
      if (processFiles && processFiles.length > 0) {
        for (let i = 0; i < processFiles.length; i++) {
          const url = await uploadCompressedImage(processFiles[i]);
          newProcessUrls.push(url);
        }
      }"""
js = js.replace(old_submit_process, new_submit_process)

old_submit_screens = """      let newScreenshots = currentEditingProject ? currentEditingProject.screenshot_urls : [];
      const screenshotFiles = document.getElementById('pf-screenshots').files;
      if (screenshotFiles && screenshotFiles.length > 0) {
        newScreenshots = [];
        for (let i = 0; i < screenshotFiles.length; i++) {
          const url = await uploadCompressedImage(screenshotFiles[i]);
          newScreenshots.push(url);
        }
      }"""

new_submit_screens = """      let newScreenshots = [...currentEditingScreenshots];
      const screenshotFiles = document.getElementById('pf-screenshots').files;
      if (screenshotFiles && screenshotFiles.length > 0) {
        for (let i = 0; i < screenshotFiles.length; i++) {
          const url = await uploadCompressedImage(screenshotFiles[i]);
          newScreenshots.push(url);
        }
      }"""
js = js.replace(old_submit_screens, new_submit_screens)

with open('admin.js', 'w') as f:
    f.write(js)
