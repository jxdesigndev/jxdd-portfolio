/* =========================================
   JX Admin — JavaScript v2.0
   Full Supabase Integration
   ========================================= */

// --- STATE ---
const KEYS = {
  services: 'jx_services',
  hero: 'jx_hero',
  about: 'jx_about',
  template: 'jx_template',
  activity: 'jx_activity'
};

let data = {
  projects: [],
  categories: [],
  services: [],
  hero: {},
  about: {},
  messages: [],    // Now from Supabase contact_submissions
  settings: {},
  template: {},
  activity: []
};


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) lucide.createIcons();

  checkAuth();
  
  // Navigation
  document.querySelectorAll('.nav-item[data-target], .mobile-nav-item[data-target]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(e.currentTarget.getAttribute('data-target'));
      closeMobileSheet();
    });
  });

  document.getElementById('mobile-more-toggle')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('mobile-more-sheet').classList.add('open');
  });

  document.querySelector('.close-sheet')?.addEventListener('click', closeMobileSheet);

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', logout);
  document.getElementById('btn-logout-mobile')?.addEventListener('click', logout);

  // Form Submits
  document.getElementById('project-form')?.addEventListener('submit', handleProjectSave);
  document.getElementById('service-form')?.addEventListener('submit', handleServiceSave);

  // Filters
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      renderProjects(e.currentTarget.getAttribute('data-filter'));
    });
  });

  // Search
  document.getElementById('project-search')?.addEventListener('input', (e) => {
    renderProjects(document.querySelector('.filter-tab.active').getAttribute('data-filter'), e.target.value);
  });

  // Modal overlay click to close
  document.getElementById('modal-overlay')?.addEventListener('click', () => {
    closeProjectModal();
    closeServiceModal();
    closeMessageModal();
  });
});


// --- AUTH ---
async function checkAuth() {
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    if (session) {
      document.getElementById('login-overlay').style.display = 'none';
      document.getElementById('admin-app').style.display = 'flex';
      loadData();
      switchTab('dashboard');
      checkSupabaseConnection();
    } else {
      document.getElementById('login-overlay').style.display = 'flex';
      setupLoginForm();
    }

    window.supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        location.reload();
      }
    });
  } catch (err) {
    console.error('Auth check failed:', err);
    document.getElementById('login-overlay').style.display = 'flex';
    setupLoginForm();
  }
}

function setupLoginForm() {
  const loginForm = document.getElementById('login-form');
  loginForm.replaceWith(loginForm.cloneNode(true));
  
  const newForm = document.getElementById('login-form');
  // Re-init Lucide for cloned icons
  if (window.lucide) lucide.createIcons();
  
  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const pwd = document.getElementById('admin-password').value;
    const err = document.getElementById('login-error');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnSpan = submitBtn.querySelector('span');
    const oldText = btnSpan ? btnSpan.textContent : 'Login';
    
    if (btnSpan) btnSpan.textContent = 'Logging in...';
    submitBtn.disabled = true;

    try {
      const { error } = await window.supabaseClient.auth.signInWithPassword({
        email: email,
        password: pwd,
      });

      if (error) {
        err.textContent = error.message;
        err.style.display = 'block';
        const input = document.getElementById('admin-password');
        input.classList.add('shake', 'border-red');
        setTimeout(() => input.classList.remove('shake'), 500);
      } else {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('admin-app').style.display = 'flex';
        loadData();
        switchTab('dashboard');
        checkSupabaseConnection();
      }
    } catch (e) {
      err.textContent = 'Connection failed. Check your network.';
      err.style.display = 'block';
    }
    
    if (btnSpan) btnSpan.textContent = oldText;
    submitBtn.disabled = false;
  });
}

async function logout(e) {
  if (e) e.preventDefault();
  await window.supabaseClient.auth.signOut();
  location.reload();
}

function closeMobileSheet() {
  document.getElementById('mobile-more-sheet')?.classList.remove('open');
}


// --- SUPABASE CONNECTION STATUS ---
async function checkSupabaseConnection() {
  const statusEl = document.getElementById('supabase-status');
  if (!statusEl) return;

  try {
    const { data: test, error } = await window.supabaseClient.from('projects').select('id', { count: 'exact', head: true });
    
    if (!error) {
      statusEl.innerHTML = `
        <span class="status-dot connected"></span>
        <span class="status-text">Supabase connected</span>
      `;
    } else {
      throw error;
    }
  } catch (err) {
    statusEl.innerHTML = `
      <span class="status-dot disconnected"></span>
      <span class="status-text">Supabase disconnected</span>
    `;
    console.warn('Supabase connection check failed:', err);
  }
}


// --- DATA ACCESS ---
async function loadData() {
  // Load localStorage-only data
  for (const [key, storageKey] of Object.entries(KEYS)) {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        data[key] = JSON.parse(raw);
      } catch (e) { console.error(`Error parsing ${storageKey}`, e); }
    } else {
      if (['services', 'activity'].includes(key)) {
        data[key] = [];
      } else {
        data[key] = {};
      }
    }
  }

  // Load Supabase data
  try {
    const [projRes, catRes, setRes, srvRes] = await Promise.all([
      window.supabaseClient.from('projects').select('*'),
      window.supabaseClient.from('categories').select('*'),
      window.supabaseClient.from('site_settings').select('*'),
      window.supabaseClient.from('services').select('*')
    ]);

    if (projRes.data) data.projects = projRes.data;
    if (catRes.data) data.categories = catRes.data;
    if (setRes.data && setRes.data.length > 0) {
      const dbSettings = setRes.data[0];
      // Merge known fields
      data.settings = {
        name: dbSettings.name || '',
        brand: dbSettings.brand || '',
        tagline: dbSettings.tagline || '',
        location: dbSettings.location || '',
        whatsapp: dbSettings.whatsapp || '',
        email: dbSettings.email || '',
        email2: dbSettings.email2 || '',
        linkedin: dbSettings.linkedin || '',
        twitter: dbSettings.twitter || '',
        github: dbSettings.github || '',
        available: dbSettings.available || false,
        ...dbSettings
      };

      // Merge JSONB content columns if they exist in DB
      if (dbSettings.hero_content && Object.keys(dbSettings.hero_content).length > 0) data.hero = dbSettings.hero_content;
      if (dbSettings.about_content && Object.keys(dbSettings.about_content).length > 0) data.about = dbSettings.about_content;
      if (dbSettings.template_content && Object.keys(dbSettings.template_content).length > 0) data.template = dbSettings.template_content;
      if (dbSettings.global_styles && Object.keys(dbSettings.global_styles).length > 0) data.global_styles = dbSettings.global_styles;
      else data.global_styles = {};
      if (dbSettings.navigation_settings && Object.keys(dbSettings.navigation_settings).length > 0) data.navigation = dbSettings.navigation_settings;
      else data.navigation = veGetDefaultNav();
    }

    if (srvRes && srvRes.data && srvRes.data.length > 0) {
      data.services = srvRes.data;
    }

    // Load contact submissions as messages
    await loadContactSubmissions();

  } catch (err) {
    console.error("Supabase load error:", err);
    showToast('Failed to load some data from Supabase', 'error');
  }

  updateSyncTime();
  
  // Re-init Lucide icons for any dynamically created content
  if (window.lucide) lucide.createIcons();

  if (document.getElementById('section-dashboard')?.classList.contains('active')) {
    renderDashboard();
  }
}

async function loadContactSubmissions() {
  try {
    const { data: submissions, error } = await window.supabaseClient
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not load contact submissions:', error.message);
      return;
    }

    if (submissions) {
      data.messages = submissions.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        subject: s.subject || '',
        budget: s.budget || '',
        message: s.message,
        date: s.created_at,
        status: s.status || 'New',
        read_at: s.read_at || null
      }));

      // Update message badge
      const newCount = data.messages.filter(m => m.status === 'New').length;
      const badge = document.getElementById('nav-msg-badge');
      if (badge) {
        if (newCount > 0) {
          badge.textContent = newCount;
          badge.style.display = 'inline-flex';
        } else {
          badge.style.display = 'none';
        }
      }
    }
  } catch (err) {
    console.warn('Contact submissions load error:', err);
  }
}

async function saveData(key, logMsg = null) {
  simulateSaveIndicator();

  if (['projects', 'categories', 'settings', 'hero', 'about', 'template', 'services', 'global_styles', 'navigation'].includes(key)) {
    try {
      if (['settings', 'hero', 'about', 'template', 'global_styles', 'navigation'].includes(key)) {
        const dbSettings = { 
          id: 1, 
          ...data.settings,
          hero_content: data.hero,
          about_content: data.about,
          template_content: data.template,
          global_styles: data.global_styles,
          navigation_settings: data.navigation
        };
        const { error } = await window.supabaseClient.from('site_settings').upsert(dbSettings);
        if (error) console.error('Settings/Content save error:', error);
      } else if (key === 'categories' && data.categories.length > 0) {
        const { error } = await window.supabaseClient.from('categories').upsert(data.categories);
        if (error) console.error('Categories save error:', error);
      } else if (key === 'services' && data.services.length > 0) {
        const { error } = await window.supabaseClient.from('services').upsert(data.services);
        if (error) console.error('Services save error:', error);
      }
    } catch (err) {
      console.error('Supabase save error:', err);
    }
    
    if (logMsg) logActivity(logMsg);
    return;
  }

  // Save to localStorage for non-Supabase data
  const storageKey = KEYS[key];
  if (storageKey) {
    localStorage.setItem(storageKey, JSON.stringify(data[key]));
  }
  
  if (logMsg) logActivity(logMsg);
}

function logActivity(message) {
  const entry = { text: message, time: new Date().toISOString() };
  data.activity.unshift(entry);
  if (data.activity.length > 15) data.activity.pop();
  saveData('activity');
  if (document.getElementById('section-dashboard')?.classList.contains('active')) {
    renderDashboardLogs();
  }
}

function simulateSaveIndicator() {
  const ind = document.getElementById('save-indicator');
  const dot = document.querySelector('.save-dot');
  if (!ind) return;
  ind.textContent = 'Saving...';
  ind.style.color = 'var(--text-muted)';
  if (dot) dot.style.background = 'var(--yellow-accent)';
  updateSyncTime();
  setTimeout(() => {
    ind.textContent = 'All changes saved';
    ind.style.color = 'var(--neon-green)';
    if (dot) dot.style.background = 'var(--neon-green)';
  }, 600);
}

