/* ================================================================
   JX UNIVERSE — nav.js v3.0
   Shared Navigation + Consciousness Shift Transitions
   ================================================================ */

'use strict';

(function () {

  /* ────────────────────────────────────────────────────────────────
     CONFIG
     ──────────────────────────────────────────────────────────────── */
  const NAV_LINKS = [
    { href: 'index.html',    label: 'Home' },
    { href: 'about.html',   label: 'About' },
    { href: 'work.html',    label: 'Work' },
    { href: 'services.html',label: 'Services' },
    { href: 'contact.html', label: 'Contact' },
  ];

  const JX_LOGO_SVG = `
    <svg class="nav-logo" viewBox="0 0 72 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path class="jx-j"  d="M8 2H22V22Q22 30 14 30Q6 30 6 22"/>
      <path class="jx-x1" d="M36 2L60 30"/>
      <path class="jx-x2" d="M60 2L36 30"/>
    </svg>`;

  const JX_LOGO_LARGE_SVG = `
    <svg viewBox="0 0 120 54" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path class="jx-stroke jx-j"  d="M14 4H38V38Q38 52 24 52Q10 52 10 38"/>
      <path class="jx-stroke jx-x1" d="M58 4L104 52"/>
      <path class="jx-stroke jx-x2" d="M104 4L58 52"/>
    </svg>`;

  /* ────────────────────────────────────────────────────────────────
     DETECT ACTIVE PAGE
     ──────────────────────────────────────────────────────────────── */
  function getActivePage () {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    return path;
  }

  /* ────────────────────────────────────────────────────────────────
     BUILD NAVIGATION HTML
     ──────────────────────────────────────────────────────────────── */
  function buildNav () {
    if (document.getElementById('nav')) return;
    const activePage = getActivePage();

    const linksHtml = NAV_LINKS.map(link => {
      const isActive = activePage === link.href ||
        (activePage === '' && link.href === 'index.html');
      return `<li>
        <a href="${link.href}" class="nav-link${isActive ? ' active' : ''}"
           data-nav-link>${link.label}</a>
      </li>`;
    }).join('');

    const mobileLinkHtml = NAV_LINKS.map(link =>
      `<a href="${link.href}" class="mobile-nav-link" data-nav-link>${link.label}</a>`
    ).join('');

    const nav = document.createElement('nav');
    nav.className = 'nav';
    nav.id = 'nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Main navigation');
    nav.innerHTML = `
      <a href="index.html" class="nav-brand" aria-label="JX Design & Dev — Home">
        ${JX_LOGO_SVG}
        <span class="nav-wordmark">JX</span>
      </a>

      <ul class="nav-links" role="list">
        ${linksHtml}
      </ul>

      <div class="nav-right">
        <div class="nav-availability" id="nav-availability">
          <div class="nav-dot" id="nav-dot"></div>
          <span class="nav-availability-text" id="nav-availability-text">Available</span>
        </div>
        <a href="contact.html" class="nav-cta" data-nav-link>Hire Me</a>
        <button class="nav-hamburger" id="nav-hamburger" aria-label="Toggle menu"
                aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    `;

    /* Mobile Menu */
    const mobile = document.createElement('div');
    mobile.className = 'mobile-menu';
    mobile.id = 'mobile-menu';
    mobile.setAttribute('aria-hidden', 'true');
    mobile.innerHTML = `
      <nav class="mobile-nav-links" role="list">
        ${mobileLinkHtml}
      </nav>
      <div class="mobile-menu-footer">
        <div class="mobile-menu-socials">
          <a href="https://twitter.com/jxdesigndev" target="_blank" rel="noopener"
             class="mobile-menu-social">Twitter</a>
          <a href="https://linkedin.com/in/jxdesigndev" target="_blank" rel="noopener"
             class="mobile-menu-social">LinkedIn</a>
          <a href="https://github.com/jxdesigndev" target="_blank" rel="noopener"
             class="mobile-menu-social">GitHub</a>
        </div>
        <p class="mobile-menu-location">Lagos, Nigeria · NGT UTC+01:00</p>
      </div>
    `;

    document.body.prepend(mobile);
    document.body.prepend(nav);
  }

  /* ────────────────────────────────────────────────────────────────
     BUILD CURSOR
     ──────────────────────────────────────────────────────────────── */
  function buildCursor () {
    if (document.querySelector('.cursor')) return;
    if (window.matchMedia('(hover: none)').matches) return; // no cursor on touch

    const dot  = document.createElement('div');
    const ring = document.createElement('div');
    dot.className  = 'cursor';
    ring.className = 'cursor-ring';
    ring.innerHTML = '<span class="ring-label"></span>';
    document.body.append(dot, ring);

    let mouseX = 0, mouseY = 0;
    let ringX  = 0, ringY  = 0;
    let dotX   = 0, dotY   = 0;

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.classList.remove('hidden');
      ring.classList.remove('hidden');
    });

    document.addEventListener('mouseleave', () => {
      dot.classList.add('hidden');
      ring.classList.add('hidden');
    });

    document.addEventListener('mousedown', () => dot.classList.add('click'));
    document.addEventListener('mouseup', () => dot.classList.remove('click'));

    /* Hover states */
    function addHoverListeners () {
      const hoverEls = document.querySelectorAll(
        'a, button, [data-cursor], input, textarea, select, label'
      );
      hoverEls.forEach(el => {
        el.addEventListener('mouseenter', () => {
          dot.classList.add('hover');
          ring.classList.add('hover');
          const label = el.dataset.cursorLabel || '';
          ring.querySelector('.ring-label').textContent = label;
          if (label) ring.classList.add('labeled');
          else ring.classList.remove('labeled');
        });
        el.addEventListener('mouseleave', () => {
          dot.classList.remove('hover');
          ring.classList.remove('hover');
          ring.classList.remove('labeled');
        });
      });
    }

    addHoverListeners();
    // Re-run after dynamic content loads
    window.JX = window.JX || {};
    window.JX.refreshCursor = addHoverListeners;

    /* Smooth ring follow */
    const lerp = (a, b, t) => a + (b - a) * t;

    const raf = () => {
      dotX  = lerp(dotX,  mouseX, 0.85);
      dotY  = lerp(dotY,  mouseY, 0.85);
      ringX = lerp(ringX, mouseX, 0.12);
      ringY = lerp(ringY, mouseY, 0.12);

      dot.style.left  = dotX  + 'px';
      dot.style.top   = dotY  + 'px';
      ring.style.left = ringX + 'px';
      ring.style.top  = ringY + 'px';

      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  /* ────────────────────────────────────────────────────────────────
     BUILD TRANSITION DOM
     ──────────────────────────────────────────────────────────────── */
  function buildTransitionDOM () {
    if (document.getElementById('ct-wrap')) return document.getElementById('ct-wrap');
    const wrap = document.createElement('div');
    wrap.id = 'ct-wrap';
    wrap.innerHTML = `
      <div class="ct-panel ct-panel-1"></div>
      <div class="ct-panel ct-panel-2"></div>
      <div class="ct-panel ct-panel-3"></div>
      <div class="ct-grid"></div>
      <div class="ct-sigil">
        ${JX_LOGO_LARGE_SVG}
      </div>
    `;
    document.body.append(wrap);
    return wrap;
  }

  /* ────────────────────────────────────────────────────────────────
     CONSCIOUSNESS SHIFT TRANSITION
     ──────────────────────────────────────────────────────────────── */
  let isTransitioning = false;

  function consciousnessShift (destination) {
    if (isTransitioning) return;
    if (!window.gsap) {
      window.location.href = destination;
      return;
    }

    isTransitioning = true;

    const wrap   = document.getElementById('ct-wrap');
    const panels = wrap.querySelectorAll('.ct-panel');
    const grid   = wrap.querySelector('.ct-grid');
    const sigil  = wrap.querySelector('.ct-sigil');
    const strokes = sigil.querySelectorAll('.jx-stroke');

    /* Make clickable during transition */
    wrap.style.pointerEvents = 'all';

    const tl = gsap.timeline({
      onComplete: () => { window.location.href = destination; }
    });

    /* 0 – 0.2s: panels slam in from left */
    tl.set(panels, { scaleX: 0, transformOrigin: 'left center' })
      .to(panels[0], { scaleX: 1, duration: 0.5, ease: 'expo.inOut' }, 0)
      .to(panels[1], { scaleX: 1, duration: 0.5, ease: 'expo.inOut' }, 0.04)
      .to(panels[2], { scaleX: 1, duration: 0.5, ease: 'expo.inOut' }, 0.08)

    /* Grid + sigil reveal */
      .to(grid,  { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0.35)
      .to(sigil, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)' }, 0.4)

    /* Stroke-draw the JX sigil */
      .to(strokes, {
        strokeDashoffset: 0,
        duration: 0.5,
        ease: 'power3.inOut',
        stagger: 0.06,
      }, 0.45)

    /* Hold — we navigate here */
      .to({}, { duration: 0.2 }, 0.85);

    return tl;
  }

  /* Page-in reveal (panels wipe out when page loads) */
  function pageRevealIn () {
    if (!window.gsap) return;

    const wrap = document.getElementById('ct-wrap');
    if (!wrap) return;

    const panels = wrap.querySelectorAll('.ct-panel');
    const grid   = wrap.querySelector('.ct-grid');
    const sigil  = wrap.querySelector('.ct-sigil');
    const strokes = sigil ? sigil.querySelectorAll('.jx-stroke') : [];

    /* If panels already at scaleX = 1 (came from a transition), wipe them out */
    const fromPanel = sessionStorage.getItem('ct-active');
    if (!fromPanel) return;
    sessionStorage.removeItem('ct-active');

    gsap.set(panels, { scaleX: 1, transformOrigin: 'right center' });
    gsap.set(grid, { opacity: 1 });
    gsap.set(sigil, { opacity: 1, scale: 1 });
    gsap.set(strokes, { strokeDashoffset: 0 });

    const tl = gsap.timeline();
    tl.to(strokes, { strokeDashoffset: 200, duration: 0.3, ease: 'power2.in', stagger: 0.03 }, 0)
      .to([sigil, grid], { opacity: 0, duration: 0.25, ease: 'power2.in' }, 0.1)
      .to(panels[2], { scaleX: 0, duration: 0.55, ease: 'expo.inOut' }, 0.3)
      .to(panels[1], { scaleX: 0, duration: 0.55, ease: 'expo.inOut' }, 0.35)
      .to(panels[0], { scaleX: 0, duration: 0.55, ease: 'expo.inOut' }, 0.40)
      .set(wrap, { pointerEvents: 'none' })
      .call(() => { isTransitioning = false; });
  }

  /* ────────────────────────────────────────────────────────────────
     NAV SCROLL BEHAVIOUR
     ──────────────────────────────────────────────────────────────── */
  function initNavScroll () {
    const nav = document.getElementById('nav');
    if (!nav) return;

    let lastY = 0;
    const THRESHOLD = 60;

    const observer = new IntersectionObserver(
      ([entry]) => nav.classList.toggle('scrolled', !entry.isIntersecting),
      { rootMargin: '-80px 0px 0px 0px' }
    );

    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;';
    document.body.prepend(sentinel);
    observer.observe(sentinel);
  }

  /* ────────────────────────────────────────────────────────────────
     HAMBURGER MENU
     ──────────────────────────────────────────────────────────────── */
  function initHamburger () {
    const btn  = document.getElementById('nav-hamburger');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    let open = false;

    btn.addEventListener('click', () => {
      open = !open;
      btn.classList.toggle('open', open);
      menu.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';

      if (open && window.gsap) {
        gsap.fromTo('.mobile-nav-link',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.06, delay: 0.05 }
        );
      }
    });

    menu.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        open = false;
        btn.classList.remove('open');
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });
  }

  /* ────────────────────────────────────────────────────────────────
     INTERCEPT NAV CLICKS
     ──────────────────────────────────────────────────────────────── */
  function interceptNavLinks () {
    document.querySelectorAll('[data-nav-link]').forEach(link => {
      link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('http')) return;

        /* Same page? Do nothing */
        const current = getActivePage();
        if (href === current || (href === 'index.html' && current === '')) return;

        e.preventDefault();
        sessionStorage.setItem('ct-active', '1');
        consciousnessShift(href);
      });
    });
  }

  /* ────────────────────────────────────────────────────────────────
     AVAILABILITY STATUS (from Supabase)
     ──────────────────────────────────────────────────────────────── */
  async function loadAvailability () {
    const dot  = document.getElementById('nav-dot');
    const text = document.getElementById('nav-availability-text');
    if (!dot || !text) return;

    try {
      if (typeof supabase === 'undefined') return;

      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'availability_status')
        .maybeSingle();

      if (!data) return;
      const status = data.value;

      if (status === 'available') {
        dot.className  = 'nav-dot';
        text.textContent = 'Available';
      } else if (status === 'limited') {
        dot.className  = 'nav-dot amber';
        text.textContent = 'Limited';
      } else {
        dot.className  = 'nav-dot';
        dot.style.background = 'var(--gray-3)';
        dot.style.boxShadow  = 'none';
        dot.style.animation  = 'none';
        text.textContent = 'Unavailable';
      }
    } catch (_) { /* silently fail */ }
  }

  /* ────────────────────────────────────────────────────────────────
     CLOCK (Lagos Time)
     ──────────────────────────────────────────────────────────────── */
  function startClock (el) {
    if (!el) return;
    const update = () => {
      const now = new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Africa/Lagos',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      el.textContent = `LOS ${now}`;
    };
    update();
    setInterval(update, 1000);
  }

  /* ────────────────────────────────────────────────────────────────
     SCROLL TO TOP
     ──────────────────────────────────────────────────────────────── */
  function initScrollTop () {
    const btn = document.querySelector('.scroll-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ────────────────────────────────────────────────────────────────
     INIT — runs on every page
     ──────────────────────────────────────────────────────────────── */
  function init () {
    buildNav();
    buildCursor();
    buildTransitionDOM();
    initNavScroll();
    initHamburger();
    interceptNavLinks();
    loadAvailability();
    initScrollTop();

    /* Page-in reveal if we came from a transition */
    if (document.readyState === 'complete') {
      pageRevealIn();
    } else {
      window.addEventListener('load', pageRevealIn);
    }

    /* Expose helpers globally */
    window.JX = window.JX || {};
    window.JX.nav = {
      startClock,
      loadAvailability,
    };
  }

  /* Run immediately when DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
