export function attach(universe) {
  universe.openModal = (p) {
    universe._triggerElement = document.activeElement;

    if (universe._escListener) document.removeEventListener('keydown', universe._escListener);
    if (universe._tabListener) document.removeEventListener('keydown', universe._tabListener);

    /* If Pong is running, exit it first so the modal z-index stack is clean */
    if (universe._pongActive && universe._exitPong) {
      universe._exitPong(null);
    }

    /* Remove any existing modal */
    document.getElementById('jx-modal-overlay')?.remove();

    const tools = (p.tools || []).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('');

    // 1. Meta Grid
    const roleMeta = p.project_role ? `<div style="display:flex;flex-direction:column;gap:var(--s-1);"><span style="font-family:var(--font-mono);font-size:var(--text-xs);letter-spacing:var(--track-widest);text-transform:uppercase;color:var(--green);">Role</span><span style="font-size:var(--text-sm);color:var(--gray-2);">${p.project_role}</span></div>` : '';
    const timelineMeta = p.timeline ? `<div style="display:flex;flex-direction:column;gap:var(--s-1);"><span style="font-family:var(--font-mono);font-size:var(--text-xs);letter-spacing:var(--track-widest);text-transform:uppercase;color:var(--green);">Timeline</span><span style="font-size:var(--text-sm);color:var(--gray-2);">${p.timeline}</span></div>` : '';
    const typeMeta = p.project_type ? `<div style="display:flex;flex-direction:column;gap:var(--s-1);"><span style="font-family:var(--font-mono);font-size:var(--text-xs);letter-spacing:var(--track-widest);text-transform:uppercase;color:var(--green);">Type</span><span style="font-size:var(--text-sm);color:var(--gray-2);">${p.project_type}</span></div>` : '';
    const toolsMeta = tools ? `<div style="display:flex;flex-direction:column;gap:var(--s-2);"><span style="font-family:var(--font-mono);font-size:var(--text-xs);letter-spacing:var(--track-widest);text-transform:uppercase;color:var(--green);">Tools</span><div class="project-card-tools" style="margin-top:0;">${tools}</div></div>` : '';
    
    const metaGrid = (roleMeta || timelineMeta || typeMeta || toolsMeta) ? 
      `<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(120px, 1fr));gap:var(--s-4);margin-top:var(--s-4);margin-bottom:var(--s-4);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:var(--s-4) 0;">
        ${roleMeta}
        ${timelineMeta}
        ${typeMeta}
        ${toolsMeta}
      </div>` : '';

    // 2. Case Study Link
    let caseStudyContent = '';
    let hasDedicatedPage = p.case_study && p.case_study.startsWith('/projects/');
    
    if (hasDedicatedPage) {
      caseStudyContent = `<a href="${p.case_study}" class="btn btn-primary" style="width: 100%; justify-content: center;">Read Full Case Study →</a>`;
    } else if (p.case_study) {
      if (p.case_study.startsWith('http')) {
        const linkText = p.case_study.includes('figma.com') ? 'View on Figma ↗' : 'Read Case Study ↗';
        caseStudyContent = `<a href="${p.case_study}" target="_blank" rel="noopener" class="btn btn-ghost" style="align-self:flex-start;margin-top:var(--s-2);">${linkText}</a>`;
      } else {
        caseStudyContent = `<p style="font-size:var(--text-sm);color:var(--gray-2);line-height:var(--lead-relaxed);margin-top:var(--s-4);overflow-wrap:anywhere;">${p.case_study}</p>`;
      }
    }

    const isVidModal = p.image_url && (p.image_url.toLowerCase().endsWith('.mp4') || p.image_url.toLowerCase().endsWith('.webm'));
    const imagePart = p.image_url
      ? `<div class="modal-image-pane" style="background:var(--surface-2);">
           ${isVidModal 
             ? `<video src="${p.image_url}" style="object-fit:cover;background:var(--surface-2);width:100%;height:100%;" autoplay loop muted playsinline></video>`
             : `<img src="${p.image_url}" alt="${p.title}" style="object-fit:contain;background:var(--surface-2);">`}
           <div class="modal-image-overlay"></div>
         </div>`
      : `<div class="modal-image-pane" style="background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:5rem;font-weight:800;color:var(--green);">
           ${(p.title || '').slice(0,2).toUpperCase()}
         </div>`;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'jx-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', p.title);
    overlay.innerHTML = `
      <style>
        .modal {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          max-width: 900px !important;
          height: 85vh !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          overscroll-behavior: contain !important;
        }
        .modal::-webkit-scrollbar { width: 6px; }
        .modal::-webkit-scrollbar-track { background: transparent; }
        .modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        .modal::-webkit-scrollbar-thumb:hover { background: var(--gray-3); }
        .modal-image-pane {
          width: 100% !important;
          height: 400px !important;
          flex-shrink: 0 !important;
        }
        .modal-content {
          overflow-y: visible !important;
          padding: var(--s-12) var(--s-8) !important;
        }
        .modal-close {
          position: fixed !important;
          top: var(--s-8) !important;
          right: var(--s-8) !important;
          z-index: 1000 !important;
          width: 48px !important;
          height: 48px !important;
        }
      </style>
      <button class="modal-close" id="modal-close" aria-label="Close modal">✕</button>
      <div class="modal">
        ${imagePart}
        <div class="modal-content" style="overflow-wrap: anywhere;">
          <div class="section-label">${p.category || 'Project'}</div>
          <h2 class="modal-title">${p.title}</h2>
          <p style="font-size:var(--text-sm);color:var(--gray-2);line-height:var(--lead-relaxed);overflow-wrap:anywhere;">
            ${window.DOMPurify ? window.DOMPurify.sanitize(p.description || '', { ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'blockquote', 'p', 'br'] }) : (() => { const d = document.createElement('div'); d.textContent = new DOMParser().parseFromString(p.description || '', 'text/html').body.textContent || ''; return d.innerHTML; })()}
          </p>
          ${metaGrid}
          <div style="display:flex; gap:var(--s-3); flex-wrap:wrap; margin-top:var(--s-4);">
            ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener" class="btn btn-primary" style="align-self:flex-start;margin-top:var(--s-2);">View Project ↗</a>` : ''}
            ${(!hasDedicatedPage && caseStudyContent.includes('<a')) ? caseStudyContent : ''}
          </div>
          ${hasDedicatedPage ? `<div style="margin-top: var(--s-8);">${caseStudyContent}</div>` : (caseStudyContent.includes('<p') ? caseStudyContent : '')}
        </div>
      </div>
    `;

    document.body.append(overlay);

    /* Open */
    requestAnimationFrame(() => {
      overlay.classList.add('open');
      document.getElementById('modal-close')?.addEventListener('click', () => universe.closeModal());
      overlay.addEventListener('click', e => { if (e.target === overlay) universe.closeModal(); });
      document.addEventListener('keydown', universe._escListener = e => {
        if (e.key === 'Escape') universe.closeModal();
      });
      
      const focusable = overlay.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      
      document.addEventListener('keydown', universe._tabListener = e => {
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
      
      document.body.style.overflow = 'hidden';
      if (universe.lenis) universe.lenis.stop();
    });
  };

  universe.closeModal = () {
    const overlay = document.getElementById('jx-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (universe.lenis) universe.lenis.start();
    document.removeEventListener('keydown', universe._escListener);
    if (universe._tabListener) document.removeEventListener('keydown', universe._tabListener);
    if (universe._triggerElement) {
      universe._triggerElement.focus();
      universe._triggerElement = null;
    }
    setTimeout(() => overlay.remove(), 500);
  };

}
