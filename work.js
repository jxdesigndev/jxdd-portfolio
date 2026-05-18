/* =========================================
   JX Design & Dev — Portfolio Page Script
   work.js — Dynamic Data & Filtering
   ========================================= */

document.addEventListener('DOMContentLoaded', async () => {
    let categories = [];
    let projects = [];

    // 1. Fetch categories and projects from Supabase
    try {
        const [catRes, projRes] = await Promise.all([
            window.supabaseClient.from('categories').select('*'),
            window.supabaseClient.from('projects').select('*').order('priority', { ascending: false })
        ]);
        if (catRes.data) categories = catRes.data;
        if (projRes.data) projects = projRes.data;
    } catch (err) {
        console.error("Error fetching portfolio data from Supabase", err);
    }

    // fallback data if Supabase is empty or fails
    if (categories.length === 0) {
        categories = [
            { id: 'cat-product', name: 'Product Design', available: true },
            { id: 'cat-nocode', name: 'No-Code / Vibe Code', available: true }
        ];
    }
    if (projects.length === 0) {
        projects = [
           { id: 1, name: "Data Loading...", category: "Product Design", shortDesc: "Please add your Supabase URL & Key", tools: [], status: "Coming Soon" }
        ];
    }

    // 2. Render Filters dynamically
    const filterContainer = document.querySelector('.filter-tabs');
    if (filterContainer) {
        filterContainer.innerHTML = '';
        
        // Add "All" default
        const allBtn = document.createElement('button');
        allBtn.className = 'filter-tab active';
        allBtn.setAttribute('data-filter', 'all');
        allBtn.textContent = 'All';
        filterContainer.appendChild(allBtn);

        // Add dynamically
        categories.forEach(cat => {
            const safeCatName = (cat.name || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
            const btn = document.createElement('button');
            btn.className = `filter-tab ${cat.available ? '' : 'disabled'}`;
            btn.setAttribute('data-filter', safeCatName); // we use safe slug for filtering
            btn.textContent = cat.available ? cat.name : `${cat.name} — Coming Soon`;
            
            if (!cat.available) {
                const wrap = document.createElement('div');
                wrap.className = 'filter-tab-wrap';
                wrap.setAttribute('tooltip', cat.desc || 'Coming Soon');
                wrap.appendChild(btn);
                filterContainer.appendChild(wrap);
            } else {
                filterContainer.appendChild(btn);
            }
        });
    }

    // 3. Render Projects dynamically
    const gridContainer = document.querySelector('.portfolio-grid');
    if (gridContainer) {
        gridContainer.innerHTML = '';

        projects.forEach(p => {
            const sBadgeClass = p.status === 'Live' ? 'status-live' : p.status === 'In Progress' ? 'status-progress' : 'status-soon';
            const badgeIcon = p.status === 'Live' ? '✓' : p.status === 'Coming Soon' ? '...' : '↻';
            const toolsRaw = Array.isArray(p.tools) ? p.tools : JSON.parse(p.tools || '[]');
            const toolsHtml = (toolsRaw || []).map(t => `<span class="tool-pill">${t}</span>`).join('');
            
            const safeCatName = (p.category || '').toLowerCase().replace(/[^a-z0-9]/g, '-');

            const card = document.createElement('div');
            card.className = 'work-card portfolio-card';
            card.setAttribute('data-category', safeCatName);
            // Default styling structure
            card.innerHTML = `
                <div class="card-image" style="background: linear-gradient(135deg, var(--${p.gradient || 'neon-green'}), #0a0a0a 100%);">
                  ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;mix-blend-mode:overlay;opacity:0.6;">` : ''}
                  <div class="card-overlay"><span>View Case Study →</span></div>
                </div>
                <div class="card-body">
                  <div class="card-meta">
                    <span class="card-category">${p.category}</span>
                  </div>
                  <h3 class="card-title">${p.name}</h3>
                  <div class="card-badges">
                    ${p.client ? `<span class="badge-client">Client: ${p.client} ${p.flag || ''}</span>` : ''}
                    <span class="badge-status ${sBadgeClass}">${p.status} ${badgeIcon}</span>
                  </div>
                  <p class="card-desc">${p.shortDesc || ''}</p>
                  <div class="card-tools">${toolsHtml}</div>
                  <a href="${p.url || '#contact'}" class="card-btn" target="${p.url ? '_blank' : '_self'}">${p.url ? 'Visit Live Site ↗' : 'View Case Study →'}</a>
                  <span class="card-arrow">→</span>
                </div>
            `;
            gridContainer.appendChild(card);
        });
    }

    // GSAP Cards Stagger Load
    if (typeof gsap !== 'undefined') {
        const cards = document.querySelectorAll('.portfolio-card');
        gsap.fromTo(cards, 
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
        );
    }

    // Isotope-style filtering via GSAP
    const filterTabs = document.querySelectorAll('.filter-tab');
    const allCards = document.querySelectorAll('.portfolio-card');

    filterTabs.forEach(tab => {
        if (tab.classList.contains('disabled')) return; // Ignore disabled tabs

        tab.addEventListener('click', () => {
            // Remove active from all
            filterTabs.forEach(t => t.classList.remove('active'));
            // Add active to clicked
            tab.classList.add('active');

            const filterValue = tab.getAttribute('data-filter');

            // Find matching and non-matching cards
            const matchCards = [];
            const hideCards = [];

            allCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filterValue === 'all' || category === filterValue) {
                    matchCards.push(card);
                } else {
                    hideCards.push(card);
                }
            });

            // GSAP Transition
            if (typeof gsap !== 'undefined') {
                const tl = gsap.timeline();

                // Fade out non-matching
                if (hideCards.length > 0) {
                    tl.to(hideCards, {
                        opacity: 0,
                        scale: 0.95,
                        duration: 0.3,
                        ease: 'power2.in',
                        onComplete: () => {
                            hideCards.forEach(c => c.style.display = 'none');
                        }
                    });
                }

                // Show and fade in matching
                tl.call(() => {
                    matchCards.forEach(c => {
                        if (c.style.display === 'none') {
                            c.style.display = 'block'; // Or flex/grid depending on layout
                            // Pre-set transparent and scaled down before animating in
                            gsap.set(c, { opacity: 0, scale: 0.95 });
                        }
                    });
                });

                if (matchCards.length > 0) {
                    tl.to(matchCards, {
                        opacity: 1,
                        scale: 1,
                        duration: 0.4,
                        stagger: 0.05,
                        ease: 'power2.out'
                    }, "+=0.05"); // slight delay after hide
                }
            } else {
                // Fallback without GSAP
                hideCards.forEach(c => c.style.display = 'none');
                matchCards.forEach(c => c.style.display = 'block');
            }
        });
    });
});