function updateSyncTime() {
  const el = document.getElementById('last-saved-time');
  if (el) {
    const now = new Date();
    el.textContent = `Last saved: ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  }
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}


// --- ROUTING ---
function switchTab(target) {
  // Update sidebar tabs
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll(`.sidebar-nav [data-target="${target}"]`).forEach(el => el.classList.add('active'));
  
  // Update mobile tabs
  document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll(`.mobile-nav-item[data-target="${target}"]`).forEach(el => el.classList.add('active'));

  // Update top bar
  const titles = {
    dashboard: ['Dashboard', 'Overview'],
    projects: ['Projects', 'Manage portfolio projects'],
    categories: ['Categories', 'Organize project categories'],
    services: ['Services', 'Manage your service offerings'],
    hero: ['Hero Section', 'Edit homepage hero content'],
    about: ['About Page', 'Edit your biography & experience'],
    messages: ['Messages', 'Contact form submissions'],
    template: ['Template Sales', 'Manage template store'],
    settings: ['Site Settings', 'Global configuration'],
    'visual-editor': ['Visual Editor', 'Edit pages visually']
  };

  const [title, breadcrumb] = titles[target] || [target, ''];
  document.getElementById('top-title').textContent = title;
  const bc = document.getElementById('top-breadcrumb');
  if (bc) bc.textContent = breadcrumb;

  // Toggle sections
  document.querySelectorAll('.admin-section').forEach(el => el.classList.remove('active'));
  const section = document.getElementById(`section-${target}`);
  if (section) section.classList.add('active');

  // Visual editor fullscreen class management
  const sectionsContainer = document.querySelector('.sections-container');
  if (sectionsContainer) {
    if (target === 'visual-editor') {
      sectionsContainer.classList.add('ve-fullscreen');
    } else {
      sectionsContainer.classList.remove('ve-fullscreen');
    }
  }

  // Trigger renders
  const renderers = {
    dashboard: renderDashboard,
    projects: () => renderProjects('All'),
    categories: renderCategories,
    services: renderServices,
    hero: renderHeroForm,
    about: renderAboutForm,
    messages: renderMessages,
    template: renderTemplateForm,
    settings: renderSettingsForm,
    'visual-editor': renderVisualEditor
  };

  if (renderers[target]) renderers[target]();

  // Re-init lucide for dynamic content
  setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 50);
}


// --- DASHBOARD ---
function renderDashboard() {
  document.getElementById('stat-projects').textContent = data.projects.length;
  document.getElementById('stat-services').textContent = data.services.filter(s => s.status !== 'Coming Soon').length;
  
  const newMsgCount = data.messages.filter(m => m.status === 'New').length;
  document.getElementById('stat-messages').textContent = newMsgCount;
  
  // Health check
  const checks = [];
  checks.push(`<li>${data.hero?.eyebrow ? '✓' : '⚠'} ${data.hero?.eyebrow ? 'Hero text configured' : 'Hero text missing'}</li>`);
  checks.push(`<li>${data.projects.length >= 4 ? '✓' : '⚠'} ${data.projects.length >= 4 ? 'Sufficient projects live' : 'Less than 4 projects'}</li>`);
  checks.push(`<li>${data.settings?.email ? '✓' : '⚠'} ${data.settings?.email ? 'Contact email set' : 'Contact email missing'}</li>`);
  checks.push(`<li>${data.services.length > 0 ? '✓' : '⚠'} ${data.services.length > 0 ? 'Services configured' : 'No services set up'}</li>`);
  
  document.getElementById('health-checklist').innerHTML = checks.join('');
  renderDashboardLogs();
}

function renderDashboardLogs() {
  const ul = document.getElementById('activity-list');
  ul.innerHTML = '';
  if (data.activity.length === 0) {
    ul.innerHTML = '<li style="color:var(--text-dim)">No recent activity.</li>';
    return;
  }
  
  data.activity.slice(0, 8).forEach(a => {
    const li = document.createElement('li');
    const date = new Date(a.time);
    const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    li.innerHTML = `<span>${a.text}</span><span style="opacity:0.4">${timeStr}</span>`;
    ul.appendChild(li);
  });
}

function toggleWorkAvailability() {
  if (!data.settings) data.settings = {};
  data.settings.available = !data.settings.available;
  saveData('settings', `Set availability to ${data.settings.available ? 'Available' : 'Unavailable'}`);
  showToast(data.settings.available ? 'Marked as available for work' : 'Marked as unavailable');
}


// --- PROJECTS ---
function renderProjects(filter = 'All', search = '') {
  const tbody = document.getElementById('projects-table-body');
  const cards = document.getElementById('projects-cards-container');
  tbody.innerHTML = '';
  cards.innerHTML = '';

  let filtered = data.projects;
  if (filter !== 'All') {
    filtered = filtered.filter(p => p.category === filter);
  }
  if (search) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }

  filtered.sort((a, b) => (b.priority || 5) - (a.priority || 5));

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:40px">No projects found.</td></tr>`;
    cards.innerHTML = `<div class="project-card" style="text-align:center;color:var(--text-dim);padding:32px">No projects found.</div>`;
    return;
  }

  filtered.forEach(p => {
    let sBadge = 'badge-white';
    if (p.status === 'Live') sBadge = 'badge-green';
    if (p.status === 'In Progress') sBadge = 'badge-yellow';
    if (p.status === 'Coming Soon' || p.status === 'Draft') sBadge = 'badge-grey';

    // Desktop Row
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="width:40px;height:40px;background:var(--neon-green-dim);border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center">
          ${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">` : '<i data-lucide="image" style="width:16px;height:16px;color:var(--text-dim)"></i>'}
        </div>
      </td>
      <td><strong>${p.name}</strong></td>
      <td>${p.category || '-'}</td>
      <td><span class="badge ${sBadge}">${p.status}</span></td>
      <td>${p.featured ? '⭐' : '—'}</td>
      <td style="font-family:var(--font-mono);font-size:0.78rem;color:var(--text-muted)">${p.date || '—'}</td>
      <td>
        <button class="btn-outline btn-sm" onclick="editProject('${p.id}')">Edit</button>
      </td>
    `;
    tbody.appendChild(tr);

    // Mobile Card
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <div class="project-card-header">
        <div>
          <h4 style="font-size:0.95rem;margin-bottom:2px">${p.name}</h4>
          <span style="font-size:0.75rem;color:var(--text-dim);font-family:var(--font-mono)">${p.category}</span>
        </div>
        <span class="badge ${sBadge}">${p.status}</span>
      </div>
      <p style="font-size:0.82rem;color:var(--text-muted);margin:8px 0">${p.shortDesc || ''}</p>
      <div class="project-card-actions">
        <button class="btn-outline btn-sm w-full" onclick="editProject('${p.id}')">Edit</button>
        ${p.featured ? '<span class="badge badge-yellow" style="align-self:center">Featured</span>' : ''}
      </div>
    `;
    cards.appendChild(card);
  });

  // Re-init lucide icons for dynamic img fallbacks
  if (window.lucide) lucide.createIcons();
}

function openProjectModal() {
  document.getElementById('project-form').reset();
  document.getElementById('proj-id').value = '';
  document.getElementById('project-modal-title').textContent = 'Add Project';
  document.getElementById('btn-delete-proj').style.display = 'none';
  document.getElementById('project-modal').classList.add('open');
  document.getElementById('modal-overlay').style.display = 'block';
}

function closeProjectModal() {
  document.getElementById('project-modal').classList.remove('open');
  document.getElementById('modal-overlay').style.display = 'none';
}

function editProject(id) {
  const p = data.projects.find(x => x.id === id);
  if (!p) return;
  openProjectModal();
  document.getElementById('project-modal-title').textContent = 'Edit Project';
  document.getElementById('btn-delete-proj').style.display = 'block';

  document.getElementById('proj-id').value = p.id;
  document.getElementById('proj-name').value = p.name || '';
  document.getElementById('proj-category').value = p.category || 'Product Design';
  document.getElementById('proj-status').value = p.status || 'Live';
  document.getElementById('proj-short-desc').value = p.shortDesc || '';
  document.getElementById('proj-tools').value = p.tools ? p.tools.join(', ') : '';
  
  document.getElementById('proj-human').value = p.story?.human || '';
  document.getElementById('proj-problem').value = p.story?.problem || '';
  document.getElementById('proj-solution').value = p.story?.solution || '';
  document.getElementById('proj-outcome').value = p.story?.outcome || '';
  document.getElementById('proj-quote').value = p.story?.quote || '';

  document.getElementById('proj-image').value = p.image || '';
  document.getElementById('proj-gradient').value = p.gradient || 'neon-green';
  document.getElementById('proj-client').value = p.client || '';
  document.getElementById('proj-flag').value = p.flag || '';
  document.getElementById('proj-url').value = p.url || '';

  document.getElementById('proj-featured').checked = !!p.featured;
  document.getElementById('proj-priority').value = p.priority || 5;
  document.getElementById('proj-date').value = p.date || '';
}

async function handleProjectSave(e) {
  e.preventDefault();
  
  const idValue = document.getElementById('proj-id').value;
  const isNew = !idValue;
  const id = isNew ? generateId(document.getElementById('proj-name').value) : idValue;

  const project = {
    id: id,
    name: document.getElementById('proj-name').value,
    category: document.getElementById('proj-category').value,
    status: document.getElementById('proj-status').value,
    shortDesc: document.getElementById('proj-short-desc').value,
    tools: document.getElementById('proj-tools').value.split(',').map(s => s.trim()).filter(Boolean),
    story: {
      human: document.getElementById('proj-human').value,
      problem: document.getElementById('proj-problem').value,
      solution: document.getElementById('proj-solution').value,
      outcome: document.getElementById('proj-outcome').value,
      quote: document.getElementById('proj-quote').value
    },
    image: document.getElementById('proj-image').value,
    gradient: document.getElementById('proj-gradient').value,
    client: document.getElementById('proj-client').value,
    flag: document.getElementById('proj-flag').value,
    url: document.getElementById('proj-url').value,
    featured: document.getElementById('proj-featured').checked,
    priority: parseInt(document.getElementById('proj-priority').value, 10),
    date: document.getElementById('proj-date').value,
    lastUpdated: new Date().toISOString()
  };

  try {
    const { error } = await window.supabaseClient.from('projects').upsert(project);
    if (error) {
      showToast('Failed to save project: ' + error.message, 'error');
      console.error(error);
      return;
    }

    if (isNew) {
      data.projects.push(project);
      showToast('Project added successfully');
      logActivity(`Added project '${project.name}'`);
    } else {
      const idx = data.projects.findIndex(p => p.id === id);
      if (idx > -1) data.projects[idx] = project;
      showToast('Project updated successfully');
      logActivity(`Updated project '${project.name}'`);
    }
  } catch (err) {
    showToast('Network error. Try again.', 'error');
    return;
  }

  closeProjectModal();
  renderProjects(document.querySelector('.filter-tab.active').getAttribute('data-filter'));
}

async function deleteCurrentProject() {
  const id = document.getElementById('proj-id').value;
  if (!id) return;
  if (confirm("Are you sure you want to delete this project? This cannot be undone.")) {
    const p = data.projects.find(x => x.id === id);
    try {
      const { error } = await window.supabaseClient.from('projects').delete().eq('id', id);
      if (error) {
        showToast('Failed to delete project', 'error');
        return;
      }

      data.projects = data.projects.filter(x => x.id !== id);
      logActivity(`Deleted project '${p?.name}'`);
      showToast('Project deleted', 'warning');
      closeProjectModal();
      renderProjects(document.querySelector('.filter-tab.active').getAttribute('data-filter'));
    } catch (err) {
      showToast('Network error', 'error');
    }
  }
}


// --- CATEGORIES ---
function renderCategories() {
  const container = document.getElementById('categories-list');
  container.innerHTML = '';
  
  if (!data.categories || data.categories.length === 0) {
    data.categories = [
      { id: 'cat-product', name: 'Product Design', icon: '🎨', available: true, desc: '' },
      { id: 'cat-nocode', name: 'No-Code / Vibe Code', icon: '⚡', available: true, desc: '' },
      { id: 'cat-automation', name: 'Automation', icon: '🤖', available: false, desc: 'Coming Soon' },
      { id: 'cat-cyber', name: 'Cybersecurity', icon: '🔒', available: false, desc: 'Coming Soon' }
    ];
    saveData('categories');
  }

  data.categories.forEach(c => {
    const projectCount = data.projects.filter(p => p.category === c.name).length;
    
    const row = document.createElement('div');
    row.className = 'form-card glass-card';
    row.innerHTML = `
      <div class="flex-between">
        <h3 style="margin:0">${c.icon} ${c.name}</h3>
        <div class="toggle-group" style="gap:10px">
          <label style="margin:0;font-size:0.78rem;color:var(--text-muted)">Available</label>
          <label class="switch">
            <input type="checkbox" ${c.available ? 'checked' : ''} onchange="toggleCategory('${c.id}', this.checked)">
            <span class="slider"></span>
          </label>
        </div>
      </div>
      <div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-dim);margin:12px 0">
        ${projectCount} project${projectCount !== 1 ? 's' : ''}
      </div>
      <div class="input-group" style="margin-bottom:0">
        <input type="text" placeholder="Description / Badge text" value="${c.desc || ''}" onchange="updateCategoryDesc('${c.id}', this.value)">
      </div>
    `;
    container.appendChild(row);
  });
}

function toggleCategory(id, val) {
  const c = data.categories.find(x => x.id === id);
  if (c) {
    c.available = val;
    saveData('categories', `Toggled category ${c.name} to ${val ? 'Available' : 'Coming Soon'}`);
    showToast(`Category ${c.name} updated`);
  }
}

function updateCategoryDesc(id, val) {
  const c = data.categories.find(x => x.id === id);
  if (c) {
    c.desc = val;
    saveData('categories');
  }
}

function addCategory() {
  const name = prompt("Enter Custom Category Name:");
  if (name) {
    data.categories.push({
      id: generateId(name),
      name: name,
      icon: '📁',
      available: true,
      desc: ''
    });
    saveData('categories', `Added custom category ${name}`);
    renderCategories();
  }
}


// --- SERVICES ---
function renderServices() {
  const container = document.getElementById('services-grid');
  container.innerHTML = '';

  if (!data.services || data.services.length === 0) {
    data.services = [
      { id: 'srv-product', name: 'Product Design', icon: '🎨', headline: '', desc: '', tools: [], status: 'Available', steps: [] },
      { id: 'srv-nocode', name: 'No-Code / Vibe Code', icon: '⚡', headline: '', desc: '', tools: [], status: 'Available', steps: [] },
      { id: 'srv-automation', name: 'Automation', icon: '🤖', headline: '', desc: '', tools: [], status: 'Coming Soon', steps: [] },
      { id: 'srv-cyber', name: 'Security', icon: '🔒', headline: '', desc: '', tools: [], status: 'Coming Soon', steps: [] }
    ];
    saveData('services');
  }

  data.services.forEach(s => {
    const card = document.createElement('div');
    card.className = 'form-card glass-card';
    card.innerHTML = `
      <div class="flex-between">
        <h3 style="margin:0">${s.icon || ''} ${s.name}</h3>
        <span class="badge ${s.status === 'Available' ? 'badge-green' : 'badge-grey'}">${s.status}</span>
      </div>
      <p style="font-size:0.82rem;color:var(--text-muted);margin:12px 0">${s.desc || 'No description set.'}</p>
      <button class="btn-outline btn-sm w-full" onclick="editService('${s.id}')">Edit Service</button>
    `;
    container.appendChild(card);
  });
}

function openServiceModal() {
  document.getElementById('service-modal').classList.add('open');
  document.getElementById('modal-overlay').style.display = 'block';
}

function closeServiceModal() {
  document.getElementById('service-modal').classList.remove('open');
  document.getElementById('modal-overlay').style.display = 'none';
}

function editService(id) {
  const s = data.services.find(x => x.id === id);
  if (!s) return;
  document.getElementById('srv-id').value = s.id;
  document.getElementById('srv-name').value = s.name || '';
  document.getElementById('srv-icon').value = s.icon || '';
  document.getElementById('srv-headline').value = s.headline || '';
  document.getElementById('srv-desc').value = s.desc || '';
  document.getElementById('srv-tools').value = s.tools ? s.tools.join(', ') : '';
  document.getElementById('srv-status').value = s.status || 'Available';

  const stepsContainer = document.getElementById('srv-steps-container');
  stepsContainer.innerHTML = '';
  if (s.steps) {
    s.steps.forEach((step, idx) => {
      addServiceStepHTML(step.title, step.desc, idx);
    });
  }
  
  openServiceModal();
}

function addServiceStepHTML(title = '', desc = '', idx = null) {
  const container = document.getElementById('srv-steps-container');
  const div = document.createElement('div');
  div.className = 'service-step-edit';
  div.style.cssText = 'border:1px dashed var(--border-light);padding:12px;margin-bottom:10px;border-radius:8px;background:rgba(0,0,0,0.2)';
  div.innerHTML = `
    <input type="text" class="step-title" placeholder="Step Title" value="${title}" style="margin-bottom:6px">
    <textarea class="step-desc" placeholder="Step Description" rows="2">${desc}</textarea>
    <button type="button" class="btn-danger btn-sm mt-1" onclick="this.parentElement.remove()">Remove</button>
  `;
  container.appendChild(div);
}

function addServiceStep() {
  addServiceStepHTML();
}

function handleServiceSave(e) {
  e.preventDefault();
  const idValue = document.getElementById('srv-id').value;
  const s = data.services.find(x => x.id === idValue);
  if (!s) return;

  s.name = document.getElementById('srv-name').value;
  s.icon = document.getElementById('srv-icon').value;
  s.headline = document.getElementById('srv-headline').value;
  s.desc = document.getElementById('srv-desc').value;
  s.tools = document.getElementById('srv-tools').value.split(',').map(str => str.trim()).filter(Boolean);
  s.status = document.getElementById('srv-status').value;

  const stepEls = document.querySelectorAll('.service-step-edit');
  s.steps = [];
  stepEls.forEach(el => {
    s.steps.push({
      title: el.querySelector('.step-title').value,
      desc: el.querySelector('.step-desc').value
    });
  });

  saveData('services', `Updated service '${s.name}'`);
  showToast('Service saved');
  closeServiceModal();
  renderServices();
}


// --- HERO ---
function renderHeroForm() {
  const h = data.hero || {};
  document.getElementById('hero-available').checked = !!h.available;
  document.getElementById('hero-badge1').value = h.badge1 || '';
  document.getElementById('hero-badge2').value = h.badge2 || '';
  
  [1,2,3,4].forEach(i => {
    document.getElementById(`hero-s${i}-l1`).value = h[`s${i}_l1`] || '';
    document.getElementById(`hero-s${i}-l2`).value = h[`s${i}_l2`] || '';
    document.getElementById(`hero-s${i}-img`).value = h[`s${i}_img`] || '';
  });

  document.getElementById('hero-eyebrow').value = h.eyebrow || '';
  document.getElementById('hero-subtitle').value = h.subtitle || '';
  document.getElementById('hero-btn1').value = h.btn1 || '';
  document.getElementById('hero-btn2').value = h.btn2 || '';
  document.getElementById('hero-skills').value = h.skills ? h.skills.join(', ') : '';
}

function saveHero() {
  const h = {};
  h.available = document.getElementById('hero-available').checked;
  h.badge1 = document.getElementById('hero-badge1').value;
  h.badge2 = document.getElementById('hero-badge2').value;

  [1,2,3,4].forEach(i => {
    h[`s${i}_l1`] = document.getElementById(`hero-s${i}-l1`).value;
    h[`s${i}_l2`] = document.getElementById(`hero-s${i}-l2`).value;
    h[`s${i}_img`] = document.getElementById(`hero-s${i}-img`).value;
  });

  h.eyebrow = document.getElementById('hero-eyebrow').value;
  h.subtitle = document.getElementById('hero-subtitle').value;
  h.btn1 = document.getElementById('hero-btn1').value;
  h.btn2 = document.getElementById('hero-btn2').value;
  h.skills = document.getElementById('hero-skills').value.split(',').map(s => s.trim()).filter(Boolean);

  data.hero = h;
  saveData('hero', 'Updated hero section content');
  showToast('Hero section saved');
}


// --- ABOUT ---
function renderAboutForm() {
  const a = data.about || {};
  document.getElementById('about-heading1').value = a.h1 || '';
  document.getElementById('about-heading2').value = a.h2 || '';
  document.getElementById('about-heading3').value = a.h3 || '';
  document.getElementById('about-desc').value = a.desc || '';
  document.getElementById('about-cv').value = a.cv || '';
  document.getElementById('about-fun-fact').value = a.funfact || '';
  
  if (!a.experience) a.experience = [];
  renderExperienceList();
}

function saveAbout() {
  const a = data.about || {};
  a.h1 = document.getElementById('about-heading1').value;
  a.h2 = document.getElementById('about-heading2').value;
  a.h3 = document.getElementById('about-heading3').value;
  a.desc = document.getElementById('about-desc').value;
  a.cv = document.getElementById('about-cv').value;
  a.funfact = document.getElementById('about-fun-fact').value;
  
  data.about = a;
  saveData('about', 'Updated About page info');
  showToast('About section saved');
}

function renderExperienceList() {
  const list = document.getElementById('about-experience-list');
  list.innerHTML = '';
  const exps = data.about.experience || [];
  
  if (exps.length === 0) {
    list.innerHTML = '<p style="color:var(--text-dim);font-size:0.85rem;padding:12px 0">No work experience added yet.</p>';
    return;
  }

  exps.forEach((exp, idx) => {
    const el = document.createElement('div');
    el.style.cssText = 'background:rgba(0,0,0,0.3);padding:16px;border-radius:8px;border:1px solid var(--border-light);margin-top:12px';
    el.innerHTML = `
      <div class="flex-between" style="margin-bottom:6px">
        <strong style="color:var(--text-main);font-size:0.9rem">${exp.role} @ ${exp.company}</strong>
        <button class="btn-danger btn-sm" onclick="deleteExperience(${idx})">Delete</button>
      </div>
      <div style="font-size:0.75rem;color:var(--text-dim);font-family:var(--font-mono);margin-bottom:6px">${exp.dateRange}</div>
      <p style="font-size:0.82rem;color:var(--text-muted)">${exp.desc}</p>
    `;
    list.appendChild(el);
  });
}

function addExperience() {
  const role = prompt("Role Title:");
  if (!role) return;
  const company = prompt("Company:");
  const dateRange = prompt("Date Range (e.g. 2023 - Present):");
  const desc = prompt("Short Description:");
  
  if (!data.about) data.about = {};
  if (!data.about.experience) data.about.experience = [];
  
  data.about.experience.push({ role, company, dateRange, desc });
  saveData('about');
  renderExperienceList();
}

function deleteExperience(idx) {
  if (confirm("Delete this role?")) {
    data.about.experience.splice(idx, 1);
    saveData('about');
    renderExperienceList();
  }
}


// --- MESSAGES (Supabase contact_submissions) ---
async function renderMessages() {
  // Refresh from Supabase
  await loadContactSubmissions();

  const totalEl = document.getElementById('msg-total');
  const newEl = document.getElementById('msg-new');
  const repEl = document.getElementById('msg-replied');
  const tbody = document.getElementById('messages-table-body');
  const cards = document.getElementById('messages-cards-container');
  
  tbody.innerHTML = '';
  if (cards) cards.innerHTML = '';
  
  if (!data.messages) data.messages = [];
  
  const newCount = data.messages.filter(m => m.status === 'New').length;
  const replCount = data.messages.filter(m => m.status === 'Replied').length;
  
  totalEl.textContent = data.messages.length;
  newEl.textContent = newCount;
  repEl.textContent = replCount;
  
  if (data.messages.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:40px">No messages yet. Submissions from your contact form will appear here.</td></tr>';
    if (cards) cards.innerHTML = '<div class="message-card" style="text-align:center;color:var(--text-dim);padding:32px">No messages yet.</div>';
    return;
  }
  
  data.messages.forEach(m => {
    const dateStr = m.date ? new Date(m.date).toLocaleDateString() : '—';
    
    let badgeClass = 'badge-new';
    if (m.status === 'Read') badgeClass = 'badge-read';
    if (m.status === 'Replied') badgeClass = 'badge-replied';
    
    // Desktop row
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="badge ${badgeClass}">${m.status}</span></td>
      <td><strong>${m.name}</strong></td>
      <td style="color:var(--text-muted)">${m.subject || '—'}</td>
      <td style="font-family:var(--font-mono);font-size:0.78rem;color:var(--text-dim)">${dateStr}</td>
      <td>
        <button class="btn-outline btn-sm" onclick="readMessage('${m.id}')">Read</button>
      </td>
    `;
    tbody.appendChild(tr);

    // Mobile card
    if (cards) {
      const card = document.createElement('div');
      card.className = 'message-card';
      card.innerHTML = `
        <div class="message-card-header">
          <span class="message-card-name">${m.name}</span>
          <span class="badge ${badgeClass}">${m.status}</span>
        </div>
        <div class="message-card-subject">${m.subject || 'No subject'}</div>
        <div class="message-card-date">${dateStr}</div>
        <div class="message-card-actions">
          <button class="btn-outline btn-sm w-full" onclick="readMessage('${m.id}')">Read</button>
        </div>
      `;
      cards.appendChild(card);
    }
  });
}

async function refreshMessages() {
  showToast('Refreshing messages...');
  await loadContactSubmissions();
  renderMessages();
}

function readMessage(id) {
  const m = data.messages.find(x => x.id === id);
  if (!m) return;
  
  const v = document.getElementById('message-view-content');
  v.innerHTML = `
    <div style="margin-bottom:20px">
      <div style="font-size:0.75rem;color:var(--text-dim);font-family:var(--font-mono);margin-bottom:4px">FROM</div>
      <div style="font-size:1rem;font-weight:600">${m.name}</div>
      <div style="font-size:0.85rem;color:var(--text-muted)">${m.email}</div>
    </div>
    <div style="margin-bottom:20px">
      <div style="font-size:0.75rem;color:var(--text-dim);font-family:var(--font-mono);margin-bottom:4px">SUBJECT / BUDGET</div>
      <div style="font-size:0.95rem">${m.subject || 'N/A'} ${m.budget ? '— ' + m.budget : ''}</div>
    </div>
    <div style="margin-bottom:20px">
      <div style="font-size:0.75rem;color:var(--text-dim);font-family:var(--font-mono);margin-bottom:4px">DATE</div>
      <div style="font-size:0.85rem;color:var(--text-muted)">${m.date ? new Date(m.date).toLocaleString() : '—'}</div>
    </div>
    <div style="margin-bottom:24px">
      <div style="font-size:0.75rem;color:var(--text-dim);font-family:var(--font-mono);margin-bottom:8px">MESSAGE</div>
      <div style="background:rgba(0,0,0,0.3);padding:16px;border-radius:8px;white-space:pre-wrap;border:1px solid var(--border-light);font-size:0.9rem;line-height:1.6">${m.message}</div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <a href="mailto:${m.email}" class="btn-outline" style="flex:1;text-align:center;justify-content:center">Reply via Email</a>
      <button class="btn-neon" style="flex:1" onclick="markMessageReplied('${m.id}')">Mark Replied</button>
    </div>
    <button class="btn-danger w-full mt-2" onclick="deleteMessage('${m.id}')">Delete Message</button>
  `;
  
  // Mark as read in Supabase
  if (m.status === 'New') {
    updateMessageStatus(m.id, 'Read');
    m.status = 'Read';
    renderMessages();
  }
  
  document.getElementById('message-modal').classList.add('open');
  document.getElementById('modal-overlay').style.display = 'block';
}

function closeMessageModal() {
  document.getElementById('message-modal').classList.remove('open');
  document.getElementById('modal-overlay').style.display = 'none';
}

async function updateMessageStatus(id, status) {
  try {
    const updateData = { status };
    if (status === 'Read') updateData.read_at = new Date().toISOString();
    
    await window.supabaseClient
      .from('contact_submissions')
      .update(updateData)
      .eq('id', id);
  } catch (err) {
    console.warn('Could not update message status:', err);
  }
}

async function markMessageReplied(id) {
  const m = data.messages.find(x => x.id === id);
  if (m) {
    m.status = 'Replied';
    await updateMessageStatus(id, 'Replied');
    renderMessages();
    closeMessageModal();
    showToast('Marked as replied');
  }
}

async function deleteMessage(id) {
  if (confirm('Delete this message permanently?')) {
    try {
      const { error } = await window.supabaseClient
        .from('contact_submissions')
        .delete()
        .eq('id', id);

      if (error) {
        showToast('Failed to delete message', 'error');
        return;
      }

      data.messages = data.messages.filter(x => x.id !== id);
      renderMessages();
      closeMessageModal();
      showToast('Message deleted', 'warning');
    } catch (err) {
      showToast('Network error', 'error');
    }
  }
}


// --- TEMPLATE ---
function renderTemplateForm() {
  const t = data.template || {};
  document.getElementById('tpl-visible').checked = !!t.visible;
  document.getElementById('tpl-name').value = t.name || '';
  document.getElementById('tpl-desc').value = t.desc || '';
  document.getElementById('tpl-price').value = t.price || '';
  document.getElementById('tpl-url').value = t.url || '';
  document.getElementById('tpl-btn-text').value = t.btnText || '';
  document.getElementById('tpl-included').value = t.included || '';
  document.getElementById('tpl-count').value = t.salesCount || 0;
  document.getElementById('tpl-notes').value = t.notes || '';
}

function saveTemplate() {
  data.template = {
    visible: document.getElementById('tpl-visible').checked,
    name: document.getElementById('tpl-name').value,
    desc: document.getElementById('tpl-desc').value,
    price: document.getElementById('tpl-price').value,
    url: document.getElementById('tpl-url').value,
    btnText: document.getElementById('tpl-btn-text').value,
    included: document.getElementById('tpl-included').value,
    salesCount: document.getElementById('tpl-count').value,
    notes: document.getElementById('tpl-notes').value
  };
  saveData('template', 'Updated Template sales details');
  showToast('Template details saved');
}


// --- SETTINGS ---
function renderSettingsForm() {
  const s = data.settings || {};
  document.getElementById('set-name').value = s.name || '';
  document.getElementById('set-brand').value = s.brand || '';
  document.getElementById('set-tagline').value = s.tagline || '';
  document.getElementById('set-location').value = s.location || '';
  
  document.getElementById('set-whatsapp').value = s.whatsapp || '';
  document.getElementById('set-email').value = s.email || '';
  document.getElementById('set-email2').value = s.email2 || '';
  document.getElementById('set-linkedin').value = s.linkedin || '';
  document.getElementById('set-twitter').value = s.twitter || '';
  document.getElementById('set-github').value = s.github || '';
  document.getElementById('set-dribbble').value = s.dribbble || '';
  document.getElementById('set-instagram').value = s.instagram || '';
  document.getElementById('set-contra').value = s.contra || '';
  document.getElementById('set-upwork').value = s.upwork || '';
}

async function saveSettings() {
  const s = data.settings || {};
  s.name = document.getElementById('set-name').value;
  s.brand = document.getElementById('set-brand').value;
  s.tagline = document.getElementById('set-tagline').value;
  s.location = document.getElementById('set-location').value;
  
  s.whatsapp = document.getElementById('set-whatsapp').value;
  s.email = document.getElementById('set-email').value;
  s.email2 = document.getElementById('set-email2').value;
  s.linkedin = document.getElementById('set-linkedin').value;
  s.twitter = document.getElementById('set-twitter').value;
  s.github = document.getElementById('set-github').value;
  s.dribbble = document.getElementById('set-dribbble').value;
  s.instagram = document.getElementById('set-instagram').value;
  s.contra = document.getElementById('set-contra').value;
  s.upwork = document.getElementById('set-upwork').value;

  data.settings = s;
  await saveData('settings', 'Updated Global Settings');
  showToast('Global settings saved');
}


// --- DANGER ZONE ---
function clearAllData() {
  if (confirm("STEP 1: Are you sure you want to clear ALL local data?")) {
    if (confirm("STEP 2: This will wipe localStorage. Wait, data is now in Supabase, but this clears local fallbacks and theme.")) {
      if (prompt("STEP 3: Type 'DELETE' to confirm:") === 'DELETE') {
        localStorage.clear();
        sessionStorage.clear();
        alert("Local data cleared. Returning to dashboard.");
        location.reload();
      }
    }
  }
}

function exportData() {
  const exportBlob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(exportBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jx-portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  logActivity('Exported site data backup');
  showToast('Data exported successfully');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const parsed = JSON.parse(evt.target.result);
      if (confirm('Are you sure you want to overwrite current data with this file?')) {
        data = Object.assign(data, parsed);
        for (let key in KEYS) saveData(key);
        logActivity('Imported data from backup file');
        showToast('Data imported successfully. Reloading...');
        setTimeout(() => location.reload(), 1500);
      }
    } catch(err) {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
}


// --- UTILITIES ---
function generateId(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 10000);
}


// =========================================
//   VISUAL EDITOR MODULE
// =========================================

let veState = {
  currentPage: 'home',
  currentDevice: 'desktop',
  pendingChanges: {},
  panelWidth: 340,
  initialized: false
};


const VE_GLOBAL_STYLES = [
  {
    id: 'brand-colors',
    label: 'Brand Colors',
    icon: 'palette',
    fields: [
      { key: 'primary_color', label: 'Primary Color (Neon Green)', type: 'color', default: '#33ff14', dataPath: 'global_styles.primary_color' },
      { key: 'bg_color', label: 'Background Color', type: 'color', default: '#000000', dataPath: 'global_styles.bg_color' },
      { key: 'bg_secondary', label: 'Secondary Background', type: 'color', default: '#0f0f0f', dataPath: 'global_styles.bg_secondary' }
    ]
  },
  {
    id: 'typography',
    label: 'Typography',
    icon: 'type',
    fields: [
      { key: 'font_heading', label: 'Heading Font', type: 'select', options: ['Syne', 'Playfair Display', 'Space Grotesk', 'DM Serif Display', 'Clash Display'], default: 'Syne', dataPath: 'global_styles.font_heading' },
      { key: 'font_body', label: 'Body Font', type: 'select', options: ['Space Grotesk', 'Inter', 'Plus Jakarta Sans', 'DM Sans'], default: 'Space Grotesk', dataPath: 'global_styles.font_body' },
      { key: 'font_mono', label: 'Mono Font', type: 'select', options: ['JetBrains Mono', 'Fira Code', 'Space Mono', 'IBM Plex Mono'], default: 'JetBrains Mono', dataPath: 'global_styles.font_mono' }
    ]
  },
  {
    id: 'spacing',
    label: 'Spacing',
    icon: 'move',
    fields: [
      { key: 'section_padding', label: 'Section Padding', type: 'range', min: 60, max: 160, unit: 'px', default: 100, dataPath: 'global_styles.section_padding' },
      { key: 'border_radius', label: 'Border Radius', type: 'range', min: 0, max: 20, unit: 'px', default: 12, dataPath: 'global_styles.border_radius' }
    ]
  },
  {
    id: 'effects',
    label: 'Effects',
    icon: 'sparkles',
    fields: [
      { key: 'particle_intensity', label: 'Particle Intensity', type: 'range', min: 0, max: 100, default: 50, dataPath: 'global_styles.particle_intensity' },
      { key: 'cursor_style', label: 'Cursor Style', type: 'select', options: ['Classic neon dot', 'Ring only', 'Dot + Ring', 'None'], default: 'Classic neon dot', dataPath: 'global_styles.cursor_style' },
      { key: 'noise_opacity', label: 'Noise Overlay Opacity', type: 'range', min: 0, max: 8, unit: '%', default: 4, dataPath: 'global_styles.noise_opacity' }
    ]
  },
  {
    id: 'theme-mode',
    label: 'Light/Dark Mode',
    icon: 'moon',
    fields: [
      { key: 'default_mode', label: 'Default Mode', type: 'select', options: ['Dark', 'Light'], default: 'Dark', dataPath: 'global_styles.default_mode' },
      { key: 'allow_visitor_toggle', label: 'Allow visitor toggle', type: 'toggle', default: true, dataPath: 'global_styles.allow_visitor_toggle' }
    ]
  }
];

const VE_PAGES = {
  home: {
    url: 'index.html',
    label: 'Home',
    sections: [
      {
        id: 'hero',
        label: 'Hero Content',
        icon: '✦',
        fields: [
          { key: 'hero_eyebrow', label: 'Eyebrow Label', type: 'text', dataPath: 'hero.eyebrow' },
          { key: 'hero_title1', label: 'Name Line 1', type: 'text-with-font', dataPath: 'hero.s1_l1', fontPath: 'hero.s1_l1_font', options: ['Syne', 'Playfair Display', 'Share Tech Mono'] },
          { key: 'hero_title2', label: 'Name Line 2', type: 'text-with-toggle', dataPath: 'hero.s1_l2', togglePath: 'hero.s1_l2_stroke', toggleLabel: 'Stroke Only' },
          { key: 'hero_subtitle', label: 'Subtitle', type: 'textarea', dataPath: 'hero.subtitle' },
          { key: 'hero_btn1', label: 'Button 1 Text', type: 'text', dataPath: 'hero.btn1' },
          { key: 'hero_btn2', label: 'Button 2 Text', type: 'text', dataPath: 'hero.btn2' },
          { key: 'hero_badge1', label: 'Badge 1 Text', type: 'text', dataPath: 'hero.badge1' },
          { key: 'hero_badge2', label: 'Badge 2 Text', type: 'text', dataPath: 'hero.badge2' },
          { key: 'hero_avail', label: 'Availability', type: 'toggle', dataPath: 'hero.available' }
        ]
      },
      {
        id: 'glitch-states',
        label: 'Glitch States',
        icon: '⚡',
        fields: [
          { key: 'glitch_1', label: 'State 1', type: 'glitch-state', dataPath: 'hero.glitch_1' },
          { key: 'glitch_2', label: 'State 2', type: 'glitch-state', dataPath: 'hero.glitch_2' },
          { key: 'glitch_3', label: 'State 3', type: 'glitch-state', dataPath: 'hero.glitch_3' },
          { key: 'glitch_4', label: 'State 4', type: 'glitch-state', dataPath: 'hero.glitch_4' }
        ]
      },
      {
        id: 'skill-tags',
        label: 'Skill Tags',
        icon: '🏷️',
        fields: [
          { key: 'hero_skills', label: 'Skill Tags', type: 'tags', dataPath: 'hero.skills' }
        ]
      },
      {
        id: 'stats',
        label: 'Stats Bar',
        icon: '📊',
        fields: [
          { key: 'stat_1_val', label: 'Stat 1 Value', type: 'text', selector: '#stat-1', attr: 'textContent' },
          { key: 'stat_1_label', label: 'Stat 1 Label', type: 'text', selectorIndex: { parent: '.stat', index: 0, child: '.stat-label' }, attr: 'textContent' },
          { key: 'stat_2_val', label: 'Stat 2 Value', type: 'text', selector: '#stat-2', attr: 'textContent' },
          { key: 'stat_2_label', label: 'Stat 2 Label', type: 'text', selectorIndex: { parent: '.stat', index: 1, child: '.stat-label' }, attr: 'textContent' },
          { key: 'stat_3_val', label: 'Stat 3 Value', type: 'text', selector: '#stat-3', attr: 'textContent' },
          { key: 'stat_3_label', label: 'Stat 3 Label', type: 'text', selectorIndex: { parent: '.stat', index: 2, child: '.stat-label' }, attr: 'textContent' },
          { key: 'stat_4_val', label: 'Stat 4 Value', type: 'text', selector: '#stat-4', attr: 'textContent' },
          { key: 'stat_4_label', label: 'Stat 4 Label', type: 'text', selectorIndex: { parent: '.stat', index: 3, child: '.stat-label' }, attr: 'textContent' }
        ]
      },
      {
        id: 'marquee',
        label: 'Tool Marquee',
        icon: '🔧',
        fields: [
          { key: 'marquee_tools', label: 'Tools List', type: 'list', dataPath: 'hero.marquee_tools' }
        ]
      },
      {
        id: 'home-about',
        label: 'About Preview',
        icon: '👤',
        fields: [
          { key: 'about_title', label: 'Section Title', type: 'textarea', selector: '#home-about-title', attr: 'textContent', dataPath: 'about.h1' },
          { key: 'about_desc1', label: 'Paragraph 1', type: 'textarea', selector: '#home-about-desc1', attr: 'textContent', dataPath: 'about.desc' },
          { key: 'about_desc2', label: 'Paragraph 2', type: 'textarea', selector: '#home-about-desc2', attr: 'textContent' },
          { key: 'about_fun', label: 'Fun Fact', type: 'text', selector: '#home-about-fun', attr: 'textContent', dataPath: 'about.funfact' }
        ]
      },
      {
        id: 'home-contact',
        label: 'Contact Section',
        icon: '📬',
        fields: [
          { key: 'contact_email', label: 'Email Address', type: 'text', selector: '.contact-email', attr: 'textContent', dataPath: 'settings.email' }
        ]
      }
    ]
  },
  work: {
    url: 'work.html',
    label: 'Work',
    sections: [
      {
        id: 'work-header',
        label: 'Page Header',
        icon: '📄',
        fields: [
          { key: 'work_subtitle', label: 'Subtitle Text', type: 'text', selector: '.portfolio-subtitle', attr: 'textContent' }
        ]
      },
      {
        id: 'work-projects',
        label: 'Projects Grid',
        icon: '📁',
        fields: [
          { key: 'work_projects_note', label: '', type: 'readonly', note: 'Projects are managed from the Projects section in the sidebar.' }
        ]
      }
    ]
  },
  about: {
    url: 'about.html',
    label: 'About',
    sections: [
      {
        id: 'about-hero',
        label: 'Hero Bio',
        icon: '✦',
        fields: [
          { key: 'about_heading', label: 'Heading', type: 'textarea', selector: '#about-page-heading', attr: 'textContent' },
          { key: 'about_subtext', label: 'Bio Text', type: 'textarea', selector: '#about-page-subtext', attr: 'textContent' }
        ]
      },
      {
        id: 'about-timeline',
        label: 'Journey Timeline',
        icon: '🗓️',
        fields: [
          { key: 'about_timeline_note', label: '', type: 'readonly', note: 'Timeline entries are hardcoded. Contact your developer to update.' }
        ]
      },
      {
        id: 'about-experience',
        label: 'Experience',
        icon: '💼',
        fields: [
          { key: 'about_exp_note', label: '', type: 'readonly', note: 'Experience is managed from the About Page section in the sidebar.' }
        ]
      }
    ]
  },
  services: {
    url: 'services.html',
    label: 'Services',
    sections: [
      {
        id: 'services-header',
        label: 'Page Header',
        icon: '📄',
        fields: [
          { key: 'services_title', label: 'Page Title', type: 'text', selector: '.sp-title', attr: 'textContent' },
          { key: 'services_sub', label: 'Subtitle', type: 'text', selector: '.sp-subtitle', attr: 'textContent' }
        ]
      },
      {
        id: 'services-list',
        label: 'Services',
        icon: '⚡',
        fields: [
          { key: 'services_note', label: '', type: 'readonly', note: 'Services are managed from the Services section in the sidebar.' }
        ]
      }
    ]
  },
  contact: {
    url: 'contact.html',
    label: 'Contact',
    sections: [
      {
        id: 'contact-header',
        label: 'Page Header',
        icon: '📬',
        fields: [
          { key: 'contact_heading', label: 'Heading', type: 'textarea', selector: '.cp-title', attr: 'textContent' }
        ]
      },
      {
        id: 'contact-form-config',
        label: 'Form Configuration',
        icon: '📋',
        fields: [
          { key: 'contact_subjects', label: 'Subject Options', type: 'list', dataPath: 'settings.contact_subjects' },
          { key: 'contact_budgets', label: 'Budget Options', type: 'list', dataPath: 'settings.contact_budgets' }
        ]
      },
      {
        id: 'contact-sidebar',
        label: 'Sidebar Info',
        icon: '📌',
        fields: [
          { key: 'contact_whatsapp', label: 'WhatsApp Number', type: 'text', dataPath: 'settings.whatsapp' },
          { key: 'contact_response', label: 'Response Time Text', type: 'text', selector: '.cp-response', attr: 'textContent' }
        ]
      },
      {
        id: 'contact-template',
        label: 'Template Sale Card',
        icon: '💼',
        fields: [
          { key: 'tpl_price', label: 'Price Text', type: 'text', selector: '.cp-tpl-price', attr: 'textContent', dataPath: 'template.price' },
          { key: 'tpl_desc', label: 'Description', type: 'textarea', selector: '.cp-tpl-desc', attr: 'textContent', dataPath: 'template.desc' }
        ]
      }
    ]
  }
};


// --- Visual Editor: Entry Point ---
function renderVisualEditor() {
  if (!veState.initialized) {
    initVisualEditor();
  }
  const sectionsContainer = document.querySelector('.sections-container');
  if (sectionsContainer) sectionsContainer.classList.add('ve-fullscreen');
}

function initVisualEditor() {
  veState.initialized = true;

  const pageSelect = document.getElementById('ve-page-select');
  if (pageSelect) {
    pageSelect.addEventListener('change', (e) => {
      veLoadPage(e.target.value);
    });
  }

  document.querySelectorAll('.ve-device-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      veSetDevice(btn.getAttribute('data-device'));
    });
  });

  const publishBtn = document.getElementById('ve-publish-btn');
  if (publishBtn) publishBtn.addEventListener('click', vePublishChanges);

  const discardBtn = document.getElementById('ve-discard-btn');
  if (discardBtn) discardBtn.addEventListener('click', veDiscardChanges);

  initDividerDrag();
  veLoadPage('home');
}


// --- Visual Editor: Page Loading ---
function veLoadPage(pageKey) {
  veState.currentPage = pageKey;
  veState.pendingChanges = {};

  if (pageKey === 'navigation') {
    veRenderNavigationEditor();
    return;
  }

  const pageConfig = VE_PAGES[pageKey];
  if (!pageConfig) return;

  const controlsTitle = document.getElementById('ve-controls-title');
  if (controlsTitle) controlsTitle.textContent = pageConfig.label;

  const chromeUrl = document.getElementById('ve-chrome-url');
  if (chromeUrl) {
    chromeUrl.textContent = pageKey === 'home' ? 'jxdesigndev.com' : 'jxdesigndev.com/' + pageKey;
  }

  const iframe = document.getElementById('ve-iframe');
  if (iframe) {
    iframe.src = pageConfig.url;
    iframe.onload = () => {
      veRenderSections(pageKey);
      vePopulateFields(pageKey);
    };
  }

  veUpdateChangeCount();
}


// --- Visual Editor: Accordion Sections ---
function veRenderSections(pageKey) {
  const pageConfig = VE_PAGES[pageKey];
  if (!pageConfig) return;

  const accordion = document.getElementById('ve-accordion');
  if (!accordion) return;
  accordion.innerHTML = '';


  if (pageKey === 'work') {
    veRenderProjectsList();
    return;
  }

  pageConfig.sections.forEach((section, idx) => {
    const item = document.createElement('div');
    item.className = 've-accordion-item';
    item.setAttribute('data-section', section.id);

    const fieldsHtml = section.fields.map(f => veRenderField(f)).join('');

    item.innerHTML = `
      <div class="ve-accordion-header" data-section="${section.id}">
        <span class="ve-accordion-icon">${section.icon}</span>
        <span class="ve-accordion-label">${section.label}</span>
        <i data-lucide="chevron-down" class="ve-accordion-chevron" style="width:16px;height:16px"></i>
      </div>
      <div class="ve-accordion-body">
        ${fieldsHtml}
      </div>
    `;

    accordion.appendChild(item);

    // Bind toggle
    const header = item.querySelector('.ve-accordion-header');
    header.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      // Close all
      accordion.querySelectorAll('.ve-accordion-item').forEach(ai => ai.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });

    // Auto-open first section
    if (idx === 0) item.classList.add('open');
  });

  // Re-init Lucide icons for chevrons
  if (window.lucide) lucide.createIcons();
}

function veRenderField(field) {
  
  if (field.type === 'color') {
    return `
      <div class="ve-field">
        <label class="ve-field-label">${field.label}</label>
        <div class="ve-field-group-row">
          <input type="color" class="ve-color-picker" data-key="${field.key}_color" style="width: 40px;" />
          <input type="text" class="ve-field-input" data-key="${field.key}" style="flex: 1;" placeholder="#000000" />
        </div>
      </div>`;
  }
  if (field.type === 'range') {
    return `
      <div class="ve-field">
        <label class="ve-field-label" style="display:flex; justify-content:space-between;">
          <span>${field.label}</span>
          <span data-key="${field.key}_val" style="color:var(--neon-green)"></span>
        </label>
        <input type="range" class="ve-field-range" data-key="${field.key}" min="${field.min}" max="${field.max}" step="${field.step || 1}" />
      </div>`;
  }
  if (field.type === 'select') {
    return `
      <div class="ve-field">
        <label class="ve-field-label">${field.label}</label>
        <select class="ve-field-input" data-key="${field.key}">
          ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
        </select>
      </div>`;
  }
  if (field.type === 'text') {
    return `
      <div class="ve-field">
        <label class="ve-field-label">${field.label}</label>
        <input type="text" class="ve-field-input" data-key="${field.key}" />
      </div>`;
  }
  if (field.type === 'textarea') {
    return `
      <div class="ve-field">
        <label class="ve-field-label">${field.label}</label>
        <textarea class="ve-field-textarea" data-key="${field.key}"></textarea>
      </div>`;
  }
  if (field.type === 'toggle') {
    return `
      <div class="ve-field">
        <label class="ve-field-label">${field.label}</label>
        <label class="switch">
          <input type="checkbox" data-key="${field.key}" />
          <span class="slider"></span>
        </label>
      </div>`;
  }
  if (field.type === 'list') {
    return `
      <div class="ve-field">
        <label class="ve-field-label">${field.label}</label>
        <div class="ve-list-editor" data-key="${field.key}">
          <div class="ve-list-items"></div>
          <div class="ve-list-add">
            <input type="text" class="ve-field-input ve-list-add-input" placeholder="Add item..." />
            <button type="button" class="btn-outline btn-sm ve-list-add-btn">+</button>
          </div>
          ${field.key === 'marquee_tools' ? '<p class="ve-readonly-note" style="margin-top:6px"><i data-lucide="info" style="width:14px;height:14px"></i> Marquee updates on page reload after publish.</p>' : ''}
        </div>
      </div>`;
  }
  if (field.type === 'readonly') {
    return `
      <div class="ve-field ve-field-readonly">
        <p class="ve-readonly-note"><i data-lucide="info" style="width:14px;height:14px"></i> ${field.note}</p>
      </div>`;
  }
  if (field.type === 'text-with-font') {
    return `
      <div class="ve-field">
        <label class="ve-field-label">${field.label}</label>
        <div class="ve-field-group-row">
          <input type="text" class="ve-field-input" data-key="${field.key}" style="flex:1" />
          <select class="ve-field-input" data-key="${field.key}_font" style="width:140px">
            ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
        </div>
      </div>`;
  }
  if (field.type === 'text-with-toggle') {
    return `
      <div class="ve-field">
        <label class="ve-field-label">${field.label}</label>
        <div class="ve-field-group-row">
          <input type="text" class="ve-field-input" data-key="${field.key}" style="flex:1" />
          <label class="switch" title="${field.toggleLabel}">
            <input type="checkbox" data-key="${field.key}_toggle" />
            <span class="slider"></span>
          </label>
        </div>
      </div>`;
  }
  if (field.type === 'glitch-state') {
    return `
      <div class="ve-state-editor">
        <label class="ve-field-label" style="margin-bottom:8px">${field.label}</label>
        <input type="text" class="ve-field-input" data-key="${field.key}_l1" placeholder="Line 1" style="margin-bottom:8px" />
        <input type="text" class="ve-field-input" data-key="${field.key}_l2" placeholder="Line 2" style="margin-bottom:8px" />
        <div class="ve-field-group-row">
          <select class="ve-field-input" data-key="${field.key}_font" style="flex:1">
            <option value="Syne">Syne</option>
            <option value="Playfair Display">Playfair</option>
            <option value="Share Tech Mono">Share Tech</option>
          </select>
          <input type="color" class="ve-color-picker" data-key="${field.key}_color" value="#ffffff" />
          <input type="number" class="ve-field-input" data-key="${field.key}_duration" placeholder="ms" style="width:70px" />
        </div>
      </div>`;
  }
  if (field.type === 'tags') {
    return `
      <div class="ve-field">
        <label class="ve-field-label">${field.label}</label>
        <div class="ve-tags-editor" data-key="${field.key}">
          <div class="ve-tags-list" data-key="${field.key}_list"></div>
          <input type="text" class="ve-field-input ve-tag-add-input" data-key="${field.key}_input" placeholder="Add tag and press Enter..." />
        </div>
      </div>`;
  }
  return '';
}


// --- Visual Editor: Field Population ---
function vePopulateFields(pageKey) {
  if (pageKey === 'work' || pageKey === 'navigation') return;
  const pageConfig = VE_PAGES[pageKey];
  if (!pageConfig) return;

  pageConfig.sections.forEach(section => {
    section.fields.forEach(field => {
      if (field.type === 'readonly') return;

      const value = veGetFieldValue(field);

      if (field.type === 'list') {
        vePopulateListField(field, value);
        return;
      }
      if (field.type === 'tags') {
        vePopulateTagsField(field, value || []);
        return;
      }
      if (field.type === 'text-with-font') {
        const textInput = document.querySelector(`[data-key="${field.key}"]`);
        const fontInput = document.querySelector(`[data-key="${field.key}_font"]`);
        if (textInput) {
          textInput.value = value || '';
          textInput.addEventListener('input', e => veHandleFieldChange(field.key, e.target.value));
        }
        if (fontInput) {
          fontInput.value = veGetFieldValue({ dataPath: field.fontPath }) || 'Syne';
          fontInput.addEventListener('change', e => veHandleCustomPathChange(field.fontPath, e.target.value));
        }
        return;
      }
      if (field.type === 'text-with-toggle') {
        const textInput = document.querySelector(`[data-key="${field.key}"]`);
        const toggleInput = document.querySelector(`[data-key="${field.key}_toggle"]`);
        if (textInput) {
          textInput.value = value || '';
          textInput.addEventListener('input', e => veHandleFieldChange(field.key, e.target.value));
        }
        if (toggleInput) {
          toggleInput.checked = !!veGetFieldValue({ dataPath: field.togglePath });
          toggleInput.addEventListener('change', e => veHandleCustomPathChange(field.togglePath, e.target.checked));
        }
        return;
      }
      if (field.type === 'glitch-state') {
        const state = value || {};
        ['l1', 'l2', 'font', 'color', 'duration'].forEach(prop => {
          const input = document.querySelector(`[data-key="${field.key}_${prop}"]`);
          if (input) {
            input.value = state[prop] || '';
            input.addEventListener('input', (e) => {
              const val = e.target.value;
              const currentState = veGetFieldValue(field) || {};
              currentState[prop] = prop === 'duration' ? parseInt(val, 10) : val;
              veHandleFieldChange(field.key, currentState);
            });
          }
        });
        return;
      }

      
      if (field.type === 'color') {
        const colorInput = document.querySelector(`[data-key="${field.key}_color"]`);
        const textInput = document.querySelector(`[data-key="${field.key}"]`);
        const val = value !== undefined ? value : field.default;
        if (colorInput) colorInput.value = val;
        if (textInput) textInput.value = val;
        
        const updateColor = (newVal) => {
          if (colorInput) colorInput.value = newVal;
          if (textInput) textInput.value = newVal;
          if (field.dataPath) veHandleCustomPathChange(field.dataPath, newVal);
          else veHandleFieldChange(field.key, newVal);
        };
        if (colorInput) colorInput.addEventListener('input', e => updateColor(e.target.value));
        if (textInput) textInput.addEventListener('input', e => updateColor(e.target.value));
        return;
      }
      if (field.type === 'range') {
        const rangeInput = document.querySelector(`[data-key="${field.key}"]`);
        const valLabel = document.querySelector(`[data-key="${field.key}_val"]`);
        const val = value !== undefined ? value : field.default;
        
        if (rangeInput) rangeInput.value = val;
        if (valLabel) valLabel.textContent = val + (field.unit || '');
        
        if (rangeInput) {
          rangeInput.addEventListener('input', e => {
            const v = e.target.value;
            if (valLabel) valLabel.textContent = v + (field.unit || '');
            if (field.dataPath) veHandleCustomPathChange(field.dataPath, parseInt(v, 10));
            else veHandleFieldChange(field.key, parseInt(v, 10));
          });
        }
        return;
      }
      if (field.type === 'select') {
        const selectEl = document.querySelector(`[data-key="${field.key}"]`);
        const val = value !== undefined ? value : field.default;
        if (selectEl) {
          selectEl.value = val;
          selectEl.addEventListener('change', e => {
            if (field.dataPath) veHandleCustomPathChange(field.dataPath, e.target.value);
            else veHandleFieldChange(field.key, e.target.value);
          });
        }
        return;
      }

      const el = document.querySelector(`[data-key="${field.key}"]`);
      if (!el) return;

      if (field.type === 'toggle') {
        el.checked = !!value;
      } else {
        el.value = value || '';
      }

      el.addEventListener('input', (e) => {
        const val = field.type === 'toggle' ? e.target.checked : e.target.value;
        veHandleFieldChange(field.key, val);
      });
      if (field.type === 'toggle') {
        el.addEventListener('change', (e) => {
          veHandleFieldChange(field.key, e.target.checked);
        });
      }
    });
  });
}

function vePopulateTagsField(field, items) {
  const listEl = document.querySelector(`[data-key="${field.key}_list"]`);
  const inputEl = document.querySelector(`[data-key="${field.key}_input"]`);
  if (!listEl || !inputEl) return;

  listEl.innerHTML = '';
  items.forEach((tag, idx) => {
    const tagEl = document.createElement('div');
    tagEl.className = 've-tag';
    tagEl.draggable = true;
    tagEl.innerHTML = `
      <span>${tag}</span>
      <span class="ve-tag-remove" data-idx="${idx}">&times;</span>
    `;
    
    tagEl.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', idx);
      tagEl.classList.add('dragging');
    });
    tagEl.addEventListener('dragend', () => {
      tagEl.classList.remove('dragging');
    });
    tagEl.addEventListener('dragover', e => e.preventDefault());
    tagEl.addEventListener('drop', e => {
      e.preventDefault();
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const toIdx = idx;
      if (fromIdx !== toIdx) {
        const newItems = [...items];
        const [moved] = newItems.splice(fromIdx, 1);
        newItems.splice(toIdx, 0, moved);
        veHandleFieldChange(field.key, newItems);
        vePopulateTagsField(field, newItems);
      }
    });

    listEl.appendChild(tagEl);
  });

  listEl.querySelectorAll('.ve-tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      items.splice(idx, 1);
      veHandleFieldChange(field.key, items);
      vePopulateTagsField(field, items);
    });
  });

  // Re-bind input
  const newInputEl = inputEl.cloneNode(true);
  inputEl.parentNode.replaceChild(newInputEl, inputEl);
  newInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = newInputEl.value.trim();
      if (val) {
        items.push(val);
        veHandleFieldChange(field.key, items);
        vePopulateTagsField(field, items);
        newInputEl.value = '';
      }
    }
  });
}

function vePopulateListField(field, value) {
  const container = document.querySelector(`.ve-list-editor[data-key="${field.key}"]`);
  if (!container) return;

  let items = [];
  if (Array.isArray(value)) {
    items = value;
  } else if (typeof value === 'string' && value.length > 0) {
    items = value.split(',').map(s => s.trim()).filter(Boolean);
  }

  const listItems = container.querySelector('.ve-list-items');
  listItems.innerHTML = '';

  items.forEach((item, idx) => {
    const displayText = (typeof item === 'object' && item.name) ? item.name : String(item);
    const itemEl = document.createElement('div');
    itemEl.className = 've-list-item';
    itemEl.innerHTML = `
      <span class="ve-list-item-text">${displayText}</span>
      <button type="button" class="ve-list-remove-btn" data-idx="${idx}">&times;</button>
    `;
    listItems.appendChild(itemEl);
  });

  // Bind remove buttons
  listItems.querySelectorAll('.ve-list-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const removeIdx = parseInt(btn.getAttribute('data-idx'), 10);
      items.splice(removeIdx, 1);
      veHandleFieldChange(field.key, items);
      vePopulateListField(field, items);
    });
  });

  // Bind add button
  const addBtn = container.querySelector('.ve-list-add-btn');
  const addInput = container.querySelector('.ve-list-add-input');

  // Clone to remove old listeners
  const newAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newAddBtn, addBtn);

  newAddBtn.addEventListener('click', () => {
    const newVal = addInput.value.trim();
    if (!newVal) return;

    if (field.key === 'marquee_tools') {
      items.push({ name: newVal, icon: '🔧' });
    } else {
      items.push(newVal);
    }

    addInput.value = '';
    veHandleFieldChange(field.key, items);
    vePopulateListField(field, items);
  });

  // Allow Enter key to add
  addInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      newAddBtn.click();
    }
  });
}


// --- Visual Editor: Change Handling ---
let veSaveTimeout = null;

function veHandleFieldChange(key, value) {
  veState.pendingChanges[key] = value;
  veUpdateChangeCount();

  const field = veFindFieldByKey(key);
  if (field && field.dataPath) {
    veSetDataByPath(field.dataPath, value);
    const rootKey = field.dataPath.split('.')[0];
    
    if (veSaveTimeout) clearTimeout(veSaveTimeout);
    veSaveTimeout = setTimeout(() => {
      saveData(rootKey).then(() => {
        const iframe = document.getElementById('ve-iframe');
        if (iframe) iframe.contentWindow.location.reload();
      });
    }, 500);
  } else {
    // For fields that just modify the iframe DOM live (legacy behavior)
    veApplyToIframe(key, value);
  }
}

function veHandleCustomPathChange(path, value) {
  veState.pendingChanges[path] = value;
  veUpdateChangeCount();
  veSetDataByPath(path, value);
  
  const rootKey = path.split('.')[0];
  if (veSaveTimeout) clearTimeout(veSaveTimeout);
  veSaveTimeout = setTimeout(() => {
    saveData(rootKey).then(() => {
      const iframe = document.getElementById('ve-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    });
  }, 500);
}

function veApplyToIframe(key, value) {
  const field = veFindFieldByKey(key);
  if (!field) return;

  const iframe = document.getElementById('ve-iframe');
  if (!iframe || !iframe.contentDocument) return;

  try {
    let el = null;

    if (field.selector) {
      el = iframe.contentDocument.querySelector(field.selector);
    } else if (field.selectorIndex) {
      const parents = iframe.contentDocument.querySelectorAll(field.selectorIndex.parent);
      if (parents[field.selectorIndex.index]) {
        el = parents[field.selectorIndex.index].querySelector(field.selectorIndex.child);
      }
    }

    if (el && field.attr) {
      el[field.attr] = value;
    }
  } catch (err) {
    // Cross-origin or element not found — silently skip
    console.warn('veApplyToIframe: Could not update', key, err.message);
  }
}

function veFindFieldByKey(key) {
  for (const pageKey of Object.keys(VE_PAGES)) {
    for (const section of VE_PAGES[pageKey].sections) {
      for (const field of section.fields) {
        if (field.key === key) return field;
      }
    }
  }
  return null;
}


// --- Visual Editor: Publish & Discard ---
async function vePublishChanges() {
  const count = Object.keys(veState.pendingChanges).length;
  if (count === 0) {
    showToast('No changes to publish', 'warning');
    return;
  }

  const btn = document.querySelector('.ve-btn-publish');
  if (btn) btn.innerHTML = '<i data-lucide="loader" class="spin"></i> Publishing...';

  // Update needs_redeploy flag in Supabase
  try {
    const { error } = await window.supabaseClient
      .from('site_settings')
      .update({ needs_redeploy: true })
      .eq('id', 1);
      
    if (error) throw error;
    
    showToast('Published! Triggering redeploy...', 'success');
    logActivity('Triggered visual editor redeploy');
    
    veState.pendingChanges = {};
    veUpdateChangeCount();
  } catch (err) {
    showToast('Failed to trigger redeploy', 'error');
    console.error('Redeploy error:', err);
  } finally {
    if (btn) {
      btn.innerHTML = '<i data-lucide="upload-cloud"></i> Publish Changes';
      if (window.lucide) lucide.createIcons();
    }
  }
}

function veDiscardChanges() {
  veState.pendingChanges = {};

  const iframe = document.getElementById('ve-iframe');
  const pageConfig = VE_PAGES[veState.currentPage];
  if (iframe && pageConfig) {
    iframe.src = pageConfig.url;
    iframe.onload = () => {
      vePopulateFields(veState.currentPage);
    };
  }

  showToast('Changes discarded');
  veUpdateChangeCount();
}


// --- Visual Editor: Device Switching ---
function veSetDevice(mode) {
  veState.currentDevice = mode;

  document.querySelectorAll('.ve-device-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-device') === mode);
  });

  const frame = document.getElementById('ve-device-frame');
  if (frame) {
    // Remove all ve-frame-* classes
    frame.className = frame.className.replace(/\bve-frame-\S+/g, '').trim();
    if (mode !== 'desktop') {
      frame.classList.add('ve-frame-' + mode);
    }
  }

  const chromeUrl = document.getElementById('ve-chrome-url');
  if (chromeUrl) {
    chromeUrl.style.display = mode === 'mobile' ? 'none' : '';
  }
}


// --- Visual Editor: Divider Drag ---
function initDividerDrag() {
  const divider = document.getElementById('ve-divider');
  const panel = document.querySelector('.ve-controls-panel');
  if (!divider || !panel) return;

  let isDragging = false;
  let startX = 0;
  let startWidth = 0;

  function onPointerDown(e) {
    isDragging = true;
    startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    startWidth = panel.offsetWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const delta = startX - clientX; // Panel is on the left, so invert
    let newWidth = startWidth + delta;
    newWidth = Math.max(250, Math.min(600, newWidth));
    panel.style.width = newWidth + 'px';
    veState.panelWidth = newWidth;
  }

  function onPointerUp() {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  // Mouse events
  divider.addEventListener('mousedown', onPointerDown);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerUp);

  // Touch events
  divider.addEventListener('touchstart', onPointerDown, { passive: false });
  document.addEventListener('touchmove', onPointerMove, { passive: false });
  document.addEventListener('touchend', onPointerUp);
}


// --- Visual Editor: Change Count Badge ---
function veUpdateChangeCount() {
  const count = Object.keys(veState.pendingChanges).length;
  const badge = document.getElementById('ve-change-count');
  if (!badge) return;

  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'inline-flex';
  } else {
    badge.textContent = '0';
    badge.style.display = 'none';
  }
}


// --- Visual Editor: Data Helpers ---
function veGetFieldValue(field) {
  // First try reading from Supabase data objects
  if (field.dataPath) {
    const parts = field.dataPath.split('.');
    let obj = data;
    for (const part of parts) {
      if (obj == null) return '';
      obj = obj[part];
    }
    if (obj != null) return obj;
  }

  // Fallback: try reading from iframe DOM
  const iframe = document.getElementById('ve-iframe');
  if (iframe && iframe.contentDocument) {
    try {
      let el = null;
      if (field.selector) {
        el = iframe.contentDocument.querySelector(field.selector);
      } else if (field.selectorIndex) {
        const parents = iframe.contentDocument.querySelectorAll(field.selectorIndex.parent);
        if (parents[field.selectorIndex.index]) {
          el = parents[field.selectorIndex.index].querySelector(field.selectorIndex.child);
        }
      }
      if (el && field.attr) {
        return el[field.attr] || '';
      }
    } catch (err) {
      // Cross-origin — skip
    }
  }

  return '';
}

function veSetDataByPath(path, value) {
  const parts = path.split('.');
  let obj = data;
  for (let i = 0; i < parts.length - 1; i++) {
    if (obj[parts[i]] == null) obj[parts[i]] = {};
    obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
}


/* ---- ADMIN MOBILE POLISH LOGIC ---- */

// 1. Offline Queue & Network Listeners
function processOfflineQueue() {
  const queueStr = localStorage.getItem('offlineQueue');
  if (!queueStr) return;
  const queue = JSON.parse(queueStr);
  if (queue.length === 0) return;
  
  console.log('Processing offline queue:', queue.length, 'items');
  // Re-save all queued keys
  queue.forEach(item => {
    // data[item.key] is already updated in memory, but just trigger a save
    _saveDataOriginal(item.key, 'Admin: Synced offline changes for ' + item.key);
  });
  localStorage.removeItem('offlineQueue');
}

window.addEventListener('online', () => {
  const banner = document.getElementById('offline-banner');
  if (banner) banner.style.display = 'none';
  processOfflineQueue();
});

window.addEventListener('offline', () => {
  const banner = document.getElementById('offline-banner');
  if (banner) banner.style.display = 'block';
});

// Wrapper for saveData to handle offline
const _saveDataOriginal = window.saveData;
window.saveData = async function(key, logMsg = null) {
  if (!navigator.onLine) {
    const banner = document.getElementById('offline-banner');
    if (banner) banner.style.display = 'block';
    
    let queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    // Filter out existing saves for this key to avoid duplicates
    queue = queue.filter(q => q.key !== key);
    queue.push({ key: key, timestamp: new Date().toISOString() });
    localStorage.setItem('offlineQueue', JSON.stringify(queue));
    
    console.warn('Offline mode: Queued save for', key);
    if (logMsg) logActivity(logMsg + ' (Queued offline)');
    return;
  }
  return _saveDataOriginal(key, logMsg);
};


// 2. Dark/Light Theme Toggle
function initAdminTheme() {
  const theme = localStorage.getItem('admin_theme') || 'dark';
  if (theme === 'light') {
    document.body.classList.add('admin-light');
  }
  
  const toggleBtn = document.getElementById('admin-theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('admin-light');
      const newTheme = document.body.classList.contains('admin-light') ? 'light' : 'dark';
      localStorage.setItem('admin_theme', newTheme);
    });
  }
}

// 3. Dashboard Quick Stats
function updateDashboardStats() {
  if (!data) return;
  
  const statProj = document.getElementById('stat-projects');
  const statMsgs = document.getElementById('stat-messages');
  const statSales = document.getElementById('stat-sales');
  
  if (statProj && data.projects) statProj.textContent = data.projects.length;
  if (statMsgs && data.messages) statMsgs.textContent = data.messages.filter(m => !m.read).length;
  if (statSales && data.template) statSales.textContent = data.template.salesCount || 0;
}

// Hook into loadData completion
const oldLoadDataEnd = loadData; // just reference if we needed it, but we can just use setTimeout for simplicity
function _runPostLoadHooks() {
  updateDashboardStats();
  
  // Set PIN input value
  const pinInput = document.getElementById('set-admin-pin');
  if (pinInput && data.settings && data.settings.admin_pin) {
    pinInput.value = data.settings.admin_pin;
  }
}
setTimeout(_runPostLoadHooks, 3000);


// 4. Visual Editor Mobile Tabs
document.querySelectorAll('.ve-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ve-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const section = document.getElementById('section-visual-editor');
    if (btn.dataset.tab === 'preview') {
      section.classList.add('mobile-preview-active');
    } else {
      section.classList.remove('mobile-preview-active');
    }
  });
});

// 5. FAB Toggle
const fabMain = document.getElementById('fab-main');
const fabMenu = document.getElementById('fab-menu');
if (fabMain && fabMenu) {
  fabMain.addEventListener('click', () => {
    fabMain.classList.toggle('open');
    fabMenu.classList.toggle('open');
  });
}

// 6. Bottom Sheet Pull-to-Dismiss
const slidePanel = document.getElementById('ve-project-panel');
let sheetStartY = 0;
let sheetCurrentY = 0;
let isDraggingSheet = false;

if (slidePanel) {
  const header = slidePanel.querySelector('.ve-panel-header');
  if (header) {
    header.addEventListener('touchstart', e => {
      if (window.innerWidth > 768) return;
      sheetStartY = e.touches[0].clientY;
      isDraggingSheet = true;
      slidePanel.style.transition = 'none';
    });
    
    header.addEventListener('touchmove', e => {
      if (!isDraggingSheet) return;
      sheetCurrentY = e.touches[0].clientY;
      const diff = sheetCurrentY - sheetStartY;
      if (diff > 0) {
        slidePanel.style.transform = `translateY(${diff}px)`;
      }
    });
    
    header.addEventListener('touchend', e => {
      if (!isDraggingSheet) return;
      isDraggingSheet = false;
      slidePanel.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1)';
      
      const diff = sheetCurrentY - sheetStartY;
      if (diff > 150) {
        // Dismiss
        veCloseProject();
      } else {
        // Snap back
        slidePanel.style.transform = '';
      }
    });
  }
}

// Override veCloseProject to clear transform
const oldVeClose = window.veCloseProject;
window.veCloseProject = function() {
  if (oldVeClose) oldVeClose();
  if (slidePanel) slidePanel.style.transform = '';
};


// 7. PIN Lock Logic
let idleTimer;
let currentPinEntry = '';
const PIN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function resetIdleTimer() {
  clearTimeout(idleTimer);
  // Don't start timer if we don't have a PIN set
  if (!data || !data.settings || !data.settings.admin_pin) return;
  if (document.getElementById('pin-lock-overlay').style.display === 'flex') return;
  
  idleTimer = setTimeout(() => {
    showPinLock();
  }, PIN_TIMEOUT_MS);
}

function showPinLock() {
  const overlay = document.getElementById('pin-lock-overlay');
  if (overlay) overlay.style.display = 'flex';
  currentPinEntry = '';
  updatePinDots();
}

function unlockPin() {
  const overlay = document.getElementById('pin-lock-overlay');
  if (overlay) overlay.style.display = 'none';
  currentPinEntry = '';
  updatePinDots();
  resetIdleTimer();
}

function updatePinDots() {
  const dots = document.querySelectorAll('.pin-dot');
  dots.forEach((dot, i) => {
    dot.classList.remove('filled', 'error');
    if (i < currentPinEntry.length) dot.classList.add('filled');
  });
}

function handlePinKey(key) {
  if (key === 'back') {
    currentPinEntry = currentPinEntry.slice(0, -1);
    updatePinDots();
    return;
  }
  
  if (currentPinEntry.length < 4) {
    currentPinEntry += key;
    updatePinDots();
    
    if (currentPinEntry.length === 4) {
      setTimeout(() => {
        if (data && data.settings && currentPinEntry === data.settings.admin_pin) {
          unlockPin();
        } else {
          // Error shake
          document.querySelectorAll('.pin-dot').forEach(d => d.classList.add('error'));
          setTimeout(() => {
            currentPinEntry = '';
            updatePinDots();
          }, 500);
        }
      }, 200);
    }
  }
}

document.querySelectorAll('.pin-key').forEach(btn => {
  btn.addEventListener('click', () => {
    handlePinKey(btn.dataset.key);
  });
});

// Setup idle events
['mousemove', 'touchstart', 'keydown', 'click'].forEach(evt => {
  document.addEventListener(evt, resetIdleTimer);
});

// Update setting save hook for PIN
const oldSaveSettings = window.saveSettings;
window.saveSettings = function() {
  const pinInput = document.getElementById('set-admin-pin');
  if (pinInput && pinInput.value) {
    data.settings.admin_pin = pinInput.value;
  }
  if (oldSaveSettings) oldSaveSettings();
};


// 8. Pull-to-Refresh Logic
function initPullToRefresh(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  let ptrStartY = 0;
  let ptrCurrentY = 0;
  let isPtrDragging = false;
  const loader = document.getElementById('ptr-loader');
  
  container.addEventListener('touchstart', e => {
    if (container.scrollTop === 0) {
      ptrStartY = e.touches[0].clientY;
      isPtrDragging = true;
    }
  }, {passive: true});
  
  container.addEventListener('touchmove', e => {
    if (!isPtrDragging) return;
    ptrCurrentY = e.touches[0].clientY;
    const diff = ptrCurrentY - ptrStartY;
    
    if (diff > 0 && container.scrollTop === 0) {
      if (diff > 120) loader.classList.add('visible');
      else loader.classList.remove('visible');
    }
  }, {passive: true});
  
  container.addEventListener('touchend', e => {
    if (!isPtrDragging) return;
    isPtrDragging = false;
    
    const diff = ptrCurrentY - ptrStartY;
    if (diff > 120 && container.scrollTop === 0) {
      loader.querySelector('i').classList.add('spin');
      // Trigger reload
      loadData().then(() => {
        setTimeout(() => {
          loader.classList.remove('visible');
          loader.querySelector('i').classList.remove('spin');
          updateDashboardStats(); // refresh stats just in case
        }, 500);
      });
    } else {
      loader.classList.remove('visible');
    }
  });
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initAdminTheme();
  setTimeout(() => {
    initPullToRefresh('projects-list');
    initPullToRefresh('messages-cards-container');
    resetIdleTimer();
    processOfflineQueue();
  }, 1000);
});

// End of Admin v2.0



// --- Visual Editor Projects ---
function veRenderProjectsList() {
  const accordion = document.getElementById('ve-accordion');
  if (!accordion) return;
  
  let html = `
    <div style="padding: 10px 20px;">
      <button class="btn-outline w-full" style="border-style: dashed; padding: 12px; margin-bottom: 16px;" onclick="veOpenProjectEditor()">
        <i data-lucide="plus"></i> Add New Project
      </button>
      <div id="ve-sortable-projects" style="min-height: 200px;">
  `;
  
  // Sort projects by priority
  const sortedProjects = [...data.projects].sort((a, b) => (a.priority || 5) - (b.priority || 5));
  
  sortedProjects.forEach(proj => {
    let gradStyle = '';
    if (proj.gradient) {
       gradStyle = `background: linear-gradient(135deg, ${proj.gradient.replace('-neon', 'rgba(57,255,20,0.2)').replace('-teal', 'rgba(20,255,200,0.2)').replace('-purple', 'rgba(160,32,240,0.2)').replace('-red', 'rgba(255,68,68,0.2)').replace('-blue', 'rgba(0,102,255,0.2)').replace('-orange', 'rgba(255,136,0,0.2)')}, #000)`;
    }
    const imgHtml = proj.image ? `<img src="${proj.image}" class="ve-project-thumb" />` : `<div class="ve-project-thumb" style="${gradStyle}"></div>`;
    const statusColor = proj.status === 'Live' ? 'var(--neon-green)' : (proj.status === 'Draft' ? 'var(--text-dim)' : 'var(--yellow-accent)');
    
    html += `
      <div class="ve-project-card" data-id="${proj.id}">
        <div class="ve-project-drag-handle"><i data-lucide="grip-vertical"></i></div>
        ${imgHtml}
        <div class="ve-project-info">
          <div class="ve-project-name">${proj.name}</div>
          <div class="ve-project-meta">
            <span class="badge" style="border-color: ${statusColor}; color: ${statusColor}">${proj.status || 'Draft'}</span>
            <span style="color: var(--text-dim)">${proj.category || 'N/A'}</span>
          </div>
        </div>
        <div class="ve-project-actions">
          <button class="btn-outline btn-sm" style="padding:4px" title="Edit" onclick="veOpenProjectEditor('${proj.id}')"><i data-lucide="edit-2" style="width:14px;height:14px"></i></button>
          <button class="btn-outline btn-sm" style="padding:4px; color:var(--red-accent); border-color:rgba(255,68,68,0.3)" title="Delete" onclick="veDeleteProject('${proj.id}')"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
        </div>
      </div>
    `;
  });
  
  html += `</div></div>`;
  accordion.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
  
  // Initialize Sortable
  const sortableEl = document.getElementById('ve-sortable-projects');
  if (sortableEl && window.Sortable) {
    new Sortable(sortableEl, {
      handle: '.ve-project-drag-handle',
      animation: 150,
      onEnd: function() {
        // Update priorities based on DOM order
        const cards = sortableEl.querySelectorAll('.ve-project-card');
        cards.forEach((card, index) => {
          const id = card.getAttribute('data-id');
          const proj = data.projects.find(p => p.id === id);
          if (proj) proj.priority = index + 1;
        });
        saveData('projects', 'Reordered projects in Visual Editor').then(() => {
           const iframe = document.getElementById('ve-iframe');
           if (iframe) iframe.contentWindow.location.reload();
        });
      }
    });
  }
}

function veOpenProjectEditor(id = null) {
  const panel = document.getElementById('ve-project-panel');
  if (!panel) return;
  
  // Reset tabs
  document.querySelectorAll('.ve-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.ve-tab-btn[data-tab="content"]').classList.add('active');
  document.querySelectorAll('.ve-tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('ve-tab-content').classList.add('active');
  
  const form = document.getElementById('ve-project-form');
  form.reset();
  document.getElementById('ve-image-preview').style.display = 'none';
  document.querySelectorAll('.ve-grad-swatch').forEach(s => s.classList.remove('active'));
  
  // Populate Categories
  const catSelect = document.getElementById('ve-proj-category');
  catSelect.innerHTML = '';
  data.categories.forEach(c => {
    catSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
  });
  
  if (id) {
    document.getElementById('ve-project-panel-title').textContent = 'Edit Project';
    const proj = data.projects.find(p => p.id === id);
    if (proj) {
      document.getElementById('ve-proj-id').value = proj.id;
      document.getElementById('ve-proj-name').value = proj.name || '';
      document.getElementById('ve-proj-category').value = proj.category || '';
      document.getElementById('ve-proj-status').value = proj.status || 'Draft';
      document.getElementById('ve-proj-shortdesc').value = proj.shortDesc || '';
      document.getElementById('ve-proj-shortdesc-counter').textContent = (proj.shortDesc || '').length + '/150';
      
      if (proj.story) {
        document.getElementById('ve-proj-story-human').value = proj.story.human || '';
        document.getElementById('ve-proj-story-problem').value = proj.story.problem || '';
        document.getElementById('ve-proj-story-solution').value = proj.story.solution || '';
        document.getElementById('ve-proj-story-outcome').value = (proj.story.outcome || []).join('\n');
      }
      document.getElementById('ve-proj-quote').value = proj.pullQuote || '';
      document.getElementById('ve-proj-tools').value = (proj.tools || []).join(', ');
      
      if (proj.image) {
        document.getElementById('ve-proj-image-url').value = proj.image;
        document.getElementById('ve-image-preview').src = proj.image;
        document.getElementById('ve-image-preview').style.display = 'block';
      }
      if (proj.gradient) {
        const swatch = document.querySelector(`.ve-grad-swatch[data-grad="${proj.gradient}"]`);
        if (swatch) swatch.classList.add('active');
      }
      
      document.getElementById('ve-proj-client').value = proj.client || '';
      document.getElementById('ve-proj-country').value = proj.country || '';
      document.getElementById('ve-proj-flag').value = proj.flag || '';
      document.getElementById('ve-proj-url').value = proj.url || '';
      document.getElementById('ve-proj-casestudy').value = proj.caseStudy || '';
      document.getElementById('ve-proj-featured').checked = !!proj.featured;
      document.getElementById('ve-proj-priority').value = proj.priority || 5;
    }
  } else {
    document.getElementById('ve-project-panel-title').textContent = 'New Project';
    document.getElementById('ve-proj-id').value = '';
    document.getElementById('ve-proj-shortdesc-counter').textContent = '0/150';
  }
  
  panel.classList.add('open');
}

function veCloseProjectEditor() {
  const panel = document.getElementById('ve-project-panel');
  if (panel) panel.classList.remove('open');
}

function initVeProjectPanel() {
  const closeBtn = document.getElementById('ve-project-close-btn');
  const cancelBtn = document.getElementById('ve-project-cancel-btn');
  const saveBtn = document.getElementById('ve-project-save-btn');
  const tabs = document.querySelectorAll('.ve-tab-btn');
  
  if (closeBtn) closeBtn.addEventListener('click', veCloseProjectEditor);
  if (cancelBtn) cancelBtn.addEventListener('click', veCloseProjectEditor);
  
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.ve-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.ve-tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab') === 'content' ? 've-tab-content' : 've-tab-' + tab.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });
  
  // Character counter
  const shortDesc = document.getElementById('ve-proj-shortdesc');
  if (shortDesc) {
    shortDesc.addEventListener('input', (e) => {
      document.getElementById('ve-proj-shortdesc-counter').textContent = e.target.value.length + '/150';
    });
  }
  
  // Gradient selection
  document.querySelectorAll('.ve-grad-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.ve-grad-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
    });
  });
  
  // Image URL Preview
  const imgUrl = document.getElementById('ve-proj-image-url');
  if (imgUrl) {
    imgUrl.addEventListener('input', (e) => {
      const p = document.getElementById('ve-image-preview');
      if (e.target.value) {
        p.src = e.target.value;
        p.style.display = 'block';
      } else {
        p.style.display = 'none';
      }
    });
  }
  
  // Image Upload
  const uploadZone = document.getElementById('ve-upload-zone');
  const fileInput = document.getElementById('ve-file-input');
  if (uploadZone && fileInput) {
    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', e => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        veUploadImage(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        veUploadImage(e.target.files[0]);
      }
    });
  }
  
  if (saveBtn) saveBtn.addEventListener('click', veSaveProject);
}

