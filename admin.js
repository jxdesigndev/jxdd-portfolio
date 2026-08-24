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

    settingsForm: document.getElementById('settings-form'),
    settingAvailability: document.getElementById('setting-availability'),

    socialsForm: document.getElementById('socials-form'),
    settingSocialTwitter: document.getElementById('setting-social-twitter'),
    settingSocialLinkedin: document.getElementById('setting-social-linkedin'),
    settingSocialGithub: document.getElementById('setting-social-github'),
    settingSocialDribbble: document.getElementById('setting-social-dribbble'),
    settingSocialInstagram: document.getElementById('setting-social-instagram'),
    settingSocialContra: document.getElementById('setting-social-contra'),
    settingSocialUpwork: document.getElementById('setting-social-upwork')
  };

  let session = null;
  let allProjects = [];
  let allMessages = [];
  let allExperience = [];

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

  function openProjectModal(project) {
    DOM.projectForm.reset();
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
      document.getElementById('pf-image').value = project.image_url || '';
      document.getElementById('pf-tools').value = (project.tools || []).join(', ');
      document.getElementById('pf-url').value = project.url || '';
      document.getElementById('pf-github').value = project.github_url || '';
      document.getElementById('pf-desc').value = project.description || '';
      document.getElementById('pf-content').value = project.content || '';
      document.getElementById('pf-casestudy').value = project.case_study || '';
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
      const payload = {
        title: document.getElementById('pf-title').value.trim(),
        category: document.getElementById('pf-category').value.trim(),
        year: document.getElementById('pf-year').value.trim(),
        project_role: document.getElementById('pf-role').value.trim(),
        timeline: document.getElementById('pf-timeline').value.trim(),
        project_type: document.getElementById('pf-project-type').value.trim(),
        priority: parseInt(document.getElementById('pf-priority').value) || 0,
        image_url: document.getElementById('pf-image').value.trim(),
        tools: document.getElementById('pf-tools').value.split(',').map(s => s.trim()).filter(Boolean),
        url: document.getElementById('pf-url').value.trim(),
        github_url: document.getElementById('pf-github').value.trim(),
        description: document.getElementById('pf-desc').value.trim(),
        content: document.getElementById('pf-content').value.trim(),
        case_study: document.getElementById('pf-casestudy').value.trim(),
        featured: document.getElementById('pf-featured').checked,
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

  // Init
  checkAuth();

})();
