/**
 * ABOUT PAGE HYBRID LOGIC
 * - Laser Gridline Wireframe Draw
 * - Full-Screen to Bento Grid Snap (Scroll Physics)
 * - Magnetic Parallax Hover
 * - Smooth Routing (Interior Views)
 * - Supabase Integrations (Origin timeline, Arsenal logos)
 */

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  /* ── 0. Initial Setup & State ── */
  const gridCells = gsap.utils.toArray('.content-cell');
  const heroCell = document.querySelector('.hero-cell');
  
  // Set content cells invisible and pushed down
  gsap.set(gridCells, { y: window.innerHeight, autoAlpha: 0 });
  
  // Make the hero cell massive and centered in the viewport initially
  // We use scale to fake the full-screen feeling, translating it slightly to ensure true center if needed
  gsap.set(heroCell, { 
    scale: 2.5, 
    transformOrigin: "center center",
    zIndex: 50 
  });

  // Prepare SVG paths
  const paths = document.querySelectorAll('.jx-path');
  paths.forEach(path => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    path.style.fill = 'transparent';
  });

  // Temporarily disable scroll while grid is drawing
  document.body.style.overflow = 'hidden';

  /* ── 1. The Blueprint Draw Animation ── */
  const entryTL = gsap.timeline({
    onComplete: () => {
      // Re-enable scroll when drawing finishes
      document.body.style.overflow = '';
      ScrollTrigger.refresh();
    }
  });

  // 1a. Draw Horizontal Lines
  entryTL.to('.gl-h', {
    scaleX: 1,
    duration: 1.2,
    ease: "power3.inOut",
    stagger: 0.1,
    transformOrigin: "left center"
  }, 0.2)
  // 1b. Draw Vertical Lines
  .to('.gl-v', {
    scaleY: 1,
    duration: 1.2,
    ease: "power3.inOut",
    stagger: 0.1,
    transformOrigin: "top center"
  }, 0.4)
  // 1c. Trace the JX Logo
  .to(paths, {
    strokeDashoffset: 0,
    duration: 1.5,
    ease: "power2.inOut",
    stagger: 0.2
  }, "-=0.5")
  // 1d. Flash the Logo Solid Green
  .to(paths, {
    fill: '#00FF41',
    stroke: 'transparent',
    duration: 0.5,
    ease: "power1.in"
  }, "-=0.2")
  // Add a subtle drop-shadow glow to the logo SVG
  .to('.logo-svg', {
    filter: "drop-shadow(0 0 15px rgba(0,255,65,0.4))",
    duration: 0.5
  }, "-=0.5");


  /* ── 2. Full-Screen to Bento Grid Snap (Scroll Physics) ── */
  // Pin the entire grid container so it acts as an assembly stage
  const snapTL = gsap.timeline({
    scrollTrigger: {
      trigger: ".dbx-pin-wrapper",
      start: "top top", // Pin immediately
      end: "+=1200",    // User scrolls for 1200px to assemble
      scrub: 1,
      pin: true,
      anticipatePin: 1
    }
  });

  // As we scrub, the hero shrinks from massive to normal grid size
  snapTL.to(heroCell, {
    scale: 1,
    duration: 1,
    ease: "power2.out"
  }, 0);

  // Simultaneously, the other bento boxes slide up and fade in perfectly around it
  snapTL.to(gridCells, {
    y: 0,
    autoAlpha: 1,
    duration: 1,
    stagger: 0.05,
    ease: "power2.out"
  }, 0.1);


  /* ── 3. Magnetic Parallax Hover ── */
  document.querySelectorAll('.content-cell').forEach(cell => {
    const bg = cell.querySelector('.cell-bg');
    const symbol = cell.querySelector('.cell-symbol');

    cell.addEventListener('mousemove', (e) => {
      const rect = cell.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width; // 0 to 1
      const y = (e.clientY - rect.top) / rect.height; // 0 to 1

      // Map to -1 to 1
      const xPos = (x - 0.5) * 2;
      const yPos = (y - 0.5) * 2;

      // Move Background subtly in opposite direction of mouse
      if (bg) {
        gsap.to(bg, {
          x: -15 * xPos,
          y: -15 * yPos,
          duration: 0.6,
          ease: "power2.out"
        });
      }
      
      // Move Symbol more aggressively
      if (symbol) {
        gsap.to(symbol, {
          x: -40 * xPos,
          y: -40 * yPos,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    });

    // Reset on leave
    cell.addEventListener('mouseleave', () => {
      if (bg) {
        gsap.to(bg, { x: 0, y: 0, duration: 0.6, ease: "power2.out" });
      }
      if (symbol) {
        gsap.to(symbol, { x: 0, y: 0, duration: 0.6, ease: "power2.out" });
      }
    });
  });


  /* ── 4. Smooth Interior Routing ── */
  const interiorView = document.getElementById('interior-view');
  const interiorPages = document.querySelectorAll('.interior-page');
  const btnBack = document.getElementById('btn-back-grid');

  document.querySelectorAll('.content-cell').forEach(cell => {
    cell.addEventListener('click', (e) => {
      const route = cell.getAttribute('data-route');
      if (!route) return;
      openInterior(route);
    });
  });

  btnBack.addEventListener('click', closeInterior);

  function openInterior(route) {
    interiorPages.forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${route}`);
    if (targetPage) targetPage.classList.add('active');

    // Smooth reset scroll
    window.scrollTo(0, 0);
    
    gsap.fromTo(interiorView, 
      { autoAlpha: 0, y: 50 }, 
      { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }
    );
    
    // Lock background grid scroll
    document.body.style.overflow = 'hidden';
  }

  function closeInterior() {
    gsap.to(interiorView, {
      autoAlpha: 0,
      y: 50,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => {
        interiorPages.forEach(p => p.classList.remove('active'));
        document.body.style.overflow = ''; // Unlock background scroll
      }
    });
  }

  /* ── 5. Restore Dynamic Data (Supabase) ── */
  async function populateOrigin() {
    const originGrid = document.getElementById('origin-editorial');
    if(!originGrid) return;
    if (!window.jxSupabase) {
      originGrid.innerHTML = `<div class="ed-text-block"><p>Error: Supabase client not loaded.</p></div>`;
      return;
    }
    try {
      const { data, error } = await window.jxSupabase
        .from('origin_chapters')
        .select('*')
        .order('chapter_order', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return;

      originGrid.innerHTML = '';
      data.forEach((ch, i) => {
        const block = document.createElement('div');
        block.className = 'ed-text-block';
        block.innerHTML = `
          <p class="ed-label">Chapter ${ch.chapter_order}</p>
          <h3>${ch.title}</h3>
          <p>${ch.content}</p>
        `;
        originGrid.appendChild(block);

        // Interleave images
        if ((i + 1) % 2 === 0) {
          const imgBlock = document.createElement('div');
          imgBlock.className = 'ed-image-block';
          const imgSrc = i === 1 ? 'assets/images/okezie-1.webp' : 'assets/images/okezie-coder.webp';
          imgBlock.innerHTML = `<img src="${imgSrc}" alt="Editorial visual">`;
          originGrid.appendChild(imgBlock);
        }
      });
    } catch(err) { console.error(err); }
  }

  async function populateArsenal() {
    const timeline = document.getElementById('arsenal-timeline');
    const logos = document.getElementById('company-logos-container');
    if (!timeline || !window.jxSupabase) return;

    try {
      const { data, error } = await window.jxSupabase
        .from('experience')
        .select('*')
        .order('start_date', { ascending: false });
      if (error) throw error;
      if (data) {
        timeline.innerHTML = '';
        data.forEach(item => {
          const card = document.createElement('div');
          card.className = 'ed-text-block';
          card.innerHTML = `
            <p class="ed-label">${item.role} // ${item.start_date}</p>
            <h3>${item.company}</h3>
            <p>${item.description}</p>
          `;
          timeline.appendChild(card);
        });
      }
    } catch(e) { console.error(e); }

    if (!logos) return;
    try {
      const { data, error } = await window.jxSupabase
        .from('company_logos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data && data.length > 0) {
        logos.innerHTML = '';
        data.forEach(logo => {
          logos.innerHTML += `
            <div class="company-logo">
              <img src="${logo.image_url}" alt="${logo.name || 'Company'}">
            </div>
          `;
        });
      } else {
        logos.innerHTML = '<p class="loading-text">No allies recorded yet.</p>';
      }
    } catch(e) { 
      logos.innerHTML = '<p class="loading-text" style="color:#A8A8C0;">Logo vault preparing...</p>';
    }
  }

  function initVideo() {
    const vid = document.getElementById('intro-video');
    if(vid) {
      vid.src = 'assets/videos/hero_video.mp4';
      if(window.JX && window.JX.initLoopingPreviewVideo) {
        window.JX.initLoopingPreviewVideo(vid);
      }
    }
  }

  populateOrigin();
  populateArsenal();
  initVideo();
});
