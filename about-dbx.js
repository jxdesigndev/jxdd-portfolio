/**
 * ABOUT PAGE — JX BENTO HUB ENGINE v8.0
 *
 * Exact mechanic mirror of brand.dropbox.com:
 *
 * 1. GRIDLINES animate in (scaleX/Y) before tiles appear
 * 2. ENTRY: JX SVG draws (stroke-dashoffset), fills green, border lines animate
 * 3. LOGO: starts at scale(logoScale) centered in viewport
 * 4. SCATTER: content tiles start at scale(2) + translated off-screen
 * 5. SCROLL ASSEMBLY: ScrollTrigger scrubs all tiles to scale(1) x:0 y:0
 * 6. HOVER: magnetic parallax on .tile-bg + .tile-symbol
 * 7. CLICK: .opening class (title scale-4x), then .enlarge (full 100vw/vh)
 *           → other tiles fade → interior shell fades in
 * 8. INTERIOR: scroll reveals cards, scroll progress bar updates
 * 9. BACK: close interior → hub restores, ScrollTrigger refreshed
 * 10. DATA: Supabase loads experience → exp-timeline, tools → tools-grid,
 *           site_settings.about_video_url → Transmission video
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

  /* ─── Tile Layout ─── */
  // Produces:  [Origin] [   Logo Center   ] [Philosophy]
  //            [  Arsenal wide   ] [Transmission wide  ]
  function getTileLayout() {
    const GAP = 10;
    const NAV = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;
    const W   = window.innerWidth;
    const H   = window.innerHeight - NAV;
    const COL = (W - GAP * 3) / 4;
    const R1  = (H - GAP) * 0.55;
    const R2  = (H - GAP) * 0.45;

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

  function applyLayout(layout) {
    const set = (id, pos) => {
      const el = document.getElementById(id);
      if (!el) return;
      Object.assign(el.style, {
        left:   pos.left   + 'px',
        top:    pos.top    + 'px',
        width:  pos.width  + 'px',
        height: pos.height + 'px',
      });
    };
    set('tile-logo',         layout.logo);
    set('tile-origin',       layout.origin);
    set('tile-philosophy',   layout.philosophy);
    set('tile-arsenal',      layout.arsenal);
    set('tile-transmission', layout.transmission);
  }

  /* ─── Main Init ─── */
  let globalLayout = null;

  function init() {
    gsap.registerPlugin(ScrollTrigger);

    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    if (isMobile) {
      initMobile();
      return;
    }

    /* 1. Layout */
    const layout = getTileLayout();
    globalLayout = layout;
    applyLayout(layout);

    const hub          = document.getElementById('jx-hub');
    const logoTile     = document.getElementById('tile-logo');
    const contentTiles = document.querySelectorAll('.jx-tile-content');
    const gridlines    = document.getElementById('hub-gridlines');

    hub.classList.add('assembling');

    /* 2. Scatter positions — tiles start at scale(2) + off-screen */
    const YEET = Math.max(window.innerWidth, window.innerHeight) * 0.5;
    const yeetMap = {
      'tile-origin':       { x: -YEET, y: -YEET * 0.8 },
      'tile-philosophy':   { x:  YEET, y: -YEET * 0.8 },
      'tile-arsenal':      { x: -YEET, y:  YEET * 0.8 },
      'tile-transmission': { x:  YEET, y:  YEET * 0.8 },
    };

    contentTiles.forEach(tile => {
      const offset = yeetMap[tile.id] || { x: 0, y: 0 };
      gsap.set(tile, { scale: 2, x: offset.x, y: offset.y, autoAlpha: 0, transformOrigin: 'center center' });
    });

    /* 3. Logo: compute offset so SCALED logo appears centered in viewport */
    const tileCX  = layout.logo.left + layout.logo.width  / 2;
    const tileCY  = layout.logo.top  + layout.logo.height / 2;
    const vpCX    = window.innerWidth  / 2;
    const vpCY    = (window.innerHeight - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80)) / 2;
    const logoDX  = vpCX - tileCX;
    const logoDY  = vpCY - tileCY;
    const logoScale = Math.min(
      (window.innerWidth  * 0.85) / layout.logo.width,
      ((window.innerHeight - 80) * 0.82) / layout.logo.height
    );

    gsap.set(logoTile, { x: logoDX, y: logoDY, scale: logoScale, transformOrigin: 'center center', zIndex: 100 });

    /* 4. Gridlines start hidden */
    gsap.set('.gl-v, .gl-h', { scaleX: 0, scaleY: 0 });
    gsap.set(gridlines, { opacity: 0 });

    /* 5. JX SVG stroke setup */
    const paths = document.querySelectorAll('.jx-path');
    paths.forEach(path => {
      try {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, fill: 'transparent' });
      } catch (e) {}
    });

    /* 6. Lock scroll during entry */
    document.body.style.overflow = 'hidden';

    /* 7. Entry timeline */
    const entry = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = '';
        hub.classList.remove('assembling');
        ScrollTrigger.refresh();
        initScrollAssembly(layout);
        initScrollProgress();
      }
    });

    // 7a. Gridlines draw in
    entry.to(gridlines, { opacity: 1, duration: 0.3 }, 0);
    entry.to('.gl-v', { scaleY: 1, duration: 0.8, ease: 'power3.inOut', stagger: 0.08 }, 0.1);
    entry.to('.gl-h', { scaleX: 1, duration: 0.8, ease: 'power3.inOut', stagger: 0.06 }, 0.2);

    // 7b. Logo tile border lines
    const logoLines = logoTile.querySelectorAll('.tile-line');
    entry.to(logoLines, { scaleX: 1, scaleY: 1, duration: 0.7, ease: 'power3.inOut', stagger: 0.05 }, 0.4);

    // 7c. JX SVG stroke draw
    entry.to(paths, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.15 }, 0.6);

    // 7d. Fill solid green + glow pulse
    entry.to(paths, { fill: '#00FF41', stroke: 'transparent', duration: 0.35, ease: 'power1.in' }, '-=0.1');
    entry.to('.jx-logo-svg', { filter: 'drop-shadow(0 0 22px rgba(0,255,65,0.5))', duration: 0.35, yoyo: true, repeat: 1 }, '-=0.25');

    // 7e. Tagline fade in
    entry.fromTo('.jx-tagline', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, '-=0.2');

    // 7f. Gridlines fade to very subtle after they animate
    entry.to(gridlines, { opacity: 0.5, duration: 0.5 }, '-=0.3');

    /* 8. Routing */
    initRouting(hub, layout);

    /* 9. Magnetic parallax hover */
    contentTiles.forEach(tile => {
      const bg     = tile.querySelector('.tile-bg');
      const symbol = tile.querySelector('.tile-symbol');

      tile.addEventListener('mousemove', e => {
        const r    = tile.getBoundingClientRect();
        const xPct = ((e.clientX - r.left) / r.width  - 0.5) * 2;
        const yPct = ((e.clientY - r.top)  / r.height - 0.5) * 2;
        if (bg)     gsap.to(bg,     { x: xPct * -18, y: yPct * -18, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
        if (symbol) gsap.to(symbol, { x: xPct * -35, y: yPct * -35, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
      });
      tile.addEventListener('mouseleave', () => {
        if (bg)     gsap.to(bg,     { x: 0, y: 0, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
        if (symbol) gsap.to(symbol, { x: 0, y: 0, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
      });
    });

    /* 10. Keyboard navigation */
    contentTiles.forEach(tile => {
      tile.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tile.click();
        }
      });
    });

    /* 11. Resize handler */
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newLayout = getTileLayout();
        globalLayout = newLayout;
        applyLayout(newLayout);
        ScrollTrigger.refresh();
      }, 200);
    });
  }

  /* ─── Scroll Assembly ─── */
  function initScrollAssembly(layout) {
    const hub       = document.getElementById('jx-hub');
    const logoTile  = document.getElementById('tile-logo');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.documentElement,
        start:   'top top',
        end:     '+=220vh',
        scrub:   1.2,
      }
    });

    // Logo shrinks from centered-fullscreen → grid slot
    tl.to(logoTile, { scale: 1, x: 0, y: 0, duration: 1, ease: 'power2.inOut', zIndex: 10 }, 0);

    // Content tiles fly in from corners
    tl.to('#tile-origin',       { scale: 1, x: 0, y: 0, autoAlpha: 1, duration: 1, ease: 'power2.out' }, 0.05);
    tl.to('#tile-philosophy',   { scale: 1, x: 0, y: 0, autoAlpha: 1, duration: 1, ease: 'power2.out' }, 0.10);
    tl.to('#tile-arsenal',      { scale: 1, x: 0, y: 0, autoAlpha: 1, duration: 1, ease: 'power2.out' }, 0.15);
    tl.to('#tile-transmission', { scale: 1, x: 0, y: 0, autoAlpha: 1, duration: 1, ease: 'power2.out' }, 0.18);

    // Border lines draw on content tiles as they arrive
    tl.to('.jx-tile-content .tile-line', { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'power2.inOut', stagger: 0.015 }, 0.5);

    // Scroll hint fades out
    tl.to('#scroll-hint', { autoAlpha: 0, duration: 0.3 }, 0);

    // Scroll progress bar grows
    tl.to('#scroll-progress-bar', {
      height: '100%',
      ease: 'none',
      duration: 1,
    }, 0);
  }

  /* ─── Hub scroll progress bar ─── */
  function initScrollProgress() {
    const bar = document.getElementById('scroll-progress-bar');
    if (!bar) return;
    // ScrollTrigger handles it via the timeline, nothing extra needed here
  }

  /* ─── Routing ─── */
  function initRouting(hub, layout) {
    if (!hub) hub = document.getElementById('jx-hub');
    const interior  = document.getElementById('interior-shell');
    const btnBack   = document.getElementById('btn-back');
    const pages     = document.querySelectorAll('.interior-page');

    const anchorMap = {
      'tile-origin':       'anchor-tl',
      'tile-philosophy':   'anchor-tr',
      'tile-arsenal':      'anchor-bl',
      'tile-transmission': 'anchor-br',
    };

    document.querySelectorAll('.jx-tile-content').forEach(tile => {
      tile.addEventListener('click', () => {
        if (hub.classList.contains('has-enlarged')) return;
        const route = tile.getAttribute('data-route');
        if (route) openInterior(tile, route);
      });
    });

    if (btnBack) btnBack.addEventListener('click', closeInterior);

    function openInterior(tile, route) {
      const anchor = anchorMap[tile.id] || 'anchor-tl';

      // Show target page
      pages.forEach(p => p.classList.remove('active'));
      const target = document.getElementById('page-' + route);
      if (target) target.classList.add('active');

      // Add opening class (title scale-4x, Dropbox mechanic)
      tile.classList.add('opening');

      // After 150ms add enlarge
      setTimeout(() => {
        hub.classList.add('has-enlarged');
        tile.classList.add('enlarge', anchor);
      }, 150);

      // After expansion, show interior
      setTimeout(() => {
        interior.scrollTop = 0;
        gsap.fromTo(interior,
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' }
        );
        document.body.style.overflow = 'hidden';

        // Reveal interior cards after brief delay
        setTimeout(revealCards, 300);
        initInteriorScrollProgress();
      }, 750);
    }

    function closeInterior() {
      gsap.to(interior, {
        autoAlpha: 0,
        y: 30,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          pages.forEach(p => p.classList.remove('active'));
          document.querySelectorAll('.jx-tile.enlarge').forEach(t => {
            t.classList.remove('enlarge', 'opening', 'anchor-tl', 'anchor-tr', 'anchor-bl', 'anchor-br');
          });
          hub.classList.remove('has-enlarged');
          document.body.style.overflow = '';
          ScrollTrigger.refresh();
        }
      });
    }

    function revealCards() {
      const activePage = document.querySelector('.interior-page.active');
      if (!activePage) return;

      const items = activePage.querySelectorAll(
        '.chapter-card, .chapter-card-img, .phil-card, .exp-item, .tool-card'
      );
      items.forEach((el, i) => {
        setTimeout(() => el.classList.add('revealed'), i * 60);
      });
    }
  }

  /* ─── Interior scroll progress bar ─── */
  function initInteriorScrollProgress() {
    const shell = document.getElementById('interior-shell');
    const bar   = document.getElementById('int-scroll-bar');
    if (!shell || !bar) return;

    const onScroll = () => {
      const scrollable = shell.scrollHeight - shell.clientHeight;
      if (scrollable <= 0) { bar.style.width = '100%'; return; }
      const pct = (shell.scrollTop / scrollable) * 100;
      bar.style.width = pct + '%';
    };

    shell.removeEventListener('scroll', shell._intScrollHandler);
    shell._intScrollHandler = onScroll;
    shell.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ─── Mobile ─── */
  function initMobile() {
    const paths = document.querySelectorAll('.jx-path');
    paths.forEach(path => {
      try {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, fill: 'transparent' });
      } catch (e) {}
    });

    gsap.timeline({ delay: 0.3 })
      .to(paths, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.15 })
      .to(paths, { fill: '#00FF41', stroke: 'transparent', duration: 0.3, ease: 'power1.in' }, '-=0.1');

    document.querySelectorAll('.jx-tile-content').forEach(t => {
      gsap.set(t, { opacity: 1, visibility: 'visible' });
    });

    initRouting(document.getElementById('jx-hub'), null);

    document.querySelectorAll('.jx-tile-content').forEach(tile => {
      tile.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tile.click(); }
      });
    });
  }

  /* ─── XSS-safe string escaping ─── */
  function esc(str) {
    if (typeof str !== 'string') return String(str || '');
    return str
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#39;');
  }

  /* ─── Wait for Supabase client ─── */
  function waitForSupabase(cb, attempts = 0) {
    if (window.jxSupabase)      { cb(window.jxSupabase); return; }
    if (window.supabaseClient)  { window.jxSupabase = window.supabaseClient; cb(window.jxSupabase); return; }
    if (attempts > 120) { console.warn('[JX About] Supabase timeout — using static fallbacks'); loadStaticFallbacks(); return; }
    setTimeout(() => waitForSupabase(cb, attempts + 1), 50);
  }

  /* ─── Static fallback data (if Supabase unavailable) ─── */
  function loadStaticFallbacks() {
    buildOriginGrid(staticOriginData());
    buildArsenalGrid([
      { role_title: 'Product Designer', company: 'Bill Station', date_range: '2025 – Present', description: 'Leading product design and design-system infrastructure for a live fintech product.' },
      { role_title: 'Founder & Creative Technologist', company: 'JX LABS', date_range: '2023 – Present', description: 'Delivered 10+ MVPs, SaaS dashboards, fintech products across 5 countries.' },
    ]);
  }

  /* ─── Static origin data (table does not exist in Supabase) ─── */
  function staticOriginData() {
    return [
      { chapter_order: '01', era: 'The Early Years', title: 'Born to Create', content: 'Before code, before computers, there was art. A younger Okezie who wanted to draw, who taught himself by tracing, line by line, character by character. Physics class became a love affair: technical drawing, architectural plans, the geometry of the perfect building. I wanted to design world-class structures — not just buildings, experiences that people would walk into and feel something.' },
      { chapter_order: '02', era: 'The Discovery', title: 'Then I Found Computers', content: 'A machine that could do anything. I was fascinated — not just by what it could do, but by how it worked. So I learned. First as a student, watching everything. Then under a computer technician, hands inside machines, wires and circuits making sense where they hadn\'t before. I wasn\'t just using computers anymore. I was building with them.' },
      { chapter_order: '03', era: 'The Canvas', title: 'Digital Creations & Animation', content: 'My passion for drawing never left me. It evolved. I transitioned from pencil and paper to becoming a digital artist — creating cartoon pictures directly on my phone and sharing my creations with the world. This was my digital playground, and it sparked my desire to go into animation: bringing those static cartoon frames to life through motion and code.' },
      { chapter_order: '04', era: 'The Convergence', title: 'JX', content: 'All these paths — the artist, the computer technician, the architect, the digital creator — converged into a single identity: JX. It was coined because I wanted to showcase myself. My true self. I wanted to show people who I am, what I can do, provide exceptional services, and grow immensely. JX is my identity. It is the culmination of every pixel drawn, every system built, and every world designed.' },
      { chapter_order: '05', era: 'The Present', title: 'A Language of My Own', content: 'The neon green and the scattered marks across this site aren\'t trend — they\'re intentional. I built them myself, without copying any existing script, but they carry the same instinct my Igbo ancestors had for turning meaning into symbol. Most of what "design" means online today traces back to Europe, Japan, the U.S. I wanted something that traced back to me. This is what that looks like.' },
    ];
  }

  /* ─── Build Origin chapter grid ─── */
  function buildOriginGrid(data) {
    const container = document.getElementById('origin-grid');
    if (!container) return;

    container.innerHTML = '';
    const imgs = [
      'assets/images/okezie-1.webp',
      'assets/images/okezie-coder.webp',
      'assets/images/okezie-designer.webp',
    ];
    let imgIdx = 0;

    data.forEach((ch, i) => {
      // Text card
      const card = document.createElement('div');
      card.className = 'chapter-card';
      card.innerHTML = `
        <p class="chapter-num">Chapter ${esc(ch.chapter_order)}</p>
        <p class="chapter-era">${esc(ch.era || '')}</p>
        <h3>${esc(ch.title)}</h3>
        <p>${esc(ch.content)}</p>
      `;
      container.appendChild(card);

      // Insert photo card after every 2nd chapter
      if ((i + 1) % 2 === 0 && imgIdx < imgs.length) {
        const imgCard = document.createElement('div');
        imgCard.className = 'chapter-card-img';
        imgCard.innerHTML = `<img src="${imgs[imgIdx]}" alt="Chapter ${ch.chapter_order} visual" loading="lazy">`;
        container.appendChild(imgCard);
        imgIdx++;
      }
    });
  }

  /* ─── Build Arsenal experience timeline ─── */
  function buildArsenalGrid(data) {
    const grid = document.getElementById('arsenal-grid');
    if (!grid) return;

    grid.innerHTML = '';
    data.forEach(item => {
      const el = document.createElement('div');
      el.className = 'exp-item';
      el.innerHTML = `
        <div class="exp-meta">
          <span class="exp-date">${esc(item.date_range)}</span>
          <span class="exp-company">${esc(item.company)}</span>
        </div>
        <div class="exp-content">
          <h3 class="exp-role">${esc(item.role_title)}</h3>
          <p class="exp-desc">${esc(item.description || '')}</p>
        </div>
      `;
      grid.appendChild(el);
    });
  }

  /* ─── Build Tools grid ─── */
  function buildToolsGrid(data) {
    const grid = document.getElementById('tools-grid');
    if (!grid) return;

    grid.innerHTML = '';
    data.forEach(tool => {
      const el = document.createElement('div');
      el.className = 'tool-card';
      el.innerHTML = tool.logo_url
        ? `<img src="${esc(tool.logo_url)}" alt="${esc(tool.name)}" loading="lazy"><span class="tool-name">${esc(tool.name)}</span>`
        : `<span class="tool-name">${esc(tool.name)}</span>`;
      grid.appendChild(el);
    });
  }

  /* ─── Load Supabase data ─── */
  async function loadData(db) {
    // Origin chapters (static — table doesn't exist in Supabase)
    buildOriginGrid(staticOriginData());

    // Experience
    try {
      const { data, error } = await db
        .from('experience')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      if (data && data.length) {
        buildArsenalGrid(data);
      } else {
        document.getElementById('arsenal-grid').innerHTML =
          '<div class="ars-loading">Experience vault loading soon.</div>';
      }
    } catch (e) {
      console.error('[JX About] Experience:', e);
      buildArsenalGrid([
        { role_title: 'Product Designer', company: 'Bill Station', date_range: '2025 – Present', description: 'Leading product design and design-system infrastructure for a live fintech product.' },
        { role_title: 'Founder & Creative Technologist', company: 'JX LABS', date_range: '2023 – Present', description: 'Delivered 10+ MVPs, SaaS dashboards, fintech products across 5 countries.' },
      ]);
    }

    // Tools
    try {
      const { data, error } = await db
        .from('tools')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      if (data && data.length) {
        buildToolsGrid(data);
      } else {
        document.getElementById('tools-grid').innerHTML =
          '<div class="ars-loading">Arsenal loading soon.</div>';
      }
    } catch (e) {
      console.error('[JX About] Tools:', e);
      document.getElementById('tools-grid').innerHTML =
        '<div class="ars-loading">Arsenal loading soon.</div>';
    }

    // Transmission video from site_settings
    try {
      const { data, error } = await db
        .from('site_settings')
        .select('value')
        .eq('key', 'about_video_url')
        .single();

      const vid = document.getElementById('int-video');
      const placeholder = document.getElementById('video-placeholder');

      if (!error && data && data.value && vid) {
        vid.src = data.value;
        vid.load();
        if (placeholder) placeholder.classList.add('hidden');
      }
    } catch (e) {
      console.warn('[JX About] Video:', e);
    }
  }

  /* ─── Boot ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForGsap(init));
  } else {
    waitForGsap(init);
  }

  document.addEventListener('DOMContentLoaded', () => {
    waitForSupabase(loadData);
  });

})();