async function veUploadImage(file) {
  showToast('Uploading image...');
  const ext = file.name.split('.').pop();
  const fileName = Date.now() + '.' + ext;
  
  try {
    const { data, error } = await window.supabaseClient.storage
      .from('portfolio')
      .upload('projects/' + fileName, file);
      
    if (error) throw error;
    
    const { data: urlData } = window.supabaseClient.storage
      .from('portfolio')
      .getPublicUrl('projects/' + fileName);
      
    const url = urlData.publicUrl;
    document.getElementById('ve-proj-image-url').value = url;
    document.getElementById('ve-image-preview').src = url;
    document.getElementById('ve-image-preview').style.display = 'block';
    showToast('Image uploaded successfully!', 'success');
  } catch (err) {
    console.error('Upload error:', err);
    showToast('Upload failed: ' + err.message, 'error');
  }
}

async function veSaveProject() {
  const saveBtn = document.getElementById('ve-project-save-btn');
  saveBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> Saving...';
  
  const idStr = document.getElementById('ve-proj-id').value;
  const isNew = !idStr;
  const id = isNew ? 'proj-' + Date.now() : idStr;
  
  const name = document.getElementById('ve-proj-name').value;
  if (!name) {
    showToast('Project Name is required', 'error');
    saveBtn.innerHTML = 'Save Project';
    return;
  }
  
  let gradient = '';
  const activeGrad = document.querySelector('.ve-grad-swatch.active');
  if (activeGrad) gradient = activeGrad.getAttribute('data-grad');
  
  const outcomeText = document.getElementById('ve-proj-story-outcome').value;
  const outcomeArr = outcomeText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
  
  const toolsText = document.getElementById('ve-proj-tools').value;
  const toolsArr = toolsText.split(',').map(s => s.trim()).filter(s => s.length > 0);
  
  const projData = {
    id: id,
    name: name,
    category: document.getElementById('ve-proj-category').value,
    status: document.getElementById('ve-proj-status').value,
    shortDesc: document.getElementById('ve-proj-shortdesc').value,
    story: {
      human: document.getElementById('ve-proj-story-human').value,
      problem: document.getElementById('ve-proj-story-problem').value,
      solution: document.getElementById('ve-proj-story-solution').value,
      outcome: outcomeArr
    },
    pullQuote: document.getElementById('ve-proj-quote').value,
    tools: toolsArr,
    image: document.getElementById('ve-proj-image-url').value,
    gradient: gradient,
    client: document.getElementById('ve-proj-client').value,
    country: document.getElementById('ve-proj-country').value,
    flag: document.getElementById('ve-proj-flag').value,
    url: document.getElementById('ve-proj-url').value,
    caseStudy: document.getElementById('ve-proj-casestudy').value,
    featured: document.getElementById('ve-proj-featured').checked,
    priority: parseInt(document.getElementById('ve-proj-priority').value, 10) || 5,
    lastUpdated: new Date().toISOString()
  };
  
  if (isNew) {
    data.projects.push(projData);
  } else {
    const idx = data.projects.findIndex(p => p.id === id);
    if (idx !== -1) data.projects[idx] = projData;
  }
  
  await saveData('projects', `Visual Editor: Saved project ${name}`);
  veCloseProjectEditor();
  veRenderProjectsList();
  
  // Reload iframe
  const iframe = document.getElementById('ve-iframe');
  if (iframe) iframe.contentWindow.location.reload();
  
  saveBtn.innerHTML = 'Save Project';
  showToast('Project saved!', 'success');
}

