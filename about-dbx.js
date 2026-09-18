/**
 * ABOUT PAGE — JX BENTO HUB ENGINE v7.0
 *
 * Exact mirror of brand.dropbox.com mechanics, JX-branded:
 *
 * 1. ENTRY: border lines animate (scaleX/scaleY), JX SVG traces, fills green
 * 2. HUB LAYOUT: tiles positioned absolutely using calculated coords
 *    - Start at scale(2) + large translate offset (like Dropbox matrix(2,0,0,2,X,Y))
 *    - Scroll drives them to scale(1), translate(0,0) via GSAP ScrollTrigger
 * 3. HOVER: magnetic parallax on bg + symbol
 * 4. CLICK: .enlarge class expands tile to 100vw/100vh with swoop easing
 *           → other tiles fade → interior editorial page slides in
 * 5. INTERIOR: scroll-reveal cards, equal-height grid, Supabase data
 * 6. BACK: close interior → hub restores
 */

(function () {
  'use strict';

  /* ─── Wait for GSAP ─── */
  function waitForGsap(cb) {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      cb();
    } else {
      setTimeout(() => waitForGsap(cb), 30);
    }
  }

  /* ─── Tile Layout Configuration ─── */
  // These coords define the FINAL grid positions of each tile
  // All in px from top-left of .jx-hub (below nav)
  // The pattern produces: [Logo center] [Origin left-tall] [Philosophy right-tall]
  //                       [Arsenal bottom-wide-left] [Transmission bottom-wide-right]
  function getTileLayout() {
    const GAP       = 10;
    const NAV       = 80; // nav height
    const W         = window.innerWidth;
    const H         = window.innerHeight - NAV;

    // 4 columns, 2 rows
    // Col widths: [1] [2] [2] [1] relative (25%, 25%, 25%, 25%)
    // But logo takes middle 2 cols, row 1
    const COL = (W - GAP * 3) / 4; // one column width
    const R1  = (H - GAP) * 0.55;  // row 1 height (55% of available)
    const R2  = (H - GAP) * 0.45;  // row 2 height

    return {
      logo: {
        left:   COL + GAP,
        top:    0,
        width:  COL * 2 + GAP,
        height: R1,
      },
      origin: {
        left:   0,
        top:    0,
        width:  COL,
        height: R1,
        anchor: 'anchor-tl',
      },
      philosophy: {
        left:   COL * 3 + GAP * 3,
        top:    0,
        width:  COL,
        height: R1,
        anchor: 'anchor-tr',
      },
      arsenal: {
        left:   0,
        top:    R1 + GAP,
        width:  COL * 2 + GAP,
        height: R2,
        anchor: 'anchor-bl',
      },
      transmission: {
        left:   COL * 2 + GAP * 2,
        top:    R1 + GAP,
        width:  COL * 2 + GAP,
        height: R2,
        anchor: 'anchor-br',
      },
    };
  }

  /* ─── Apply Layout to DOM ─── */
  function applyLayout(layout) {
    const setStyle = (id, pos) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.left   = pos.left   + 'px';
      el.style.top    = pos.top    + 'px';
      el.style.width  = pos.width  + 'px';
      el.style.height = pos.height + 'px';
    };
    setStyle('tile-logo',         layout.logo);
    setStyle('tile-origin',       layout.origin);
    setStyle('tile-philosophy',   layout.philosophy);
    setStyle('tile-arsenal',      layout.arsenal);
    setStyle('tile-transmission', layout.transmission);
  }

  /* ─── Main Init ─── */
  function init() {
    gsap.registerPlugin(ScrollTrigger);

    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    if (isMobile) {
      initMobile();
      return;
    }

    /* ── 1. Layout ── */
    const layout = getTileLayout();
    applyLayout(layout);

    /* ── 2. Initial State — tiles start scattered at scale(2) ── */
    // Mirror of Dropbox: each tile starts at matrix(2,0,0,2,OFFSET_X,OFFSET_Y)
    const contentTiles = document.querySelectorAll('.jx-tile-content');
    const logoTile     = document.getElementById('tile-logo');
    const hub          = document.getElementById('jx-hub');

    // Add assembling class to clip overflow during scatter animation
    hub.classList.add('assembling');

    // Calculate "yeet" offsets — tiles fly in from corners/edges
    // Dropbox uses calc((max(100vw, 100vh) - 90px) / -4) for the highest offset
    const YEET = Math.max(window.innerWidth, window.innerHeight) * 0.5;

    const yeetMap = {
      'tile-origin':       { x: -YEET, y: -YEET * 0.8 },
      'tile-philosophy':   { x:  YEET, y: -YEET * 0.8 },
      'tile-arsenal':      { x: -YEET, y:  YEET * 0.8 },
      'tile-transmission': { x:  YEET, y:  YEET * 0.8 },
    };

    // Set initial states
    contentTiles.forEach(tile => {
      const offset = yeetMap[tile.id] || { x: 0, y: 0 };
      gsap.set(tile, {
        scale:   2,
        x:       offset.x,
        y:       offset.y,
        autoAlpha: 0,
        transformOrigin: 'center center',
      });
    });

    // Logo: compute the offset so the SCALED logo appears dead-center in viewport.
    // The tile lives at layout.logo.left/top. Its center in hub-space is:
    const tileCX = layout.logo.left + layout.logo.width  / 2;
    const tileCY = layout.logo.top  + layout.logo.height / 2;
    // Viewport center in hub-space (hub starts below nav):
    const vpCX   = window.innerWidth  / 2;
    const vpCY   = (window.innerHeight - 80) / 2; // 80 = nav height
    // The offset that moves the tile's center to the viewport center:
    const logoDX = vpCX - tileCX;
    const logoDY = vpCY - tileCY;

    // Scale large enough to look "full screen hero" (fill ~80% of viewport height)
    const logoScale = Math.min(
      (window.innerWidth  * 0.85) / layout.logo.width,
      ((window.innerHeight - 80) * 0.82) / layout.logo.height
    );

    gsap.set(logoTile, {
      x:    logoDX,
      y:    logoDY,
      scale: logoScale,
      transformOrigin: 'center center',
      zIndex: 100,
    });

    // Set SVG path lengths for stroke animation
    const paths = document.querySelectorAll('.jx-path');
    paths.forEach(path => {
      try {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, fill: 'transparent' });
      } catch(e) {}
    });

    // Lock scroll during entry
    document.body.style.overflow = 'hidden';

    /* ── 3. Entry Animation ── */
    const entry = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = '';
        hub.classList.remove('assembling');
        ScrollTrigger.refresh();
        initScrollAssembly(layout);
      }
    });

    // 3a. Draw border lines on Logo tile first
    const logoLines = logoTile.querySelectorAll('.tile-line');
    entry.to(logoLines, {
      scaleX: 1, scaleY: 1,
      duration: 0.8, ease: 'power3.inOut', stagger: 0.05
    }, 0.2);

    // 3b. Trace JX strokes
    entry.to(paths, {
      strokeDashoffset: 0,
      duration: 1.4, ease: 'power2.inOut', stagger: 0.15
    }, 0.4);

    // 3c. Fill solid green + glow
    entry.to(paths, {
      fill: '#00FF41', stroke: 'transparent',
      duration: 0.4, ease: 'power1.in'
    }, '-=0.15');

    entry.to('.jx-logo-svg', {
      filter: 'drop-shadow(0 0 20px rgba(0,255,65,0.45))',
      duration: 0.4, yoyo: true, repeat: 1
    }, '-=0.3');

    // 3d. Reveal tagline
    entry.fromTo('.jx-tagline', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, '-=0.3');


    /* ── 4. Scroll Assembly ── */
    function initScrollAssembly(layout) {
      // ScrollTrigger: hub stays fixed, tiles animate into position as user scrolls
      const hub = document.getElementById('jx-hub');

      const assemblyTL = gsap.timeline({
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: '+=200vh',
          scrub: 1.2,
          onUpdate: self => {
            // Keep hub fixed until assembly is done (progress < 1)
            // Once complete, do nothing — hub already has position:fixed
          }
        }
      });

      // Logo shrinks from full-viewport-center → grid slot (scale:1, x:0, y:0)
      assemblyTL.to(logoTile, {
        scale: 1, x: 0, y: 0,
        duration: 1, ease: 'power2.inOut',
        zIndex: 10,
      }, 0);

      // Content tiles fly from scatter to their positions
      // Origin (top-left corner)
      assemblyTL.to('#tile-origin', {
        scale: 1, x: 0, y: 0, autoAlpha: 1,
        duration: 1, ease: 'power2.out'
      }, 0.05);

      // Philosophy (top-right corner)
      assemblyTL.to('#tile-philosophy', {
        scale: 1, x: 0, y: 0, autoAlpha: 1,
        duration: 1, ease: 'power2.out'
      }, 0.1);

      // Arsenal (bottom-left)
      assemblyTL.to('#tile-arsenal', {
        scale: 1, x: 0, y: 0, autoAlpha: 1,
        duration: 1, ease: 'power2.out'
      }, 0.15);

      // Transmission (bottom-right)
      assemblyTL.to('#tile-transmission', {
        scale: 1, x: 0, y: 0, autoAlpha: 1,
        duration: 1, ease: 'power2.out'
      }, 0.18);

      // Border lines on content tiles draw in as they arrive
      assemblyTL.to('.jx-tile-content .tile-line', {
        scaleX: 1, scaleY: 1,
        duration: 0.6, ease: 'power2.inOut', stagger: 0.02
      }, 0.5);

      // Fade scroll hint out as user scrolls
      assemblyTL.to('#scroll-hint', { autoAlpha: 0, duration: 0.3 }, 0);
    }

    /* ── 5. Magnetic Parallax Hover ── */
    contentTiles.forEach(tile => {
      const bg     = tile.querySelector('.tile-bg');
      const symbol = tile.querySelector('.tile-symbol');

      tile.addEventListener('mousemove', e => {
        const r    = tile.getBoundingClientRect();
        const xPct = ((e.clientX - r.left) / r.width  - 0.5) * 2;
        const yPct = ((e.clientY - r.top)  / r.height - 0.5) * 2;

        if (bg) gsap.to(bg, { x: xPct * -20, y: yPct * -20, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
        if (symbol) gsap.to(symbol, { x: xPct * -40, y: yPct * -40, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
      });

      tile.addEventListener('mouseleave', () => {
        if (bg) gsap.to(bg, { x: 0, y: 0, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
        if (symbol) gsap.to(symbol, { x: 0, y: 0, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
      });
    });

    /* ── 6. Click → Enlarge → Interior ── */
    initRouting(hub);

    /* ── 7. Resize Handler ── */
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newLayout = getTileLayout();
        applyLayout(newLayout);
        ScrollTrigger.refresh();
      }, 200);
    });
  }

  /* ─── Routing ─── */
  function initRouting(hub) {
    if (!hub) hub = document.getElementById('jx-hub');
    const interior      = document.getElementById('interior-shell');
    const btnBack       = document.getElementById('btn-back');
    const interiorPages = document.querySelectorAll('.interior-page');
    let   activeRoute   = null;

    document.querySelectorAll('.jx-tile-content').forEach(tile => {
      tile.addEventListener('click', () => {
        if (hub.classList.contains('has-enlarged')) return; // prevent double-click
        const route = tile.getAttribute('data-route');
        if (route) openInterior(tile, route);
      });
    });

    if (btnBack) btnBack.addEventListener('click', closeInterior);

    function openInterior(tile, route) {
      activeRoute = route;
      const anchor = layout_anchor_for(tile.id);

      // 1. Show active interior page
      interiorPages.forEach(p => p.classList.remove('active'));
      const target = document.getElementById('page-' + route);
      if (target) target.classList.add('active');

      // 2. Add enlarge class to clicked tile
      hub.classList.add('has-enlarged');
      tile.classList.add('enlarge', anchor);

      // 3. After tile finishes expanding (600ms), open interior shell
      setTimeout(() => {
        gsap.fromTo(interior,
          { autoAlpha: 0, y: 40 },
          { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }
        );
        document.body.style.overflow = 'hidden';

        // Animate interior cards in with stagger
        setTimeout(() => revealInteriorCards(), 200);
      }, 650);
    }

    function closeInterior() {
      gsap.to(interior, {
        autoAlpha: 0, y: 40,
        duration: 0.35, ease: 'power2.in',
        onComplete: () => {
          interiorPages.forEach(p => p.classList.remove('active'));

          // Remove enlarge from all tiles
          document.querySelectorAll('.jx-tile.enlarge').forEach(t => {
            t.classList.remove('enlarge', 'anchor-tl', 'anchor-tr', 'anchor-bl', 'anchor-br');
          });
          hub.classList.remove('has-enlarged');
          document.body.style.overflow = '';
          ScrollTrigger.refresh();
        }
      });
    }

    function revealInteriorCards() {
      const cards = document.querySelectorAll('.interior-page.active .int-card');
      cards.forEach((card, i) => {
        setTimeout(() => card.classList.add('revealed'), i * 80);
      });
    }
  }

  /* Corner anchor based on tile id */
  function layout_anchor_for(id) {
    const map = {
      'tile-origin':       'anchor-tl',
      'tile-philosophy':   'anchor-tr',
      'tile-arsenal':      'anchor-bl',
      'tile-transmission': 'anchor-br',
    };
    return map[id] || 'anchor-tl';
  }


  /* ─── Mobile: Simple static tiles, no assembly ─── */
  function initMobile() {
    initRouting();

    // Show all tiles immediately
    document.querySelectorAll('.jx-tile-content').forEach(t => {
      gsap.set(t, { opacity: 1, visibility: 'visible' });
    });

    // Still do the JX logo trace on mobile
    const paths = document.querySelectorAll('.jx-path');
    paths.forEach(path => {
      try {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, fill: 'transparent' });
      } catch(e) {}
    });

    gsap.timeline({ delay: 0.3 })
      .to(paths, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.15 })
      .to(paths, { fill: '#00FF41', stroke: 'transparent', duration: 0.3, ease: 'power1.in' }, '-=0.1');
  }


  /* ─── Wait for Supabase Client ─── */
  function waitForSupabase(cb, attempts = 0) {
    if (window.jxSupabase) { cb(window.jxSupabase); return; }
    if (window.supabaseClient) { window.jxSupabase = window.supabaseClient; cb(window.jxSupabase); return; }
    if (attempts > 100) { console.warn('[JX About] Supabase timeout'); return; }
    setTimeout(() => waitForSupabase(cb, attempts + 1), 50);
  }

  /* ─── Supabase Data ─── */
  async function loadOriginChapters(db) {
    const container = document.getElementById('origin-grid');
    if (!container) return;

    // Supabase table 'origin_chapters' doesn't exist, using static original content
    const data = [
      {
        chapter_order: '01',
        title: 'Born to Create',
        content: 'Before code, before computers, there was art. A younger Okezie who wanted to draw, who taught himself by tracing, line by line, character by character. Physics class became a love affair: technical drawing, architectural plans, the geometry of the perfect building. I wanted to design world-class structures. Not just buildings, experiences that people would walk into and feel something.'
      },
      {
        chapter_order: '02',
        title: 'Then I Found Computers',
        content: 'A machine that could do anything. I was fascinated, not just by what it could do, but by how it worked. So I learned. First as a student, watching everything. Then under a computer technician, hands inside machines, wires and circuits making sense where they hadn\'t before. I wasn\'t just using computers anymore. I was building with them.'
      },
      {
        chapter_order: '03',
        title: 'Digital Creations & Animation',
        content: 'My passion for drawing never left me. It evolved. I transitioned from pencil and paper to becoming a digital artist, creating cartoon pictures directly on my phone and sharing my creations with the world. This was my digital playground, and it sparked my desire to go into animation—bringing those static cartoon frames to life through motion and code.'
      },
      {
        chapter_order: '04',
        title: 'JX',
        content: 'All these paths—the artist, the computer technician, the architect, the digital creator—converged into a single identity: JX. It was coined because I wanted to showcase myself—my true self. I wanted to show people who I am, what I can do, provide exceptional services, and grow immensely. JX is my identity. It is the culmination of every pixel drawn, every system built, and every world designed.'
      },
      {
        chapter_order: '05',
        title: 'A Language of My Own',
        content: 'The gold and the scattered marks across this site aren\'t trend — they\'re intentional. I built them myself, without copying any existing script, but they carry the same instinct my Igbo ancestors had for turning meaning into symbol. Most of what "design" means online today traces back to Europe, Japan, the U.S. I wanted something that traced back to me. This is what that looks like.'
      }
    ];

    container.innerHTML = '';
    const imgs = ['assets/images/okezie-1.webp', 'assets/images/okezie-coder.webp', 'assets/images/okezie-designer.webp'];
    let imgIdx = 0;

    data.forEach((ch, i) => {
      const card = document.createElement('div');
      card.className = 'int-card';
      card.innerHTML = `<p class="card-label">Chapter ${esc(ch.chapter_order)}</p><h3>${esc(ch.title)}</h3><p>${esc(ch.content)}</p>`;
      container.appendChild(card);

      if ((i + 1) % 2 === 0 && imgIdx < imgs.length) {
        const imgCard = document.createElement('div');
        imgCard.className = 'int-card int-card-img';
        imgCard.innerHTML = `<img src="${imgs[imgIdx]}" alt="Chapter visual" loading="lazy">`;
        container.appendChild(imgCard);
        imgIdx++;
      }
    });
  }

  async function loadArsenal(db) {
    const tGrid = document.getElementById('arsenal-grid');
    const lGrid = document.getElementById('logo-grid');

    if (tGrid) {
      try {
        const { data, error } = await db
          .from('experience').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        if (data && data.length) {
          tGrid.innerHTML = '';
          data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'int-card';
            card.innerHTML = `<p class="card-label">${esc(item.role_title)} // ${esc(item.date_range)}</p><h3>${esc(item.company)}</h3><p>${esc(item.description)}</p>`;
            tGrid.appendChild(card);
          });
        } else {
          tGrid.innerHTML = '<p class="load-text">Experience vault coming soon.</p>';
        }
      } catch(e) {
        console.error('[JX About] Arsenal:', e);
        tGrid.innerHTML = '<p class="load-text">Failed to load experience.</p>';
      }
    }

    if (lGrid) {
      lGrid.innerHTML = '<p class="load-text">Roster coming soon.</p>';
    }
  }

  function initVideo() {
    const v = document.getElementById('int-video');
    if (v) { v.src = 'assets/videos/hero_video.mp4'; v.load(); }
  }

  function esc(str) {
    if (typeof str !== 'string') return String(str || '');
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ─── Boot ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForGsap(init));
  } else {
    waitForGsap(init);
  }

  // Load Supabase data — wait for client to be ready
  document.addEventListener('DOMContentLoaded', () => {
    waitForSupabase(db => {
      loadOriginChapters(db);
      loadArsenal(db);
    });
    initVideo();
  });

})();

