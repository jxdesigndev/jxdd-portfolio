/* ================================================================
   JX UNIVERSE — work.js (Viscose Ring Edition)
   Cinematic Scroll-Driven Portfolio
   ================================================================ */

'use strict';

(function () {
  let allProjects = [];
  let escListener = null;
  let vaultTriggerElement = null;
  let vaultEscListener = null;
  let vaultTabListener = null;

  /* Load projects from Supabase */
  async function loadProjects () {
    const ring = document.getElementById('viscose-ring');
    if (!ring) return;

    try {
      if (window.initSupabase) await window.initSupabase();
    } catch (err) {
      console.warn("Supabase init failed", err);
    }
    if (typeof supabase === 'undefined' || !supabase.from) {
      ring.innerHTML = '<div style="color:var(--gray-3); text-align:center; padding: 2rem;">Database not configured.</div>';
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      allProjects = data || [];
      if (allProjects.length > 0) {
        initViscoseRing(allProjects);
      } else {
        ring.innerHTML = '<div style="color:var(--gray-3); text-align:center;">No projects found.</div>';
      }
    } catch (err) {
      console.error(err);
      ring.innerHTML = '<div style="color:var(--red); text-align:center;">Failed to load vault.</div>';
    }
  }

  /* Initialize Viscose Ring Animation */
  function initViscoseRing(projects) {
    if (!window.gsap || !window.ScrollTrigger) return;

    const ring = document.getElementById('viscose-ring');
    const listContainer = document.getElementById('viscose-list');
    
    // Clear inner contents except the center text
    const centerText = document.getElementById('viscose-center-text');
    ring.innerHTML = '';
    if (centerText) ring.appendChild(centerText);
    listContainer.innerHTML = '';

    const numCards = projects.length;
    const angleStep = 360 / numCards;
    const radiusVH = 55; // Matches half of viscose-ring width (90vh)

    // 1. Build the DOM nodes
    const cards = [];
    const listItems = [];

    projects.forEach((p, i) => {
      const baseAngle = 270 + i * angleStep;
      
      const cardWrap = document.createElement('article');
      cardWrap.className = 'viscose-card';
      cardWrap.style.transform = `rotate(${baseAngle}deg) translateY(-${radiusVH}vh)`;

      const cardInner = document.createElement('div');
      cardInner.className = 'v-card-inner';
      
      if (p.image_url) {
        if (p.image_url.toLowerCase().endsWith('.mp4') || p.image_url.toLowerCase().endsWith('.webm')) {
          cardInner.innerHTML = `<video src="${p.image_url}" autoplay loop muted playsinline></video>`;
        } else {
          cardInner.innerHTML = `<img src="${p.image_url}" alt="${p.title}">`;
        }
      } else {
        cardInner.innerHTML = `<span>${(p.title || '').slice(0, 2).toUpperCase()}</span>`;
      }

      cardInner.addEventListener('click', () => { if (p.slug) { window.location.href = `project.html?slug=${encodeURIComponent(p.slug)}`; } else if (p.case_study && p.case_study.startsWith('/projects/')) { window.location.href = p.case_study; } else { openModal(p); } });

      cardWrap.appendChild(cardInner);
      ring.appendChild(cardWrap);
      cards.push({ wrap: cardWrap, inner: cardInner, p: p, baseAngle: baseAngle, index: i });

      // Create List Item
      const li = document.createElement('span');
      li.className = 'viscose-list-item';
      li.textContent = p.title;
      listContainer.appendChild(li);
      listItems.push(li);
    });

    // 2. Build GSAP Timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#viscose-wrapper',
        pin: true,
        scrub: 1.5,
        end: `+=${numCards * 700}px` 
      }
    });

    // Phase 1: Zoom In
    const zoomScale = 3.5;
    const shiftXVH = 55 * zoomScale; 

    tl.to('#viscose-ring-container', {
      scale: zoomScale,
      x: `${shiftXVH}vh`,
      duration: 1, 
      ease: 'power2.inOut'
    }, 0);

    if (centerText) {
      tl.to(centerText, { opacity: 0, scale: 0.5, duration: 0.8 }, 0);
    }
    
    tl.to('#viscose-details', { opacity: 1, duration: 0.5 }, 0.5);

    // Phase 2: Scrub
    const totalRotation = -(numCards - 1) * angleStep;
    tl.to(ring, {
      rotation: totalRotation,
      duration: numCards * 0.8,
      ease: 'none'
    }, 1);

    // 3. Fluid 'Viscose' Counter-Rotation & UI Sync (onUpdate)
    const vdIndex = document.getElementById('vd-index');
    const vdTitle = document.getElementById('vd-title');
    const vdRole = document.getElementById('vd-role');
    const vdYear = document.getElementById('vd-year');

    let lastActiveIndex = -1;

    tl.eventCallback('onUpdate', () => {
      const ringRot = gsap.getProperty(ring, 'rotation') || 0;
      
      cards.forEach((c) => {
        let absAngle = (c.baseAngle + ringRot) % 360;
        if (absAngle < 0) absAngle += 360;
        
        let diff = absAngle - 270;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        
        const range = Math.max(30, angleStep * 0.7);
        let factor = 1 - Math.min(Math.abs(diff) / range, 1);
        factor = gsap.parseEase('power2.out')(factor); 
        
        const innerRot = factor * 90;
        const innerScale = 0.6 + factor * 0.45; 
        const innerOpacity = 0.3 + factor * 0.7;
        
        gsap.set(c.inner, {
          rotation: innerRot,
          scale: innerScale,
          opacity: innerOpacity,
          filter: `blur(${(1 - factor) * 4}px)`
        });
        
        if (Math.abs(diff) < (angleStep / 2) && lastActiveIndex !== c.index) {
          lastActiveIndex = c.index;
          
          listItems.forEach((li, idx) => {
            if (idx === c.index) li.classList.add('active');
            else li.classList.remove('active');
          });

          if (vdTitle) {
            gsap.to(['#vd-index', '#vd-title', '#vd-role', '#vd-year'], { 
              opacity: 0, 
              duration: 0.15, 
              onComplete: () => {
                vdIndex.textContent = String(c.index + 1).padStart(2, '0');
                vdTitle.textContent = c.p.title;
                vdRole.textContent = c.p.category || 'Project';
                vdYear.textContent = c.p.year || '2026';
                gsap.to(['#vd-index', '#vd-title', '#vd-role', '#vd-year'], { opacity: 1, duration: 0.25 });
              }
            });
          }
        }
      });
    });
  }

  function openModal (p) {
    vaultTriggerElement = document.activeElement;

    if (vaultEscListener) document.removeEventListener('keydown', vaultEscListener);
    if (vaultTabListener) document.removeEventListener('keydown', vaultTabListener);

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

    const isVidModal = p.image_url && (p.image_url.toLowerCase().endsWith('.mp4') || p.image_url.toLowerCase().endsWith('.webm'));
    const imagePart = p.image_url
      ? `<div class="vault-modal-image" style="background:var(--surface-2);">
           ${isVidModal
             ? `<video src="${p.image_url}" style="object-fit:cover;width:100%;height:100%;background:var(--surface-2);" autoplay loop muted playsinline></video>`
             : `<img src="${p.image_url}" alt="${p.title}" style="object-fit:contain;width:100%;height:100%;background:var(--surface-2);">`}
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
          <div style="font-family:var(--font-body); font-size:var(--text-sm); color:var(--gray-2); line-height:var(--lead-relaxed);overflow-wrap:anywhere;" class="tiptap-content">
            ${window.DOMPurify ? window.DOMPurify.sanitize(p.description || '', { ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'blockquote', 'p', 'br'] }) : (() => { const d = document.createElement('div'); d.textContent = new DOMParser().parseFromString(p.description || '', 'text/html').body.textContent || ''; return d.innerHTML; })()}
          </div>
          
          ${metaGrid}
          
          <div style="display: flex; gap: var(--s-3); margin-top: var(--s-4); flex-wrap: wrap;">
            ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener" class="btn btn-primary">Live ↗</a>` : ''}
            ${p.github_url ? `<a href="${p.github_url}" target="_blank" rel="noopener" class="btn btn-ghost">GitHub ↗</a>` : ''}
            ${(!hasDedicatedPage && caseStudyContent.includes('<a')) ? caseStudyContent : ''}
          </div>

          ${hasDedicatedPage ? '' : (p.content ? `<div style="border-top:1px solid var(--border); padding-top:var(--s-6); margin-top:var(--s-4);">
            <div style="font-family:var(--font-body); font-size:var(--text-sm); color:var(--gray-2); line-height:var(--lead-relaxed);overflow-wrap:anywhere;" class="tiptap-content">
            ${window.DOMPurify ? window.DOMPurify.sanitize(p.content || '', { ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'blockquote', 'p', 'br'] }) : (() => { const d = document.createElement('div'); d.textContent = new DOMParser().parseFromString(p.content || '', 'text/html').body.textContent || ''; return d.innerHTML; })()}
          </div>
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
      document.addEventListener('keydown', vaultEscListener = e => {
        if (e.key === 'Escape') closeModal();
      });

      const focusable = overlay.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      document.addEventListener('keydown', vaultTabListener = e => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }
      });
      first?.focus();
    });
  }

  function closeModal () {
    const overlay = document.getElementById('vault-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (workLenis) workLenis.start();
    if (vaultEscListener) document.removeEventListener('keydown', vaultEscListener);
    if (vaultTabListener) document.removeEventListener('keydown', vaultTabListener);
    if (vaultTriggerElement) {
      vaultTriggerElement.focus();
      vaultTriggerElement = null;
    }
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
  function revealPage () { const page = document.getElementById("page"); if(page) gsap.to(page, {opacity: 1, duration: 0.7}); } 

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