async function veDeleteProject(id) {
  if (!confirm('Are you sure you want to delete this project?')) return;
  
  const idx = data.projects.findIndex(p => p.id === id);
  if (idx !== -1) {
    const name = data.projects[idx].name;
    data.projects.splice(idx, 1);
    await window.supabaseClient.from('projects').delete().eq('id', id);
    await saveData('projects', `Visual Editor: Deleted project ${name}`);
    veRenderProjectsList();
    
    const iframe = document.getElementById('ve-iframe');
    if (iframe) iframe.contentWindow.location.reload();
    
    showToast('Project deleted', 'success');
  }
}

// Ensure init is called
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initVeProjectPanel, 1000); // Give time for elements to load
});



function veGetDefaultNav() {
  return {
    links: [
      { label: 'Home', url: 'index.html', visible: true },
      { label: 'Work', url: 'work.html', visible: true },
      { label: 'About', url: 'about.html', visible: true },
      { label: 'Services', url: 'services.html', visible: true }
    ],
    cta: {
      label: "Let's Talk",
      url: 'contact.html',
      style: 'neon'
    },
    footer: {
      tagline: 'System Designer & Builder',
      copyright: '© 2026 Okezie. All rights reserved.',
      builtWith: 'Built with coffee & neon.',
      social: [
        { platform: 'LinkedIn', url: '#', visible: true },
        { platform: 'Twitter', url: '#', visible: true },
        { platform: 'GitHub', url: '#', visible: true },
        { platform: 'Dribbble', url: '#', visible: false }
      ]
    },
    pages: [
      { id: 'home', name: 'Home', slug: '/', title: 'Home | Portfolio', desc: '', image: '', published: true, comingSoon: false },
      { id: 'work', name: 'Work', slug: '/work', title: 'Work | Portfolio', desc: '', image: '', published: true, comingSoon: false },
      { id: 'about', name: 'About', slug: '/about', title: 'About | Portfolio', desc: '', image: '', published: true, comingSoon: false },
      { id: 'services', name: 'Services', slug: '/services', title: 'Services | Portfolio', desc: '', image: '', published: true, comingSoon: false },
      { id: 'contact', name: 'Contact', slug: '/contact', title: 'Contact | Portfolio', desc: '', image: '', published: true, comingSoon: false }
    ]
  };
}

