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

  if (['projects', 'categories', 'settings', 'hero', 'about', 'template', 'services'].includes(key)) {
    try {
      if (['settings', 'hero', 'about', 'template'].includes(key)) {
        const dbSettings = { 
          id: 1, 
          ...data.settings,
          hero_content: data.hero,
          about_content: data.about,
          template_content: data.template
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
    settings: ['Site Settings', 'Global configuration']
  };

  const [title, breadcrumb] = titles[target] || [target, ''];
  document.getElementById('top-title').textContent = title;
  const bc = document.getElementById('top-breadcrumb');
  if (bc) bc.textContent = breadcrumb;

  // Toggle sections
  document.querySelectorAll('.admin-section').forEach(el => el.classList.remove('active'));
  const section = document.getElementById(`section-${target}`);
  if (section) section.classList.add('active');

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
    settings: renderSettingsForm
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

// End of Admin v2.0
