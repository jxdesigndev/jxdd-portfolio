/* =========================================
   JX Design & Dev — Services Page Script
   services.js — Card Expansion & GSAP
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
  // --- Dynamic Content Fetch ---
  async function initDynamicServices() {
    if (!window.initSupabase || !window.supabaseClient) return;
    await window.initSupabase();
    
    const container = document.getElementById('services-list-container');
    if (!container) return;

    try {
      const { data: services, error } = await window.supabaseClient
        .from('services')
        .select('*')
        // We'll order by ID for consistent ordering, or you could add a priority field later
        .order('id', { ascending: true });

      if (services && services.length > 0) {
        container.innerHTML = '';
        
        services.forEach(s => {
          const isSoon = s.status === 'Coming Soon';
          const badgeClass = isSoon ? 'soon' : 'available';
          const badgeText = isSoon ? 'COMING SOON' : 'AVAILABLE';
          
          let toolsHtml = '';
          if (Array.isArray(s.tools)) {
            toolsHtml = s.tools.join(' · ');
          }

          let stepsHtml = '';
          if (Array.isArray(s.steps) && s.steps.length > 0) {
            stepsHtml = s.steps.map(step => `
              <div class="sp-step">
                <div class="sp-step-identifier">${step.identifier || ''}</div>
                <div class="sp-step-title">${step.title || ''}</div>
                <div class="sp-step-desc">${step.desc || ''}</div>
              </div>
            `).join('');
          }

          let bodyInnerHtml = `
            <div class="sp-process-title">My Process</div>
            <div class="sp-process-timeline">
              ${stepsHtml}
            </div>
            <div class="sp-cta-wrap">
              <a href="contact.html" class="sp-cta-link">Interested in this service? →</a>
            </div>
          `;

          if (isSoon) {
            bodyInnerHtml = `
              <div class="sp-coming-soon-overlay">
                <div class="sp-coming-text">Currently Under Refinement — Coming Soon</div>
              </div>
              <div class="sp-body-inner" style="filter: grayscale(1); user-select: none;">
                <div class="sp-process-title">My Process</div>
                <div class="sp-process-timeline">
                  ${stepsHtml}
                </div>
              </div>
            `;
          } else {
            bodyInnerHtml = `<div class="sp-body-inner">${bodyInnerHtml}</div>`;
          }

          const card = document.createElement('div');
          card.className = 'sp-card';
          card.innerHTML = `
            <div class="sp-card-header">
              <div class="sp-icon">${s.icon || '✦'}</div>
              <div class="sp-info-main">
                <h2 class="sp-headline">${s.name || ''}</h2>
                <div class="sp-tagline">${s.headline || ''}</div>
                <p class="sp-desc">${s.desc || ''}</p>
                <div class="sp-tools-list">${toolsHtml}</div>
              </div>
              <div>
                <span class="sp-badge ${badgeClass}">${badgeText}</span>
              </div>
            </div>
            <div class="sp-card-body">
              ${bodyInnerHtml}
            </div>
          `;
          container.appendChild(card);
        });

        // Initialize GSAP after adding cards
        initCardAnimations();
      } else {
        container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:40px;">No services defined yet.</div>';
      }
    } catch (err) {
      console.warn("Could not load dynamic services:", err);
      container.innerHTML = '<div style="text-align:center;color:var(--red);padding:40px;">Failed to load services.</div>';
    }
  }

  function initCardAnimations() {
    if (typeof gsap === 'undefined') return;

    const cards = document.querySelectorAll('.sp-card');

    cards.forEach((card) => {
      const header = card.querySelector('.sp-card-header');
      const body = card.querySelector('.sp-card-body');
      const steps = card.querySelectorAll('.sp-step');

    header.addEventListener('click', () => {
      const isActive = card.classList.contains('active');

      if (isActive) {
        // Collapse this card
        card.classList.remove('active');
        gsap.to(body, { height: 0, duration: 0.5, ease: 'power3.inOut' });
        
        // Remove dim from all cards
        cards.forEach(c => c.classList.remove('dimmed'));
      } else {
        // Collapse all other active cards
        cards.forEach(c => {
          if (c !== card) {
            c.classList.remove('active');
            c.classList.add('dimmed'); // Dim other cards
            const otherBody = c.querySelector('.sp-card-body');
            if (otherBody) gsap.to(otherBody, { height: 0, duration: 0.4, ease: 'power3.inOut' });
          } else {
            c.classList.remove('dimmed');
          }
        });

        // Expand this card
        card.classList.add('active');
        
        // Use GSAP "auto" height for smooth expansion based on calculated inner height
        gsap.fromTo(body, 
          { height: 0 }, 
          { height: 'auto', duration: 0.6, ease: 'power3.out' }
        );

        // Stagger inner steps
        if (steps.length > 0) {
          gsap.fromTo(steps, 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, delay: 0.2, ease: 'power2.out', clearProps: 'all' }
          );
        }
      }
    });

    // Hover logic to interact with custom cursor
    header.addEventListener('mouseenter', () => {
      const cursor = document.getElementById('cursor');
      const follower = document.getElementById('cursor-follower');
      if (cursor) cursor.classList.add('hover');
      if (follower) follower.classList.add('hover');
    });

    header.addEventListener('mouseleave', () => {
      const cursor = document.getElementById('cursor');
      const follower = document.getElementById('cursor-follower');
      if (cursor) cursor.classList.remove('hover');
      if (follower) follower.classList.remove('hover');
    });
    });

    // initial fade in of cards
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.fromTo('.sp-card', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out', scrollTrigger: { trigger: '.sp-list', start: 'top 85%' }}
      );
    }
  }

  // Fire dynamic fetch immediately
  initDynamicServices();
});
