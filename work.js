/* ================================================================
   JX UNIVERSE — work.js v3.0
   The Vault - Supabase Fetching & Cinematic Modal (WOW #5)
   ================================================================ */

'use strict';

(function () {

  let allProjects = [];
  let activeFilter = 'all';
  let escListener = null;

  /* Page reveal */
  function revealPage () {
    const page = document.getElementById('page');
    if (!page) return;

    if (window.gsap) {
      gsap.to(page, { opacity: 1, duration: 0.7, ease: 'power2.out' });
      const tl = gsap.timeline({ delay: 0.1 });
      tl.to('#wh-label', { opacity: 1, duration: 0.6 })
        .to('#wh-title',  { y: 0, opacity: 1, duration: 1, ease: 'expo.out' }, '-=0.3')
        .to('#wh-sub',    { opacity: 1, duration: 0.7 }, '-=0.5');
    } else {
      page.style.opacity = '1';
    }
  }

  /* Load projects from Supabase */
  async function loadProjects () {
    const grid = document.getElementById('work-grid');
    if (!grid) return;
    if (window.initSupabase) await window.initSupabase();
    if (typeof supabase === 'undefined' || !supabase.from) {
      renderEmpty(grid, 'Database not configured.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('priority', { ascending: true });

      if (error || !data || data.length === 0) {
        renderEmpty(grid, 'No projects yet: add some in the admin panel.');
        return;
      }

      allProjects = data;

      /* Update count */
      const countEl = document.getElementById('wh-count');
      if (countEl) {
        countEl.textContent = String(data.length).padStart(2, '0');
      }

      renderGrid(data, true);
      bindFilters();

    } catch (err) {
      renderEmpty(grid, 'Could not connect to the vault.');
    }
  }

  function renderEmpty (grid, msg) {
    if (!grid) return;
    grid.innerHTML = `<div class="work-empty">${msg}</div>`;
  }

  function renderGrid (projects, isInitialLoad = false) {
    const grid = document.getElementById('work-grid');
    if (!grid) return;

    if (projects.length === 0) {
      grid.innerHTML = '<div class="work-empty">No projects in this category yet.</div>';
      return;
    }

    grid.innerHTML = projects.map(p => renderCard(p)).join('');

    /* Animate cards */
    if (window.gsap) {
      if (isInitialLoad && window.ScrollTrigger) {
        const existingTrigger = ScrollTrigger.getById('work-grid-trigger');
        if (existingTrigger) existingTrigger.kill();

        gsap.fromTo('.work-card', { opacity: 0, y: 30 }, {
          opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07,
          scrollTrigger: { id: 'work-grid-trigger', trigger: grid, start: 'top 90%', once: true }
        });
      } else {
        gsap.fromTo('.work-card', { opacity: 0, y: 30 }, {
          opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07
        });
      }
    } else {
      document.querySelectorAll('.work-card').forEach(c => c.style.opacity = '1');
    }

    /* Click → modal */
    grid.querySelectorAll('.work-card').forEach((card, i) => {
      const p = projects[i];
      card.addEventListener('click', () => openModal(p));
      card.addEventListener('keydown', e => { if (e.key === 'Enter') openModal(p); });
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `View project: ${p.title}`);
    });
  }

  function renderCard (p) {
    const img   = p.image_url
      ? `<img src="${p.image_url}" alt="${p.title}" class="work-card-image" loading="lazy">`
      : `<div class="work-card-placeholder">${(p.title || 'JX').slice(0, 2).toUpperCase()}</div>`;
    const tools = (p.tools || []).slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('');

    return `
      <article class="work-card" data-category="${(p.category || '').toLowerCase()}" style="opacity:0">
        ${img}
        <div class="work-card-body">
          <div class="work-card-meta">
            <span class="work-card-category">${p.category || 'Project'}</span>
            <span class="work-card-year">${p.year || ''}</span>
          </div>
          <h3 class="work-card-title">${p.title}</h3>
          <p class="work-card-desc">${(p.description || '').slice(0, 110)}${(p.description || '').length > 110 ? '…' : ''}</p>
          <div class="work-card-tools">${tools}</div>
        </div>
        <span class="work-card-arrow" aria-hidden="true">↗</span>
      </article>
    `;
  }

  function bindFilters () {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.filter;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filtered = activeFilter === 'all'
          ? allProjects
          : allProjects.filter(p =>
              (p.category || '').toLowerCase().includes(activeFilter)
            );
        renderGrid(filtered);
      });
    });
  }

  /* ── Cinematic Modal (WOW #5) ── */
  function openModal (p) {
    document.getElementById('vault-modal-overlay')?.remove();

    const tools = (p.tools || []).map(t => `<span class="tag">${t}</span>`).join('');

    const roleMeta = p.project_role ? `<div style="display:flex;flex-direction:column;gap:var(--s-1);"><span style="font-family:var(--font-mono);font-size:var(--text-xs);letter-spacing:var(--track-widest);text-transform:uppercase;color:var(--green);">Role</span><span style="font-family:var(--font-body);font-size:var(--text-sm);color:var(--gray-2);">${p.project_role}</span></div>` : '';
    const timelineMeta = p.timeline ? `<div style="display:flex;flex-direction:column;gap:var(--s-1);"><span style="font-family:var(--font-mono);font-size:var(--text-xs);letter-spacing:var(--track-widest);text-transform:uppercase;color:var(--green);">Timeline</span><span style="font-family:var(--font-body);font-size:var(--text-sm);color:var(--gray-2);">${p.timeline}</span></div>` : '';
    const typeMeta = p.project_type ? `<div style="display:flex;flex-direction:column;gap:var(--s-1);"><span style="font-family:var(--font-mono);font-size:var(--text-xs);letter-spacing:var(--track-widest);text-transform:uppercase;color:var(--green);">Type</span><span style="font-family:var(--font-body);font-size:var(--text-sm);color:var(--gray-2);">${p.project_type}</span></div>` : '';
    const toolsMeta = tools ? `<div style="display:flex;flex-direction:column;gap:var(--s-2);"><span style="font-family:var(--font-mono);font-size:var(--text-xs);letter-spacing:var(--track-widest);text-transform:uppercase;color:var(--green);">Tools</span><div class="work-card-tools" style="flex-wrap:wrap;margin-top:0;">${tools}</div></div>` : '';
    
    const metaGrid = (roleMeta || timelineMeta || typeMeta || toolsMeta) ? 
      `<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(120px, 1fr));gap:var(--s-4);margin-top:var(--s-4);margin-bottom:var(--s-4);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:var(--s-4) 0;">
        ${roleMeta}
        ${timelineMeta}
        ${typeMeta}
        ${toolsMeta}
      </div>` : '';

    let caseStudyContent = '';
    let hasDedicatedPage = p.case_study && p.case_study.startsWith('/projects/');
    
    if (hasDedicatedPage) {
      caseStudyContent = `<a href="${p.case_study}" class="btn btn-primary" style="width: 100%; justify-content: center;">Read Full Case Study →</a>`;
    } else if (p.case_study) {
      if (p.case_study.startsWith('http')) {
        const linkText = p.case_study.includes('figma.com') ? 'View on Figma ↗' : 'Read Case Study ↗';
        caseStudyContent = `<a href="${p.case_study}" target="_blank" rel="noopener" class="btn btn-ghost">${linkText}</a>`;
      } else {
        caseStudyContent = `<div style="margin-top:var(--s-4);"><p style="font-family:var(--font-body);font-size:var(--text-sm);color:var(--gray-2);line-height:var(--lead-relaxed);overflow-wrap:anywhere;">${p.case_study}</p></div>`;
      }
    }

    const imagePart = p.image_url
      ? `<div class="vault-modal-image" style="background:var(--surface-2);">
           <img src="${p.image_url}" alt="${p.title}" style="object-fit:contain;width:100%;height:100%;background:var(--surface-2);">
           <div class="vault-modal-image-overlay"></div>
         </div>`
      : `<div class="vault-modal-image" style="background:var(--surface-2); display:flex; align-items:center; justify-content:center; font-family:var(--font-display); font-size:4rem; font-weight:800; color:var(--green);">
           ${(p.title || '').slice(0,2).toUpperCase()}
         </div>`;

    const overlay = document.createElement('div');
    overlay.className = 'vault-modal-overlay';
    overlay.id        = 'vault-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', p.title);

    overlay.innerHTML = `
      <style>
        .vault-modal {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          max-width: 900px !important;
          height: 85vh !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          overscroll-behavior: contain !important;
        }
        .vault-modal::-webkit-scrollbar { width: 6px; }
        .vault-modal::-webkit-scrollbar-track { background: transparent; }
        .vault-modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        .vault-modal::-webkit-scrollbar-thumb:hover { background: var(--gray-3); }
        .vault-modal-image {
          width: 100% !important;
          height: 400px !important;
          flex-shrink: 0 !important;
        }
        .vault-modal-content {
          overflow-y: visible !important;
          padding: var(--s-12) var(--s-8) !important;
        }
        .vault-modal-close {
          position: fixed !important;
          top: var(--s-8) !important;
          right: var(--s-8) !important;
          z-index: 1000 !important;
          width: 48px !important;
          height: 48px !important;
        }
      </style>
      <button class="vault-modal-close" id="vault-modal-close" aria-label="Close modal">✕</button>
      <div class="vault-modal">
        ${imagePart}
        <div class="vault-modal-content" style="overflow-wrap: anywhere;">
          <div class="section-label">${p.category || 'Project'}</div>
          <h2 class="vault-modal-title">${p.title}</h2>
          <p style="font-family:var(--font-body); font-size:var(--text-sm); color:var(--gray-2); line-height:var(--lead-relaxed);overflow-wrap:anywhere;">${p.description || ''}</p>
          
          ${metaGrid}
          
          <div style="display: flex; gap: var(--s-3); margin-top: var(--s-4); flex-wrap: wrap;">
            ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener" class="btn btn-primary">Live ↗</a>` : ''}
            ${p.github_url ? `<a href="${p.github_url}" target="_blank" rel="noopener" class="btn btn-ghost">GitHub ↗</a>` : ''}
            ${(!hasDedicatedPage && caseStudyContent.includes('<a')) ? caseStudyContent : ''}
          </div>

          ${hasDedicatedPage ? '' : (p.content ? `<div style="border-top:1px solid var(--border); padding-top:var(--s-6); margin-top:var(--s-4);">
            <p style="font-family:var(--font-body); font-size:var(--text-sm); color:var(--gray-2); line-height:var(--lead-relaxed);overflow-wrap:anywhere;">${p.content.replace(/\n/g, '<br>')}</p>
          </div>` : '')}
          
          ${hasDedicatedPage ? `<div style="margin-top: var(--s-8);">${caseStudyContent}</div>` : (caseStudyContent.includes('<div') ? caseStudyContent : '')}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    if (workLenis) workLenis.stop();

    requestAnimationFrame(() => {
      overlay.classList.add('open');
      document.getElementById('vault-modal-close')?.addEventListener('click', closeModal);
      overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
      document.addEventListener('keydown', escListener = e => {
        if (e.key === 'Escape') closeModal();
      });
    });
  }

  function closeModal () {
    const overlay = document.getElementById('vault-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (workLenis) workLenis.start();
    if (escListener) document.removeEventListener('keydown', escListener);
    setTimeout(() => overlay.remove(), 450);
  }

  let workLenis = null;

  /* Lenis */
  function initLenis () {
    if (!window.Lenis) return;
    if (!window.JXLenis) {
      window.JXLenis = new Lenis({ duration: 1.4, smoothWheel: true });
      const raf = t => { window.JXLenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      if (window.ScrollTrigger) window.JXLenis.on('scroll', ScrollTrigger.update);
    }
    workLenis = window.JXLenis;
  }

  /* Boot */
  function init () {
    if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    revealPage();
    initLenis();
    loadProjects();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
