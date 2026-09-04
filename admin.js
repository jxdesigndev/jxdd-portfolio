/* ================================================================
   JX UNIVERSE — admin.js
   Command Center Logic
   ================================================================ */

'use strict';

(function () {
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const DOM = {
    login: document.getElementById('admin-login'),
    dashboard: document.getElementById('admin-dashboard'),
    loginForm: document.getElementById('login-form'),
    loginEmail: document.getElementById('login-email'),
    loginPass: document.getElementById('login-password'),
    loginErr: document.getElementById('login-error'),
    btnLogout: document.getElementById('btn-logout'),

    tabs: document.querySelectorAll('.admin-nav-btn'),
    sections: document.querySelectorAll('.admin-tab-content'),

    projectsTbody: document.getElementById('projects-tbody'),
    btnNewProject: document.getElementById('btn-new-project'),
    
    projectModal: document.getElementById('project-modal'),
    projectModalTitle: document.getElementById('project-modal-title'),
    projectModalClose: document.getElementById('project-modal-close'),
    projectForm: document.getElementById('project-form'),
    btnDeleteProject: document.getElementById('btn-delete-project'),

    messagesTbody: document.getElementById('messages-tbody'),
    messageModal: document.getElementById('message-modal'),
    messageModalClose: document.getElementById('message-modal-close'),

    experienceTbody: document.getElementById('experience-tbody'),
    btnNewExperience: document.getElementById('btn-new-experience'),
    experienceModal: document.getElementById('experience-modal'),
    experienceModalTitle: document.getElementById('experience-modal-title'),
    experienceModalClose: document.getElementById('experience-modal-close'),
    experienceForm: document.getElementById('experience-form'),
    btnDeleteExperience: document.getElementById('btn-delete-experience'),

    testimonialsTbody: document.getElementById('testimonials-tbody'),
    btnNewTestimonial: document.getElementById('btn-new-testimonial'),
    testimonialModal: document.getElementById('testimonial-modal'),
    testimonialModalTitle: document.getElementById('testimonial-modal-title'),
    testimonialModalClose: document.getElementById('testimonial-modal-close'),
    testimonialForm: document.getElementById('testimonial-form'),
    btnDeleteTestimonial: document.getElementById('btn-delete-testimonial'),

    settingsForm: document.getElementById('settings-form'),

    servicesTbody: document.getElementById('tbody-services'),
    btnNewService: document.getElementById('btn-new-service'),
    serviceModal: document.getElementById('service-modal-overlay'),
    serviceModalTitle: document.getElementById('service-modal-title'),
    serviceModalClose: document.getElementById('service-modal-close'),
    serviceForm: document.getElementById('service-form'),
    btnDeleteService: document.getElementById('btn-delete-service'),
    settingAvailability: document.getElementById('setting-availability'),

    videoForm: document.getElementById('video-form'),
    settingAboutVideo: document.getElementById('setting-about-video'),
    settingAboutVideoPreview: document.getElementById('setting-about-video-preview'),
    settingAboutPoster: document.getElementById('setting-about-poster'),
    settingAboutPosterPreview: document.getElementById('setting-about-poster-preview'),
    btnUploadVideo: document.getElementById('btn-upload-video'),

    socialsForm: document.getElementById('socials-form'),
    settingSocialTwitter: document.getElementById('setting-social-twitter'),
    settingSocialLinkedin: document.getElementById('setting-social-linkedin'),
    settingSocialGithub: document.getElementById('setting-social-github'),
    settingSocialDribbble: document.getElementById('setting-social-dribbble'),
    settingSocialInstagram: document.getElementById('setting-social-instagram'),
    settingSocialContra: document.getElementById('setting-social-contra'),
    settingSocialUpwork: document.getElementById('setting-social-upwork'),

    toolsTbody: document.getElementById('tools-tbody'),
    btnNewTool: document.getElementById('btn-new-tool'),
    toolModal: document.getElementById('tool-modal'),
    toolModalTitle: document.getElementById('tool-modal-title'),
    toolModalClose: document.getElementById('tool-modal-close'),
    toolForm: document.getElementById('tool-form'),
    btnDeleteTool: document.getElementById('btn-delete-tool')
  };

  let session = null;
  let allProjects = [];
  let allMessages = [];
  let allExperience = [];
  let allTestimonials = [];
  let allTools = [];

  /* ── AUTHENTICATION ── */

  async function checkAuth() {
    try {
      if (window.initSupabase) await window.initSupabase();
    } catch (err) {
      DOM.loginErr.style.display = 'block';
      DOM.loginErr.textContent = 'Failed to connect — check your connection and reload';
      return;
    }
    if (typeof supabase === 'undefined' || !supabase.auth) {
      DOM.loginErr.style.display = 'block';
      DOM.loginErr.textContent = 'Database offline.';
      return;
    }
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession) {
      session = currentSession;
      showDashboard();
    }
  }

  DOM.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = DOM.loginEmail.value.trim();
    const password = DOM.loginPass.value.trim();
    
    DOM.loginErr.style.display = 'none';
    const btn = DOM.loginForm.querySelector('button');
    const oldText = btn.textContent;
    btn.textContent = 'Authenticating...';
    btn.disabled = true;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      session = data.session;
      showDashboard();
    } catch (err) {
      DOM.loginErr.style.display = 'block';
      DOM.loginErr.textContent = 'Auth failed: ' + err.message;
    } finally {
      btn.textContent = 'INITIATE_HANDSHAKE ↗';
      btn.disabled = false;
    }
  });

  DOM.btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    session = null;
    DOM.dashboard.style.display = 'none';
    DOM.login.style.display = 'flex';
  });

  function showDashboard() {
    DOM.login.style.display = 'none';
    DOM.dashboard.style.display = 'flex';
    loadProjects();
    loadMessages();
    loadSettings();
    loadExperience();
    loadTestimonials();
    loadTools();
    loadServices();
  }

  /* ── NAVIGATION ── */
  DOM.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      DOM.tabs.forEach(t => t.classList.remove('active'));
      DOM.sections.forEach(s => s.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  /* ── PROJECTS ── */
  async function loadProjects() {
    const { data, error } = await supabase.from('projects').select('*').order('priority', { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    allProjects = data;
    renderProjects();
  }

  function renderProjects() {
    if (allProjects.length === 0) {
      DOM.projectsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No projects found.</td></tr>`;
      return;
    }
    
    DOM.projectsTbody.innerHTML = allProjects.map(p => `
      <tr>
        <td>${p.priority || 0}</td>
        <td style="color:var(--white);">${p.title}</td>
        <td>${p.category || '-'}</td>
        <td>${p.year || '-'}</td>
        <td>
          <button class="btn btn-ghost btn-sm btn-edit-project" data-id="${p.id}">Edit</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.btn-edit-project').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const project = allProjects.find(x => x.id == id);
        if (project) openProjectModal(project);
      });
    });
  }

  DOM.btnNewProject.addEventListener('click', () => openProjectModal(null));

  let currentEditingProject = null;
  let currentEditingProcess = [];
  let currentEditingScreenshots = [];
  let currentEditingThumbnail = null;
  let currentEditingCover = null;
  let currentEditingPersona = null;

  function renderSingleGallery(containerId, url, stateKey) {
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
      if (stateKey === 'testLogo') currentEditingTestimonialLogo = null;
      if (stateKey === 'testVideo') currentEditingTestimonialVideo = null;
      if (stateKey === 'testPhoto') currentEditingTestimonialPhoto = null;
      if (stateKey === 'toolLogo') currentEditingToolLogo = null;
      if (stateKey === 'serviceImg') currentEditingServiceImage = null;
      if (stateKey === 'serviceVid') currentEditingServiceVideo = null;
      if (stateKey === 'aboutVideo') currentSettingAboutVideo = null;
      if (stateKey === 'aboutPoster') currentSettingAboutPoster = null;
      renderSingleGallery(containerId, null, stateKey);
    });
  }
  
  let currentEditingTestimonialLogo = null;
  let currentEditingTestimonialVideo = null;
  let currentEditingTestimonialPhoto = null;
  let currentEditingToolLogo = null;
  let currentEditingServiceImage = null;
  let currentEditingServiceVideo = null;
  let currentSettingAboutVideo = null;
  let currentSettingAboutPoster = null;

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

  function openProjectModal(project) {
    currentEditingProject = project || null;
    DOM.projectForm.reset();
    currentEditingThumbnail = null;
    currentEditingCover = null;
    currentEditingPersona = null;
    currentEditingProcess = [];
    currentEditingScreenshots = [];
    document.getElementById('pf-image-preview').innerHTML = '';
    document.getElementById('pf-cover-preview').innerHTML = '';
    document.getElementById('pf-process-preview').innerHTML = '';
    document.getElementById('pf-persona-preview').innerHTML = '';
    document.getElementById('pf-screenshots-preview').innerHTML = '';

    if (project) {
      DOM.projectModalTitle.textContent = 'Edit Project';
      document.getElementById('pf-id').value = project.id;
      document.getElementById('pf-title').value = project.title || '';
      document.getElementById('pf-category').value = project.category || '';
      document.getElementById('pf-year').value = project.year || '';
      document.getElementById('pf-role').value = project.project_role || '';
      document.getElementById('pf-timeline').value = project.timeline || '';
      document.getElementById('pf-project-type').value = project.project_type || '';
      document.getElementById('pf-priority').value = project.priority || 0;
      
      document.getElementById('pf-tools').value = (project.tools || []).join(', ');
      document.getElementById('pf-url').value = project.url || '';
      document.getElementById('pf-github').value = project.github_url || '';
      document.getElementById('pf-desc').value = project.description || '';
      if (window.pfDescEditor) window.pfDescEditor.commands.setContent(project.description || '');
      document.getElementById('pf-content').value = project.content || '';
      if (window.pfContentEditor) window.pfContentEditor.commands.setContent(project.content || '');
      document.getElementById('pf-casestudy').value = project.case_study || '';
      document.getElementById('pf-slug').value = project.slug || '';
      document.getElementById('pf-outcome').value = project.outcome_text || '';
      if (window.pfOutcomeEditor) window.pfOutcomeEditor.commands.setContent(project.outcome_text || '');
      
      currentEditingThumbnail = project.image_url || null;
      renderSingleGallery('pf-image-preview', currentEditingThumbnail, 'thumbnail');
      
      currentEditingCover = project.cover_image_url || null;
      renderSingleGallery('pf-cover-preview', currentEditingCover, 'cover');

      currentEditingProcess = project.process_image_urls ? [...project.process_image_urls] : [];
      renderMiniGallery('pf-process-preview', currentEditingProcess);

      currentEditingPersona = project.persona_image_url || null;
      renderSingleGallery('pf-persona-preview', currentEditingPersona, 'persona');

      currentEditingScreenshots = project.screenshot_urls ? [...project.screenshot_urls] : [];
      renderMiniGallery('pf-screenshots-preview', currentEditingScreenshots);
      
      document.getElementById('pf-featured').checked = !!project.featured;
      DOM.btnDeleteProject.style.display = 'block';
    } else {
      DOM.projectModalTitle.textContent = 'Deploy New Project';
      document.getElementById('pf-id').value = '';
      document.getElementById('pf-featured').checked = false;
      DOM.btnDeleteProject.style.display = 'none';
    }
    DOM.projectModal.classList.add('open');
  }

  DOM.projectModalClose.addEventListener('click', () => {
    DOM.projectModal.classList.remove('open');
  });

  DOM.projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('pf-id').value;
    
    const btn = DOM.projectForm.querySelector('button[type="submit"]');
    const oldText = btn.textContent;
    btn.textContent = 'Deploying...';
    btn.disabled = true;

    try {
      let newImageUrl = currentEditingThumbnail;
      const imageFile = document.getElementById('pf-image').files[0];
      if (imageFile) {
        if (imageFile.type.startsWith('video/')) {
          newImageUrl = await uploadRawFile(imageFile);
        } else {
          newImageUrl = await uploadCompressedImage(imageFile);
        }
      }

      let newCoverUrl = currentEditingCover;
      const coverFile = document.getElementById('pf-cover').files[0];
      if (coverFile) {
        if (coverFile.type.startsWith('video/')) {
          newCoverUrl = await uploadRawFile(coverFile);
        } else {
          newCoverUrl = await uploadCompressedImage(coverFile);
        }
      }

      let newProcessUrls = [...currentEditingProcess];
      const processFiles = document.getElementById('pf-process').files;
      if (processFiles && processFiles.length > 0) {
        for (let i = 0; i < processFiles.length; i++) {
          const url = await uploadCompressedImage(processFiles[i]);
          newProcessUrls.push(url);
        }
      }

      let newPersonaUrl = currentEditingPersona;
      const personaFile = document.getElementById('pf-persona').files[0];
      if (personaFile) {
        newPersonaUrl = await uploadCompressedImage(personaFile);
      }

      let newScreenshots = [...currentEditingScreenshots];
      const screenshotFiles = document.getElementById('pf-screenshots').files;
      if (screenshotFiles && screenshotFiles.length > 0) {
        for (let i = 0; i < screenshotFiles.length; i++) {
          const url = await uploadCompressedImage(screenshotFiles[i]);
          newScreenshots.push(url);
        }
      }

      const payload = {
        title: document.getElementById('pf-title').value.trim(),
        category: document.getElementById('pf-category').value.trim(),
        year: document.getElementById('pf-year').value.trim(),
        project_role: document.getElementById('pf-role').value.trim(),
        timeline: document.getElementById('pf-timeline').value.trim(),
        project_type: document.getElementById('pf-project-type').value.trim(),
        priority: parseInt(document.getElementById('pf-priority').value) || 0,
        image_url: newImageUrl,
        tools: document.getElementById('pf-tools').value.split(',').map(s => s.trim()).filter(Boolean),
        url: document.getElementById('pf-url').value.trim(),
        github_url: document.getElementById('pf-github').value.trim(),
        description: document.getElementById('pf-desc').value.trim(),
        content: document.getElementById('pf-content').value.trim(),
        case_study: document.getElementById('pf-casestudy').value.trim(),
        featured: document.getElementById('pf-featured').checked,
        slug: document.getElementById('pf-slug').value.trim(),
        outcome_text: document.getElementById('pf-outcome').value.trim(),
        cover_image_url: newCoverUrl,
        process_image_urls: newProcessUrls,
        persona_image_url: newPersonaUrl,
        screenshot_urls: newScreenshots
      };

      if (id) {
        // Update
        const { error } = await supabase.from('projects').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('projects').insert([payload]);
        if (error) throw error;
      }
      
      DOM.projectModal.classList.remove('open');
      loadProjects();
    } catch (err) {
      console.error('Project deploy error:', err);
      alert('Failed to deploy project: ' + err.message);
    } finally {
      btn.textContent = oldText;
      btn.disabled = false;
    }
  });

  DOM.btnDeleteProject.addEventListener('click', async () => {
    const id = document.getElementById('pf-id').value;
    if (!id) return;
    if (confirm('Are you sure you want to delete this project permanently?')) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (!error) {
        DOM.projectModal.classList.remove('open');
        loadProjects();
      }
    }
  });


  /* ── EXPERIENCE ── */
  async function loadExperience() {
    const { data, error } = await supabase.from('experience').select('*').order('priority', { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    allExperience = data;
    renderExperience();
  }

  function renderExperience() {
    if (allExperience.length === 0) {
      DOM.experienceTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No experience found.</td></tr>`;
      return;
    }
    
    DOM.experienceTbody.innerHTML = allExperience.map(e => `
      <tr>
        <td>${e.priority || 0}</td>
        <td style="color:var(--white);">${escapeHTML(e.role_title)}</td>
        <td>${escapeHTML(e.company)}</td>
        <td>${escapeHTML(e.date_range)}</td>
        <td>
          <button class="btn btn-ghost btn-sm btn-edit-experience" data-id="${e.id}">Edit</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.btn-edit-experience').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const exp = allExperience.find(x => x.id == id);
        if (exp) openExperienceModal(exp);
      });
    });
  }

  DOM.btnNewExperience.addEventListener('click', () => openExperienceModal(null));

  function openExperienceModal(exp) {
    DOM.experienceForm.reset();
    if (exp) {
      DOM.experienceModalTitle.textContent = 'Edit Experience';
      document.getElementById('ef-id').value = exp.id;
      document.getElementById('ef-role').value = exp.role_title || '';
      document.getElementById('ef-company').value = exp.company || '';
      document.getElementById('ef-date-range').value = exp.date_range || '';
      document.getElementById('ef-desc').value = exp.description || '';
      document.getElementById('ef-priority').value = exp.priority || 0;
      document.getElementById('ef-active').checked = exp.is_active !== false;
      DOM.btnDeleteExperience.style.display = 'block';
    } else {
      DOM.experienceModalTitle.textContent = 'Add Experience';
      document.getElementById('ef-id').value = '';
      document.getElementById('ef-active').checked = true;
      DOM.btnDeleteExperience.style.display = 'none';
    }
    DOM.experienceModal.classList.add('open');
  }

  DOM.experienceModalClose.addEventListener('click', () => {
    DOM.experienceModal.classList.remove('open');
  });

  DOM.experienceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('ef-id').value;
    
    const btn = DOM.experienceForm.querySelector('button[type="submit"]');
    const oldText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
      const payload = {
        role_title: document.getElementById('ef-role').value.trim(),
        company: document.getElementById('ef-company').value.trim(),
        date_range: document.getElementById('ef-date-range').value.trim(),
        description: document.getElementById('ef-desc').value.trim(),
        priority: parseInt(document.getElementById('ef-priority').value) || 0,
        is_active: document.getElementById('ef-active').checked,
      };

      if (id) {
        const { error } = await supabase.from('experience').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('experience').insert([payload]);
        if (error) throw error;
      }
      
      DOM.experienceModal.classList.remove('open');
      loadExperience();
    } catch (err) {
      console.error('Experience save error:', err);
      alert('Failed to save experience: ' + err.message);
    } finally {
      btn.textContent = oldText;
      btn.disabled = false;
    }
  });

  DOM.btnDeleteExperience.addEventListener('click', async () => {
    const id = document.getElementById('ef-id').value;
    if (!id) return;
    if (confirm('Are you sure you want to delete this experience entry permanently?')) {
      const { error } = await supabase.from('experience').delete().eq('id', id);
      if (!error) {
        DOM.experienceModal.classList.remove('open');
        loadExperience();
      }
    }
  });


  /* ── TESTIMONIALS ── */
  async function loadTestimonials() {
    const { data, error } = await supabase.from('testimonials').select('*').order('priority', { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    allTestimonials = data;
    renderTestimonials();
  }

  function renderTestimonials() {
    if (allTestimonials.length === 0) {
      DOM.testimonialsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No testimonials found.</td></tr>`;
      return;
    }
    
    DOM.testimonialsTbody.innerHTML = allTestimonials.map(t => `
      <tr>
        <td>${t.priority || 0}</td>
        <td style="color:var(--white);">${escapeHTML(t.name)}</td>
        <td>${escapeHTML(t.role_company)}</td>
        <td><span style="font-size:var(--text-xs); color:var(--gray-2);">${escapeHTML((t.quote_text || '').substring(0, 40))}...</span></td>
        <td>
          <button class="btn btn-ghost btn-sm btn-edit-testimonial" data-id="${t.id}">Edit</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.btn-edit-testimonial').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const testm = allTestimonials.find(x => x.id == id);
        if (testm) openTestimonialModal(testm);
      });
    });
  }

  DOM.btnNewTestimonial.addEventListener('click', () => openTestimonialModal(null));

  function openTestimonialModal(testm) {
    DOM.testimonialForm.reset();
    if (testm) {
      DOM.testimonialModalTitle.textContent = 'Edit Testimonial';
      document.getElementById('tf-id').value = testm.id;
      document.getElementById('tf-name').value = testm.name || '';
      document.getElementById('tf-role').value = testm.role_company || '';
      document.getElementById('tf-quote').value = testm.quote_text || '';
      document.getElementById('tf-website').value = testm.client_website_url || '';
      document.getElementById('tf-logo-preview').value = testm.logo_url || '';
      document.getElementById('tf-video-preview').value = testm.video_url || '';
      document.getElementById('tf-photo-preview').value = testm.photo_url || '';
      document.getElementById('tf-priority').value = testm.priority || 0;
      document.getElementById('tf-active').checked = testm.is_active !== false; // defaults to true
      DOM.btnDeleteTestimonial.style.display = 'block';
    } else {
      DOM.testimonialModalTitle.textContent = 'Add Testimonial';
      document.getElementById('tf-id').value = '';
      document.getElementById('tf-active').checked = true;
      DOM.btnDeleteTestimonial.style.display = 'none';
    }
    DOM.testimonialModal.classList.add('open');
  }

  DOM.testimonialModalClose.addEventListener('click', () => {
    DOM.testimonialModal.classList.remove('open');
  });

  DOM.testimonialForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('tf-id').value;
    
    const btn = DOM.testimonialForm.querySelector('button[type="submit"]');
    const oldText = btn.textContent;
    btn.textContent = 'Uploading...';
    btn.disabled = true;

    try {
      let logoUrl = document.getElementById('tf-logo-preview').value;
      let videoUrl = document.getElementById('tf-video-preview').value;
      let photoUrl = document.getElementById('tf-photo-preview').value;

      const logoFile = document.getElementById('tf-logo-file').files[0];
      const videoFile = document.getElementById('tf-video-file').files[0];
      const photoFile = document.getElementById('tf-photo-file').files[0];

      // Upload files sequentially, though Promise.all could be faster
      if (logoFile) logoUrl = await uploadMedia(logoFile);
      if (videoFile) videoUrl = await uploadMedia(videoFile);
      if (photoFile) photoUrl = await uploadMedia(photoFile);

      const payload = {
        name: document.getElementById('tf-name').value.trim(),
        role_company: document.getElementById('tf-role').value.trim(),
        quote_text: document.getElementById('tf-quote').value.trim(),
        client_website_url: document.getElementById('tf-website').value.trim() || null,
        logo_url: logoUrl,
        video_url: videoUrl,
        photo_url: photoUrl,
        priority: parseInt(document.getElementById('tf-priority').value) || 0,
        is_active: document.getElementById('tf-active').checked,
      };

      if (id) {
        const { error } = await supabase.from('testimonials').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('testimonials').insert([payload]);
        if (error) throw error;
      }
      
      DOM.testimonialModal.classList.remove('open');
      loadTestimonials();
    } catch (err) {
      console.error('Testimonial save error:', err);
      alert('Failed to save testimonial: ' + err.message);
    } finally {
      btn.textContent = oldText;
      btn.disabled = false;
    }
  });

  DOM.btnDeleteTestimonial.addEventListener('click', async () => {
    const id = document.getElementById('tf-id').value;
    if (!id) return;
    if (confirm('Are you sure you want to delete this testimonial permanently?')) {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (!error) {
        DOM.testimonialModal.classList.remove('open');
        loadTestimonials();
      }
    }
  });


  /* ── MESSAGES ── */
  async function loadMessages() {
    const { data, error } = await supabase.from('contact_submissions').select('*').order('created_at', { ascending: false });
    if (error) return;
    allMessages = data;
    renderMessages();
  }

  function renderMessages() {
    if (allMessages.length === 0) {
      DOM.messagesTbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No signals intercepted.</td></tr>`;
      return;
    }
    
    DOM.messagesTbody.innerHTML = allMessages.map(m => {
      const d = new Date(m.created_at).toLocaleDateString();
      return `
      <tr>
        <td>${d}</td>
        <td><strong style="color:var(--white);">${escapeHTML(m.name)}</strong><br><span style="font-size:var(--text-xs);">${escapeHTML(m.email)}</span></td>
        <td>${escapeHTML(m.project_type || 'General')}</td>
        <td>
          <button class="btn btn-ghost btn-sm btn-view-msg" data-id="${m.id}">Read</button>
        </td>
      </tr>
    `}).join('');

    document.querySelectorAll('.btn-view-msg').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const msg = allMessages.find(x => x.id == id);
        if (msg) openMessageModal(msg);
      });
    });
  }

  function openMessageModal(msg) {
    document.getElementById('mf-name').textContent = msg.name;
    document.getElementById('mf-email').textContent = msg.email;
    document.getElementById('mf-type').textContent = msg.project_type || 'N/A';
    document.getElementById('mf-budget').textContent = msg.budget || 'N/A';
    document.getElementById('mf-date').textContent = new Date(msg.created_at).toLocaleString();
    document.getElementById('mf-message').textContent = msg.message;
    DOM.messageModal.classList.add('open');
  }

  DOM.messageModalClose.addEventListener('click', () => {
    DOM.messageModal.classList.remove('open');
  });


  /* ── SETTINGS ── */
  async function loadSettings() {
    const { data, error } = await supabase.from('site_settings').select('*');
    if (data) {
      data.forEach(row => {
        if (row.key === 'availability_status') DOM.settingAvailability.value = row.value;
        if (row.key === 'about_video_url') {
          currentSettingAboutVideo = row.value || null;
          renderSingleGallery('setting-about-video-preview', currentSettingAboutVideo, 'aboutVideo');
        }
        if (row.key === 'about_poster_url') {
          currentSettingAboutPoster = row.value || null;
          renderSingleGallery('setting-about-poster-preview', currentSettingAboutPoster, 'aboutPoster');
        }
        if (row.key === 'social_twitter') DOM.settingSocialTwitter.value = row.value;
        if (row.key === 'social_linkedin') DOM.settingSocialLinkedin.value = row.value;
        if (row.key === 'social_github') DOM.settingSocialGithub.value = row.value;
        if (row.key === 'social_dribbble') DOM.settingSocialDribbble.value = row.value;
        if (row.key === 'social_instagram') DOM.settingSocialInstagram.value = row.value;
        if (row.key === 'social_contra') DOM.settingSocialContra.value = row.value;
        if (row.key === 'social_upwork') DOM.settingSocialUpwork.value = row.value;
      });
    }
  }

  DOM.settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = DOM.settingAvailability.value;
    const { error } = await supabase.from('site_settings').upsert({ key: 'availability_status', value: val });
    if (!error) {
      alert('Status updated successfully.');
    }
  });

  async function uploadMedia(file) {
    if (!file) throw new Error('No file selected.');
    
    // Generate unique filename using timestamp
    const ext = file.name.split('.').pop();
    const uniqueName = `video_${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('portfolio_media')
      .upload(uniqueName, file);
      
    if (error) {
      throw error;
    }

    const { data: publicData } = supabase.storage
      .from('portfolio_media')
      .getPublicUrl(uniqueName);

    if (!publicData || !publicData.publicUrl) {
      throw new Error('Failed to retrieve public URL after upload.');
    }

    return publicData.publicUrl;
  }

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

  async function uploadCompressedImage(file) {
    if (!file) throw new Error('No file selected.');
    if (!file.type.startsWith('image/')) {
      throw new Error('File is not an image.');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          let width = img.width;
          let height = img.height;
          const maxDim = 1920;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(async (blob) => {
            if (!blob) return reject(new Error('Canvas to Blob failed.'));
            
            try {
              const uniqueName = `image_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webp`;
              const { data, error } = await supabase.storage
                .from('portfolio_media')
                .upload(uniqueName, blob, { contentType: 'image/webp' });
                
              if (error) throw error;

              const { data: publicData } = supabase.storage
                .from('portfolio_media')
                .getPublicUrl(uniqueName);

              if (!publicData || !publicData.publicUrl) {
                throw new Error('Failed to retrieve public URL after upload.');
              }

              resolve(publicData.publicUrl);
            } catch (err) {
              reject(err);
            }
          }, 'image/webp', 0.8);
        };
        img.onerror = () => reject(new Error('Failed to load image for compression.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
  }


  DOM.videoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = DOM.settingAboutVideo.files[0];
    if (!file) {
      alert('Please select a video file first.');
      return;
    }

    const originalText = DOM.btnUploadVideo.textContent;
    DOM.btnUploadVideo.textContent = 'Uploading...';
    DOM.btnUploadVideo.disabled = true;

    try {
      const publicUrl = await uploadMedia(file);
      
      const { error } = await supabase.from('site_settings').upsert({ key: 'about_video_url', value: publicUrl });
      if (error) throw error;

      DOM.settingAboutVideoPreview.value = publicUrl;
      DOM.settingAboutVideo.value = ''; // clear file input
      alert('Video uploaded and saved successfully.');
    } catch (err) {
      console.error('Upload failed:', err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      DOM.btnUploadVideo.textContent = originalText;
      DOM.btnUploadVideo.disabled = false;
    }
  });

  DOM.socialsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = [
      { key: 'social_twitter', value: DOM.settingSocialTwitter.value },
      { key: 'social_linkedin', value: DOM.settingSocialLinkedin.value },
      { key: 'social_github', value: DOM.settingSocialGithub.value },
      { key: 'social_dribbble', value: DOM.settingSocialDribbble.value },
      { key: 'social_instagram', value: DOM.settingSocialInstagram.value },
      { key: 'social_contra', value: DOM.settingSocialContra.value },
      { key: 'social_upwork', value: DOM.settingSocialUpwork.value }
    ];
    const { error } = await supabase.from('site_settings').upsert(payload);
    if (!error) {
      alert('Social links updated successfully.');
    } else {
      alert('Error updating social links: ' + error.message);
    }
  });


  /* ── TOOLS ── */
  async function loadTools() {
    const { data, error } = await supabase.from('tools').select('*').order('priority', { ascending: false });
    if (error) {
      console.error(error);
      return;
    }
    allTools = data;
    renderTools();
  }

  function renderTools() {
    if (!DOM.toolsTbody) return;
    if (allTools.length === 0) {
      DOM.toolsTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No tools found.</td></tr>`;
      return;
    }

    DOM.toolsTbody.innerHTML = allTools.map(t => `
      <tr>
        <td>${t.priority || 0}</td>
        <td style="color:var(--white);">${escapeHTML(t.name)}</td>
        <td>${escapeHTML(t.category || '—')}</td>
        <td style="color:${t.is_active ? 'var(--green)' : 'var(--gray-3)'};">${t.is_active ? '● On' : '○ Off'}</td>
        <td>
          <button class="btn btn-ghost btn-sm btn-edit-tool" data-id="${escapeHTML(t.id)}">Edit</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.btn-edit-tool').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const tool = allTools.find(x => x.id === id);
        if (tool) openToolModal(tool);
      });
    });
  }

  if (DOM.btnNewTool) DOM.btnNewTool.addEventListener('click', () => openToolModal(null));

  function openToolModal(tool) {
    if (!DOM.toolForm) return;
    DOM.toolForm.reset();
    document.getElementById('tlf-logo-preview').value = '';

    if (tool) {
      DOM.toolModalTitle.textContent = 'Edit Tool';
      document.getElementById('tlf-id').value = tool.id;
      document.getElementById('tlf-name').value = tool.name || '';
      document.getElementById('tlf-category').value = tool.category || '';
      document.getElementById('tlf-priority').value = tool.priority || 0;
      document.getElementById('tlf-active').checked = tool.is_active !== false;
      document.getElementById('tlf-logo-preview').value = tool.logo_url || '';
      DOM.btnDeleteTool.style.display = 'block';
    } else {
      DOM.toolModalTitle.textContent = 'Add Tool';
      document.getElementById('tlf-id').value = '';
      document.getElementById('tlf-active').checked = true;
      DOM.btnDeleteTool.style.display = 'none';
    }
    DOM.toolModal.classList.add('open');
  }

  if (DOM.toolModalClose) {
    DOM.toolModalClose.addEventListener('click', () => {
      DOM.toolModal.classList.remove('open');
    });
  }

  if (DOM.toolForm) {
    DOM.toolForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('tlf-id').value;

      const btn = DOM.toolForm.querySelector('button[type="submit"]');
      const oldText = btn.textContent;
      btn.textContent = 'Saving...';
      btn.disabled = true;

      try {
        let logoUrl = document.getElementById('tlf-logo-preview').value;
        const logoFile = document.getElementById('tlf-logo-file').files[0];
        if (logoFile) {
          logoUrl = await uploadCompressedImage(logoFile);
        }

        const payload = {
          name: document.getElementById('tlf-name').value.trim(),
          category: document.getElementById('tlf-category').value || null,
          priority: parseInt(document.getElementById('tlf-priority').value) || 0,
          is_active: document.getElementById('tlf-active').checked,
          logo_url: logoUrl || null,
        };

        if (id) {
          const { error } = await supabase.from('tools').update(payload).eq('id', id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('tools').insert([payload]);
          if (error) throw error;
        }

        DOM.toolModal.classList.remove('open');
        loadTools();
      } catch (err) {
        console.error('Tool save error:', err);
        alert('Failed to save tool: ' + err.message);
      } finally {
        btn.textContent = oldText;
        btn.disabled = false;
      }
    });
  }

  if (DOM.btnDeleteTool) {
    DOM.btnDeleteTool.addEventListener('click', async () => {
      const id = document.getElementById('tlf-id').value;
      if (!id) return;
      if (confirm('Are you sure you want to delete this tool permanently?')) {
        const { error } = await supabase.from('tools').delete().eq('id', id);
        if (!error) {
          DOM.toolModal.classList.remove('open');
          loadTools();
        }
      }
    });
  }


  /* ── SERVICES ── */
  let allServices = [];
  let currentEditingService = null;

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
        
        let imgUrl = currentEditingService ? currentEditingService.image_url : null;
        let videoUrl = currentEditingService ? currentEditingService.video_url : null;
        
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

/* TipTap Initialization */
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
if (window.TipTap) initTipTap(); // In case it loaded before this script

  // Init
  checkAuth();

})();



