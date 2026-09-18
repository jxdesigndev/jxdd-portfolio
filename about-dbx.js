/**
 * ABOUT PAGE HYBRID LOGIC
 * - SVG Trace Entry
 * - GSAP Scroll-to-Assemble Grid
 * - Smooth Routing (Interior Views)
 * - Supabase Integrations (Origin timeline, Arsenal logos)
 */

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  /* ── 1. SVG Trace Animation ── */
  const paths = document.querySelectorAll('.jx-path');
  
  // Prepare paths for drawing
  paths.forEach(path => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    path.style.fill = 'transparent';
  });

  // Master Entry Timeline
  const entryTL = gsap.timeline();

  // Draw the strokes
  entryTL.to(paths, {
    strokeDashoffset: 0,
    duration: 1.5,
    ease: "power2.inOut",
    stagger: 0.2
  })
  // Flash to solid fill
  .to(paths, {
    fill: '#00FF41',
    stroke: 'transparent',
    duration: 0.5,
    ease: "power1.in"
  });

  /* ── 2. The Scroll-to-Assemble Grid ── */
  const gridCells = gsap.utils.toArray('.content-cell');
  
  // Set initial state for scrolling cells
  gsap.set(gridCells, { y: 200, opacity: 0 });

  ScrollTrigger.create({
    trigger: ".dbx-grid-container",
    start: "top 80px", // Just below the nav
    end: "+=600",      // Scroll distance to assemble
    scrub: 1,
    animation: gsap.to(gridCells, {
      y: 0,
      opacity: 1,
      duration: 1,
      stagger: 0.1,
      ease: "power2.out"
    })
  });

  /* ── 3. Smooth Interior Routing ── */
  const interiorView = document.getElementById('interior-view');
  const interiorPages = document.querySelectorAll('.interior-page');
  const btnBack = document.getElementById('btn-back-grid');
  let currentRoute = null;

  // Click on a Bento Cell
  document.querySelectorAll('.content-cell').forEach(cell => {
    cell.addEventListener('click', (e) => {
      const route = cell.getAttribute('data-route');
      if (!route) return;
      openInterior(route);
    });
  });

  btnBack.addEventListener('click', closeInterior);

  function openInterior(route) {
    // Set active page
    interiorPages.forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${route}`);
    if (targetPage) targetPage.classList.add('active');
    
    currentRoute = route;

    // Transition Mechanics
    gsap.to(window, { scrollTo: 0, duration: 0.3 }); // Reset scroll
    
    gsap.fromTo(interiorView, 
      { autoAlpha: 0, y: 50 }, 
      { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }
    );
    
    // Lock body scroll so grid behind doesn't scroll
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
        document.body.style.overflow = '';
        // Small refresh to ensure GSAP on the main grid is stable
        ScrollTrigger.refresh();
      }
    });
  }

  /* ── 4. Restore Dynamic Data (Supabase) ── */
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
        // We interleave image blocks and text blocks for editorial magazine feel
        const block = document.createElement('div');
        block.className = 'ed-text-block';
        block.innerHTML = `
          <p class="ed-label">Chapter ${ch.chapter_order}</p>
          <h3>${ch.title}</h3>
          <p>${ch.content}</p>
        `;
        originGrid.appendChild(block);

        // Inject an editorial image block after every 2 chapters
        if ((i + 1) % 2 === 0) {
          const imgBlock = document.createElement('div');
          imgBlock.className = 'ed-image-block';
          // Rotate some stock tech/afrofuturist placeholder images
          const imgSrc = i === 1 ? 'assets/images/okezie-1.webp' : 'assets/images/okezie-coder.webp';
          imgBlock.innerHTML = `<img src="${imgSrc}" alt="Editorial visual">`;
          originGrid.appendChild(imgBlock);
        }
      });
    } catch(err) {
      console.error(err);
    }
  }

  async function populateArsenal() {
    const timeline = document.getElementById('arsenal-timeline');
    const logos = document.getElementById('company-logos-container');
    if (!timeline || !window.jxSupabase) return;

    // Timeline Data
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

    // Logos Data
    if (!logos) return;
    try {
      const { data, error } = await window.jxSupabase
        .from('company_logos')
        .select('*')
        .order('created_at', { ascending: false });
      
      // If table doesn't exist yet (admin needs to add it), we catch error
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

  /* ── 5. Transmission Video ── */
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
