/**
 * ABOUT PAGE — JX HYBRID BENTO ENGINE v6.0 FINAL
 *
 * Sequence:
 * 1. Page loads → body overflow:hidden, content cells invisible
 * 2. Entry: Gridlines shoot across screen (blueprint draw)
 * 3. Entry: JX logo strokes trace, then fill solid green with glow
 * 4. Scroll unlocked → user scrolls through 300vh pin wrapper
 * 5. Scroll: hero JX cell scales from 2x down to 1x
 * 6. Scroll: content cells fade+slide up from below into position
 * 7. Interactive: Magnetic parallax on mousemove per cell
 * 8. Click cell → smooth interior view opens (no modals)
 * 9. Back button → closes interior, restores grid scroll
 */

(function () {
  'use strict';

  /* ─────────────────── 0. WAIT FOR GSAP ─────────────────── */
  function init() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      setTimeout(init, 50);
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    setupPage();
  }

  function setupPage() {
    /* ─── References ─── */
    const heroCell    = document.querySelector('.hero-cell');
    const contentCells = gsap.utils.toArray('.content-cell');
    const paths       = gsap.utils.toArray('.jx-path');
    const glH         = gsap.utils.toArray('.gl-h');
    const glV         = gsap.utils.toArray('.gl-v');
    const logoSvg     = document.querySelector('.logo-svg');
    const interiorView = document.getElementById('interior-view');
    const btnBack     = document.getElementById('btn-back-grid');
    const isMobile    = window.matchMedia('(max-width: 900px)').matches;

    if (!heroCell || !interiorView) return;

    /* ─────────────────── 1. INITIAL STATES ─────────────────── */
    // Lock scroll during entry animation
    document.body.style.overflow = 'hidden';

    // Content cells start pushed down and invisible
    if (!isMobile) {
      gsap.set(contentCells, { y: 120, autoAlpha: 0 });
      // Hero starts scaled up (fills the "full screen" feeling)
      gsap.set(heroCell, { scale: 2.2, transformOrigin: 'center center', zIndex: 10 });
    }

    // Set up SVG stroke animation
    paths.forEach(path => {
      try {
        const len = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: len,
          strokeDashoffset: len,
          fill: 'transparent'
        });
      } catch(e) {
        // SVG path length not available in some environments
      }
    });

    // Set gridlines to zero scale
    gsap.set(glH, { scaleX: 0, transformOrigin: 'left center' });
    gsap.set(glV, { scaleY: 0, transformOrigin: 'top center' });

    /* ─────────────────── 2. ENTRY ANIMATION ─────────────────── */
    const entryTL = gsap.timeline({
      delay: 0.2,
      onComplete: unlockAndActivateScroll
    });

    // 2a. Horizontal lines shoot left→right
    entryTL.to(glH, {
      scaleX: 1,
      duration: 0.9,
      ease: 'power3.inOut',
      stagger: { each: 0.08, from: 'start' }
    }, 0);

    // 2b. Vertical lines shoot top→down (overlapping with horizontals)
    entryTL.to(glV, {
      scaleY: 1,
      duration: 0.9,
      ease: 'power3.inOut',
      stagger: { each: 0.06, from: 'start' }
    }, 0.15);

    // 2c. Trace JX strokes
    entryTL.to(paths, {
      strokeDashoffset: 0,
      duration: 1.4,
      ease: 'power2.inOut',
      stagger: 0.15
    }, '-=0.3');

    // 2d. Flash fill: strokes → solid green
    entryTL.to(paths, {
      fill: '#00FF41',
      stroke: 'transparent',
      duration: 0.4,
      ease: 'power1.in'
    }, '-=0.15');

    // 2e. Logo glow pulse
    entryTL.to(logoSvg, {
      filter: 'drop-shadow(0 0 18px rgba(0,255,65,0.5))',
      duration: 0.4,
      yoyo: true,
      repeat: 1
    }, '-=0.2');

    // 2f. Fade gridlines out (they served their purpose)
    entryTL.to([glH, glV], {
      opacity: 0,
      duration: 0.5,
      ease: 'power1.in'
    }, '-=0.3');

    /* ─────────────────── 3. UNLOCK + SCROLL ASSEMBLY ─────────────────── */
    function unlockAndActivateScroll() {
      document.body.style.overflow = '';
      ScrollTrigger.refresh();

      if (isMobile) return; // Mobile shows all cells statically

      /* ScrollTrigger uses sticky positioning on .dbx-grid-container
         The pin-wrapper is 300vh tall, so user scrolls 200vh worth of
         distance while the grid container stays "stuck" at top:0 */
      const scrollTL = gsap.timeline({
        scrollTrigger: {
          trigger: '.dbx-pin-wrapper',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2,
        }
      });

      // Hero shrinks from 2.2x → 1x as user scrolls
      scrollTL.to(heroCell, {
        scale: 1,
        duration: 1,
        ease: 'power2.out'
      }, 0);

      // Content cells slide up from below into their grid positions
      scrollTL.to(contentCells, {
        y: 0,
        autoAlpha: 1,
        duration: 0.8,
        stagger: { each: 0.07, from: 'start' },
        ease: 'power2.out'
      }, 0.1);
    }

    /* ─────────────────── 4. MAGNETIC PARALLAX HOVER ─────────────────── */
    if (!isMobile) {
      contentCells.forEach(cell => {
        const bg     = cell.querySelector('.cell-bg');
        const symbol = cell.querySelector('.cell-symbol');

        cell.addEventListener('mousemove', e => {
          const r    = cell.getBoundingClientRect();
          const xPct = ((e.clientX - r.left) / r.width  - 0.5) * 2; // -1 to +1
          const yPct = ((e.clientY - r.top)  / r.height - 0.5) * 2;

          if (bg) {
            gsap.to(bg, {
              x: xPct * -18,
              y: yPct * -18,
              duration: 0.5,
              ease: 'power2.out',
              overwrite: 'auto'
            });
          }
          if (symbol) {
            gsap.to(symbol, {
              x: xPct * -35,
              y: yPct * -35,
              duration: 0.35,
              ease: 'power2.out',
              overwrite: 'auto'
            });
          }
        });

        cell.addEventListener('mouseleave', () => {
          if (bg)     gsap.to(bg,     { x: 0, y: 0, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
          if (symbol) gsap.to(symbol, { x: 0, y: 0, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
        });
      });
    }

    /* ─────────────────── 5. INTERIOR ROUTING ─────────────────── */
    const interiorPages = document.querySelectorAll('.interior-page');

    contentCells.forEach(cell => {
      cell.addEventListener('click', () => {
        const route = cell.getAttribute('data-route');
        if (route) openInterior(route);
      });
    });

    if (btnBack) {
      btnBack.addEventListener('click', closeInterior);
    }

    function openInterior(route) {
      // Show correct page
      interiorPages.forEach(p => p.classList.remove('active'));
      const target = document.getElementById('page-' + route);
      if (target) target.classList.add('active');

      // Reset interior scroll to top
      interiorView.scrollTop = 0;

      // Animate in
      gsap.fromTo(interiorView,
        { autoAlpha: 0, y: 60 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' }
      );

      // Prevent background scroll
      document.body.style.overflow = 'hidden';
    }

    function closeInterior() {
      gsap.to(interiorView, {
        autoAlpha: 0,
        y: 60,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => {
          interiorPages.forEach(p => p.classList.remove('active'));
          document.body.style.overflow = '';
          // Refresh ScrollTrigger after DOM change
          ScrollTrigger.refresh();
        }
      });
    }

    /* ─────────────────── 6. SUPABASE DATA ─────────────────── */
    loadOriginChapters();
    loadArsenalData();
    initTransmissionVideo();
  }

  /* ─── Origin Chapters ─── */
  async function loadOriginChapters() {
    const container = document.getElementById('origin-editorial');
    if (!container) return;

    if (!window.jxSupabase) {
      container.innerHTML = '<div class="ed-text-block"><p class="ed-label">Connection</p><p>Supabase not loaded.</p></div>';
      return;
    }

    try {
      const { data, error } = await window.jxSupabase
        .from('origin_chapters')
        .select('*')
        .order('chapter_order', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) {
        container.innerHTML = '<div class="ed-text-block"><p>No chapters found yet.</p></div>';
        return;
      }

      container.innerHTML = '';

      const editorialImages = [
        'assets/images/okezie-1.webp',
        'assets/images/okezie-coder.webp',
        'assets/images/okezie-designer.webp'
      ];
      let imgIdx = 0;

      data.forEach((ch, i) => {
        // Text card
        const textBlock = document.createElement('div');
        textBlock.className = 'ed-text-block';
        textBlock.innerHTML = `
          <p class="ed-label">Chapter ${ch.chapter_order}</p>
          <h3>${escHtml(ch.title)}</h3>
          <p>${escHtml(ch.content)}</p>
        `;
        container.appendChild(textBlock);

        // Interleave an editorial image every 2 chapters
        if ((i + 1) % 2 === 0 && imgIdx < editorialImages.length) {
          const imgBlock = document.createElement('div');
          imgBlock.className = 'ed-image-block';
          imgBlock.innerHTML = `<img src="${editorialImages[imgIdx]}" alt="Chapter visual" loading="lazy">`;
          container.appendChild(imgBlock);
          imgIdx++;
        }
      });
    } catch (err) {
      console.error('[About] Origin chapters error:', err);
    }
  }

  /* ─── Arsenal Timeline + Logos ─── */
  async function loadArsenalData() {
    const timeline = document.getElementById('arsenal-timeline');
    const logos    = document.getElementById('company-logos-container');

    if (!timeline || !window.jxSupabase) return;

    // Experience timeline
    try {
      const { data, error } = await window.jxSupabase
        .from('experience')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        timeline.innerHTML = '';
        data.forEach(item => {
          const card = document.createElement('div');
          card.className = 'ed-text-block';
          card.innerHTML = `
            <p class="ed-label">${escHtml(item.role || '')} // ${escHtml(item.start_date || '')}</p>
            <h3>${escHtml(item.company || '')}</h3>
            <p>${escHtml(item.description || '')}</p>
          `;
          timeline.appendChild(card);
        });
      }
    } catch (e) {
      console.error('[About] Arsenal experience error:', e);
    }

    // Company logos
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
              <img src="${escHtml(logo.image_url)}" alt="${escHtml(logo.name || 'Client')}" loading="lazy">
            </div>
          `;
        });
      } else {
        logos.innerHTML = '<p class="loading-text">Roster loading soon.</p>';
      }
    } catch (e) {
      logos.innerHTML = '<p class="loading-text">Logo vault initialising...</p>';
    }
  }

  /* ─── Transmission Video ─── */
  function initTransmissionVideo() {
    const vid = document.getElementById('intro-video');
    if (!vid) return;
    vid.src = 'assets/videos/hero_video.mp4';
    vid.load();
  }

  /* ─── Utility ─── */
  function escHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ─── Boot ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
