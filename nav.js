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
    <img src="assets/images/jx-logo.jpeg" class="nav-logo-img" alt="JX Logo" style="height: 32px; width: auto; border-radius: 50%;">`;

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
     BUILD CURSOR — Neural Cursor System v2.0
     ──────────────────────────────────────────────────────────────── */
  function buildCursor () {
    if (document.querySelector('.cursor')) return;
    if (window.matchMedia('(hover: none)').matches) return;

    /* ── DOM Elements ── */
    const dot   = document.createElement('div');
    const ring  = document.createElement('div');
    const aura  = document.createElement('div');
    dot.className   = 'cursor';
    ring.className  = 'cursor-ring';
    aura.className  = 'cursor-aura';
    ring.innerHTML  = '<span class="ring-label"></span>';
    document.body.append(aura, dot, ring);

    /* ── Trail particles pool (8 ghosts) ── */
    const TRAIL_COUNT = 8;
    const trail = [];
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const t = document.createElement('div');
      t.className = 'cursor-trail';
      t.style.setProperty('--trail-i', i);
      document.body.append(t);
      trail.push({ el: t, x: -999, y: -999 });
    }

    /* ── State ── */
    let mouseX = -999, mouseY = -999;
    let prevX  = -999, prevY  = -999;
    let dotX   = 0,    dotY   = 0;
    let ringX  = 0,    ringY  = 0;
    let auraX  = 0,    auraY  = 0;
    let velX   = 0,    velY   = 0;
    let speed  = 0;
    let mode   = 'default'; // 'default' | 'hover' | 'click' | 'text' | 'explore'
    let isVisible = false;
    let magnetTarget = null;
    let magnetStrength = 0; // 0..1

    /* ── Global cursor bus ── */
    window.JX       = window.JX || {};
    window.JX.cursor = { x: 0, y: 0, vx: 0, vy: 0, speed: 0, mode: 'default' };

    /* ── Mouse tracking ── */
    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) {
        isVisible = true;
        dot.classList.remove('hidden');
        ring.classList.remove('hidden');
        aura.classList.remove('hidden');
      }
    });

    document.addEventListener('mouseleave', () => {
      isVisible = false;
      dot.classList.add('hidden');
      ring.classList.add('hidden');
      aura.classList.add('hidden');
      trail.forEach(t => t.el.classList.add('hidden'));
    });

    document.addEventListener('mousedown', () => setMode('click'));
    document.addEventListener('mouseup',   () => {
      setMode(ring.classList.contains('hover') ? 'hover' : 'default');
    });

    /* ── Mode setter ── */
    function setMode (newMode) {
      if (mode === newMode) return;
      mode = newMode;
      dot.dataset.mode  = newMode;
      ring.dataset.mode = newMode;
      aura.dataset.mode = newMode;
      window.JX.cursor.mode = newMode;
    }

    /* ── Hover interaction ── */
    function addHoverListeners () {
      const interactEls = document.querySelectorAll(
        'a, button, [data-cursor], input, textarea, select, label, [role="button"]'
      );
      interactEls.forEach(el => {
        if (el._jxCursor) return; // already bound
        el._jxCursor = true;

        const cursorType  = el.dataset.cursor || 'hover';
        const cursorLabel = el.dataset.cursorLabel || '';

        el.addEventListener('mouseenter', () => {
          ring.classList.add('hover');
          dot.classList.add('hover');
          setMode(cursorType === 'text' ? 'text' : 'hover');
          if (cursorLabel) {
            ring.querySelector('.ring-label').textContent = cursorLabel;
            ring.classList.add('labeled');
          }
          /* Magnetic snap setup */
          magnetTarget = el;
        });

        el.addEventListener('mouseleave', () => {
          ring.classList.remove('hover', 'labeled');
          dot.classList.remove('hover');
          ring.querySelector('.ring-label').textContent = '';
          setMode('default');
          magnetTarget = null;
          magnetStrength = 0;
        });
      });
    }

    addHoverListeners();
    window.JX.refreshCursor = addHoverListeners;

    /* ── Lerp helper ── */
    const lerp = (a, b, t) => a + (b - a) * t;

    /* ── Main animation loop ── */
    let lastTime = 0;
    let trailIdx = 0;
    const raf = (now) => {
      const dt = Math.min((now - lastTime) / 16.67, 3); // normalised to 60fps
      lastTime = now;

      /* Velocity */
      velX = lerp(velX, (mouseX - prevX) * 60, 0.15 * dt);
      velY = lerp(velY, (mouseY - prevY) * 60, 0.15 * dt);
      speed = Math.sqrt(velX * velX + velY * velY);
      prevX = mouseX;
      prevY = mouseY;

      /* Magnetic pull */
      let targetX = mouseX;
      let targetY = mouseY;
      if (magnetTarget) {
        const r = magnetTarget.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top  + r.height / 2;
        const dx = cx - mouseX;
        const dy = cy - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.max(r.width, r.height) * 1.2;
        if (dist < maxDist) {
          magnetStrength = lerp(magnetStrength, 1 - dist / maxDist, 0.1 * dt);
          targetX = lerp(mouseX, cx, magnetStrength * 0.35);
          targetY = lerp(mouseY, cy, magnetStrength * 0.35);
        } else {
          magnetStrength = lerp(magnetStrength, 0, 0.1 * dt);
        }
      }

      /* Dot — snaps almost instantly */
      dotX = lerp(dotX, targetX, 0.88);
      dotY = lerp(dotY, targetY, 0.88);

      /* Ring — follows lazily */
      const ringLerp = magnetTarget ? 0.08 : 0.10;
      ringX = lerp(ringX, targetX, ringLerp);
      ringY = lerp(ringY, targetY, ringLerp);

      /* Aura — very slow, large follow */
      auraX = lerp(auraX, targetX, 0.04);
      auraY = lerp(auraY, targetY, 0.04);

      /* Apply positions */
      dot.style.transform  = `translate(${dotX}px, ${dotY}px)`;
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      aura.style.transform = `translate(${auraX}px, ${auraY}px)`;

      /* Ring scale/deform based on velocity */
      const speedNorm = Math.min(speed / 1200, 1);
      const scaleX = 1 + speedNorm * 0.55;
      const scaleY = 1 - speedNorm * 0.18;
      const angle  = Math.atan2(velY, velX) * (180 / Math.PI);
      ring.style.transform += ` rotate(${angle}deg) scaleX(${scaleX}) scaleY(${scaleY})`;

      /* Aura glow size based on speed */
      const auraScale = 1 + speedNorm * 0.6;
      aura.style.transform += ` scale(${auraScale})`;
      aura.style.opacity    = 0.12 + speedNorm * 0.18;

      /* Trail — update one slot per frame for staggered fade */
      if (speed > 15) {
        const t = trail[trailIdx % TRAIL_COUNT];
        t.x = dotX; t.y = dotY;
        t.el.style.transform = `translate(${t.x}px, ${t.y}px)`;
        t.el.classList.remove('hidden');
        t.el.classList.add('active');
        setTimeout(() => { t.el.classList.remove('active'); }, 180);
        trailIdx++;
      }

      /* Update global bus */
      window.JX.cursor.x     = mouseX;
      window.JX.cursor.y     = mouseY;
      window.JX.cursor.vx    = velX;
      window.JX.cursor.vy    = velY;
      window.JX.cursor.speed = speed;

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