function veRenderNavigationEditor() {
  const accordion = document.getElementById('ve-accordion');
  if (!accordion) return;
  
  const title = document.getElementById('ve-controls-title');
  if (title) title.textContent = 'Navigation & Pages';
  
  if (!data.navigation) data.navigation = veGetDefaultNav();
  const nav = data.navigation;
  
  let html = `<div style="padding:0; display:flex; flex-direction:column; gap:20px;">`;
  
  // NAV LINKS
  html += `
    <div class="ve-accordion-item open">
      <div class="ve-accordion-header">
        <span class="ve-accordion-icon">🔗</span>
        <span class="ve-accordion-label">Header Navigation</span>
      </div>
      <div class="ve-accordion-body" style="display:block">
        <div id="ve-nav-links-list">
          ${nav.links.map((link, i) => `
            <div class="ve-nav-row" data-idx="${i}" style="display:flex; align-items:center; gap:8px; margin-bottom:8px; background:rgba(255,255,255,0.02); padding:8px; border:1px solid var(--border-light); border-radius:4px;">
              <div class="ve-nav-drag-handle" style="cursor:grab; color:var(--text-dim); padding:4px"><i data-lucide="grip-vertical"></i></div>
              <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                <input type="text" class="ve-field-input" value="${link.label}" placeholder="Label" onchange="veUpdateNavLink(${i}, 'label', this.value)">
                <input type="text" class="ve-field-input" value="${link.url}" placeholder="URL" onchange="veUpdateNavLink(${i}, 'url', this.value)">
              </div>
              <div>
                <label class="switch"><input type="checkbox" ${link.visible ? 'checked' : ''} onchange="veUpdateNavLink(${i}, 'visible', this.checked)"><span class="slider"></span></label>
              </div>
              <button class="btn-outline btn-sm" style="padding:4px; color:var(--red-accent); border:none" onclick="veRemoveNavLink(${i})"><i data-lucide="trash-2"></i></button>
            </div>
          `).join('')}
        </div>
        <button class="btn-outline w-full" style="border-style:dashed; padding:8px; margin-top:8px;" onclick="veAddNavLink()"><i data-lucide="plus"></i> Add Link</button>
        
        <div style="margin-top:20px; padding-top:12px; border-top:1px dashed var(--border-light);">
          <label class="ve-field-label" style="color:var(--neon-green)">CTA Button</label>
          <div class="ve-field">
            <label class="ve-field-label">Label</label>
            <input type="text" class="ve-field-input" value="${nav.cta.label}" onchange="veUpdateNavCTA('label', this.value)">
          </div>
          <div class="ve-field">
            <label class="ve-field-label">URL</label>
            <input type="text" class="ve-field-input" value="${nav.cta.url}" onchange="veUpdateNavCTA('url', this.value)">
          </div>
          <div class="ve-field">
            <label class="ve-field-label">Style</label>
            <select class="ve-field-input" onchange="veUpdateNavCTA('style', this.value)">
              <option value="neon" ${nav.cta.style === 'neon' ? 'selected' : ''}>Filled (Neon)</option>
              <option value="ghost" ${nav.cta.style === 'ghost' ? 'selected' : ''}>Ghost / Outline</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // FOOTER
  html += `
    <div class="ve-accordion-item open">
      <div class="ve-accordion-header">
        <span class="ve-accordion-icon">🏁</span>
        <span class="ve-accordion-label">Footer</span>
      </div>
      <div class="ve-accordion-body" style="display:block">
        <div class="ve-field"><label class="ve-field-label">Tagline</label><input type="text" class="ve-field-input" value="${nav.footer.tagline || ''}" onchange="veUpdateFooter('tagline', this.value)"></div>
        <div class="ve-field"><label class="ve-field-label">Copyright Text</label><input type="text" class="ve-field-input" value="${nav.footer.copyright || ''}" onchange="veUpdateFooter('copyright', this.value)"></div>
        <div class="ve-field"><label class="ve-field-label">Built With (Easter Egg)</label><input type="text" class="ve-field-input" value="${nav.footer.builtWith || ''}" onchange="veUpdateFooter('builtWith', this.value)"></div>
        
        <label class="ve-field-label" style="margin-top:16px; color:var(--neon-green)">Social Links</label>
        ${nav.footer.social.map((soc, i) => `
          <div class="ve-field" style="margin-bottom:8px; display:flex; gap:8px; align-items:center;">
            <div style="width:70px; font-size:0.8rem; color:var(--text-muted)">${soc.platform}</div>
            <input type="text" class="ve-field-input" style="flex:1" value="${soc.url}" placeholder="URL" onchange="veUpdateSocialLink(${i}, 'url', this.value)">
            <label class="switch"><input type="checkbox" ${soc.visible ? 'checked' : ''} onchange="veUpdateSocialLink(${i}, 'visible', this.checked)"><span class="slider"></span></label>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  // PAGES (SEO / Coming Soon)
  html += `
    <div class="ve-accordion-item open">
      <div class="ve-accordion-header">
        <span class="ve-accordion-icon">📄</span>
        <span class="ve-accordion-label">Pages & SEO</span>
      </div>
      <div class="ve-accordion-body" style="display:block">
        ${nav.pages.map((p, i) => `
          <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-light); border-radius:6px; padding:12px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <strong style="color:var(--text-main)">${p.name}</strong>
              <div style="display:flex; gap:12px; align-items:center;">
                <label style="font-size:0.7rem; color:var(--yellow-accent); display:flex; align-items:center; gap:4px;">
                  Coming Soon <label class="switch"><input type="checkbox" ${p.comingSoon ? 'checked' : ''} onchange="veUpdatePage(${i}, 'comingSoon', this.checked)"><span class="slider"></span></label>
                </label>
              </div>
            </div>
            
            <div class="ve-field"><label class="ve-field-label">URL Slug</label><input type="text" class="ve-field-input" value="${p.slug}" onchange="veUpdatePage(${i}, 'slug', this.value)"></div>
            <div class="ve-field"><label class="ve-field-label">SEO Title</label><input type="text" class="ve-field-input" value="${p.title}" onchange="veUpdatePage(${i}, 'title', this.value)"></div>
            <div class="ve-field">
              <label class="ve-field-label">SEO Description</label>
              <textarea class="ve-field-textarea" style="min-height:50px;" maxlength="160" onchange="veUpdatePage(${i}, 'desc', this.value)">${p.desc || ''}</textarea>
            </div>
            <div class="ve-field" style="margin-bottom:0;"><label class="ve-field-label">OG Image URL</label><input type="text" class="ve-field-input" value="${p.image || ''}" onchange="veUpdatePage(${i}, 'image', this.value)"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  html += `</div>`;
  accordion.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
  
  // Sortable Nav Links
  const linksList = document.getElementById('ve-nav-links-list');
  if (linksList && window.Sortable) {
    new Sortable(linksList, {
      handle: '.ve-nav-drag-handle',
      animation: 150,
      onEnd: function(evt) {
        const itemEl = evt.item;
        const newIdx = evt.newIndex;
        const oldIdx = evt.oldIndex;
        
        const moved = data.navigation.links.splice(oldIdx, 1)[0];
        data.navigation.links.splice(newIdx, 0, moved);
        
        veTriggerNavSave();
        veRenderNavigationEditor(); // re-render to update index attributes
      }
    });
  }
}

// Updaters
function veTriggerNavSave() {
  clearTimeout(veSaveTimeout);
  veSaveTimeout = setTimeout(() => {
    saveData('navigation', 'Visual Editor: Updated navigation config').then(() => {
      const iframe = document.getElementById('ve-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    });
  }, 500);
}

function veUpdateNavLink(idx, key, val) {
  data.navigation.links[idx][key] = val;
  veTriggerNavSave();
}
function veAddNavLink() {
  data.navigation.links.push({ label: 'New Link', url: '#', visible: true });
  veRenderNavigationEditor();
  veTriggerNavSave();
}
function veRemoveNavLink(idx) {
  data.navigation.links.splice(idx, 1);
  veRenderNavigationEditor();
  veTriggerNavSave();
}
function veUpdateNavCTA(key, val) {
  data.navigation.cta[key] = val;
  veTriggerNavSave();
}
function veUpdateFooter(key, val) {
  data.navigation.footer[key] = val;
  veTriggerNavSave();
}
function veUpdateSocialLink(idx, key, val) {
  data.navigation.footer.social[idx][key] = val;
  veTriggerNavSave();
}
function veUpdatePage(idx, key, val) {
  data.navigation.pages[idx][key] = val;
  veTriggerNavSave();
}



// ---- TEMPLATE MANAGER LOGIC ----

// Override saveTemplate
window.saveTemplate = function() {
  const t = {
    visible: document.getElementById('tpl-visible').checked,
    name: document.getElementById('tpl-name').value,
    desc: document.getElementById('tpl-desc').value,
    price: document.getElementById('tpl-price').value,
    url: document.getElementById('tpl-url').value,
    btnText: document.getElementById('tpl-btn-text').value,
    included: window.tplIncludedItems || [],
    salesCount: document.getElementById('tpl-count').value,
    notes: document.getElementById('tpl-notes').value
  };
  data.template = t;
  saveData('template', 'Admin: Updated template product details');
  updateTplPreview();
};

window.tplIncludedItems = [];

window.addTplIncluded = function() {
  const input = document.getElementById('tpl-included-add-input');
  if (input && input.value.trim() !== '') {
    window.tplIncludedItems.push(input.value.trim());
    input.value = '';
    renderTplIncluded();
    updateTplPreview();
  }
};

window.removeTplIncluded = function(idx) {
  window.tplIncludedItems.splice(idx, 1);
  renderTplIncluded();
  updateTplPreview();
};

function renderTplIncluded() {
  const list = document.getElementById('tpl-included-list');
  if (!list) return;
  list.innerHTML = window.tplIncludedItems.map((item, idx) => `
    <div class="ve-list-item">
      <span class="ve-list-item-text">${item}</span>
      <button class="ve-list-remove" onclick="removeTplIncluded(${idx})"><i data-lucide="x" style="width:14px;height:14px"></i></button>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

function updateTplPreview() {
  const name = document.getElementById('tpl-name').value || 'Template Name';
  const desc = document.getElementById('tpl-desc').value || 'Description goes here';
  const price = document.getElementById('tpl-price').value || '49';
  const btn = document.getElementById('tpl-btn-text').value || 'Get Template';
  
  document.getElementById('tpl-preview-name').textContent = name;
  document.getElementById('tpl-preview-desc').textContent = desc;
  document.getElementById('tpl-preview-price').textContent = '$' + price;
  document.getElementById('tpl-preview-btn').textContent = btn;
  
  const feats = document.getElementById('tpl-preview-features');
  feats.innerHTML = window.tplIncludedItems.map(f => `<li>${f}</li>`).join('');
}

// Hook into existing data load
const oldPopulateTemplate = window.populateTemplateForm || function(){};
function populateTemplateFormLocal() {
  if (data.template) {
    document.getElementById('tpl-visible').checked = !!data.template.visible;
    document.getElementById('tpl-name').value = data.template.name || '';
    document.getElementById('tpl-desc').value = data.template.desc || '';
    document.getElementById('tpl-price').value = data.template.price || '';
    document.getElementById('tpl-url').value = data.template.url || '';
    document.getElementById('tpl-btn-text').value = data.template.btnText || '';
    document.getElementById('tpl-count').value = data.template.salesCount || 0;
    
    // We don't have tpl-notes in the HTML anymore, wait we do.
    const tplNotes = document.getElementById('tpl-notes');
    if (tplNotes) tplNotes.value = data.template.notes || '';
    
    if (Array.isArray(data.template.included)) {
       window.tplIncludedItems = data.template.included;
    } else if (typeof data.template.included === 'string') {
       window.tplIncludedItems = data.template.included.split('\n').filter(x => x.trim());
    }
    renderTplIncluded();
    updateTplPreview();
  }
}

// ---- CLONING WIZARD LOGIC ----

window.generateClonePackage = async function() {
  const btn = document.getElementById('btn-generate-clone');
  const status = document.getElementById('clone-status');
  
  const clientName = document.getElementById('clone-client-name').value || 'New Client';
  const brandName = document.getElementById('clone-client-brand').value || 'Client Brand';
  const tagline = document.getElementById('clone-client-tagline').value || 'System Designer & Builder';
  const primaryColor = document.getElementById('clone-primary-color').value || '#33ff14';
  const bgColor = document.getElementById('clone-bg-color').value || '#000000';
  const clearProjects = document.getElementById('clone-clear-projects').checked;
  
  btn.disabled = true;
  status.style.display = 'block';
  status.textContent = 'Fetching files...';
  
  try {
    const zip = new JSZip();
    
    // Files to fetch from current origin
    const filesToFetch = [
      'index.html', 'work.html', 'about.html', 'services.html', 'contact.html',
      'style.css', 'script.js', 'nav.js'
    ];
    
    for (const file of filesToFetch) {
      status.textContent = `Fetching ${file}...`;
      const res = await fetch('/' + file);
      if (!res.ok) continue;
      let content = await res.text();
      
      // Basic Replacements
      content = content.replace(/Okezie Ferdinand/g, clientName);
      content = content.replace(/Okezie/g, clientName.split(' ')[0]);
      content = content.replace(/JX Design &amp; Dev/g, brandName);
      content = content.replace(/JX Design & Dev/g, brandName);
      
      // Specifically in style.css or JS, we might want to override the primary color
      if (file === 'style.css') {
        content = content.replace(/--neon:\s*#[0-9a-fA-F]+/g, `--neon: ${primaryColor}`);
        content = content.replace(/--black:\s*#[0-9a-fA-F]+/g, `--black: ${bgColor}`);
      }
      
      zip.file(file, content);
    }
    
    // Fetch setting JSON directly
    status.textContent = 'Generating configurations...';
    let newSettings = JSON.parse(JSON.stringify(data)); // Deep clone current data
    if (clearProjects) {
       newSettings.projects = [];
    }
    
    // Override global styles
    if (!newSettings.global_styles) newSettings.global_styles = {};
    newSettings.global_styles.primary_color = primaryColor;
    newSettings.global_styles.bg_color = bgColor;
    
    // We could include a seed DB SQL
    const setupGuide = `# ${brandName} - Portfolio Setup Guide

Welcome to your new portfolio site!

1. Deploy the HTML/CSS/JS files to Vercel, Netlify, or your preferred host.
2. Set up a Supabase project and run the included schema.sql.
3. Import your settings and data into the site_settings table if you wish to prepopulate.
`;
    zip.file('Setup_Guide.txt', setupGuide);
    zip.file('supabase_schema.sql', '-- Add your Supabase schema here\n');
    
    status.textContent = 'Zipping package...';
    const blob = await zip.generateAsync({ type: 'blob' });
    
    status.textContent = 'Downloading...';
    saveAs(blob, `${brandName.replace(/\s+/g, '_')}_Portfolio.zip`);
    
    // Log history
    await logCloneHistory(clientName, brandName);
    
    status.textContent = 'Done!';
    setTimeout(() => { status.style.display = 'none'; btn.disabled = false; }, 3000);
    
  } catch (err) {
    console.error(err);
    status.textContent = 'Error: ' + err.message;
    btn.disabled = false;
  }
};

async function logCloneHistory(clientName, brandName) {
  try {
    const { error } = await supabaseClient
      .from('template_clones')
      .insert([{ client_name: clientName, client_brand: brandName }]);
    if (error) throw error;
    loadCloneHistory();
  } catch(e) {
    console.error('Failed to log clone history', e);
  }
}

async function loadCloneHistory() {
  try {
    const { data, error } = await supabaseClient
      .from('template_clones')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    const tbody = document.getElementById('clone-history-tbody');
    if (tbody) {
      tbody.innerHTML = data.map(row => `
        <tr style="border-bottom:1px solid var(--border-light);">
          <td style="padding:12px 8px; color:var(--text-dim);">${new Date(row.created_at).toLocaleDateString()}</td>
          <td style="padding:12px 8px;">${row.client_name}</td>
          <td style="padding:12px 8px;">${row.client_brand || ''}</td>
          <td style="padding:12px 8px; text-align:right;">
            <button class="btn-outline btn-sm" style="padding:4px 8px; color:var(--red-accent); border:none;" onclick="deleteCloneHistory('${row.id}')"><i data-lucide="trash-2" style="width:14px;height:14px"></i></button>
          </td>
        </tr>
      `).join('');
      if (window.lucide) lucide.createIcons();
    }
  } catch(e) {
    console.warn('Could not load clone history:', e);
  }
}

window.deleteCloneHistory = async function(id) {
  if(!confirm('Delete this clone record?')) return;
  await supabaseClient.from('template_clones').delete().match({ id });
  loadCloneHistory();
};

// Hook into initial data load to populate template logic
setTimeout(() => {
   if (typeof data !== 'undefined') populateTemplateFormLocal();
   if (typeof loadCloneHistory !== 'undefined') loadCloneHistory();
}, 2000); // Hacky delay to wait for data load, better to call explicitly at end of loadData

