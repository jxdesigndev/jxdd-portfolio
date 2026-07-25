/* ================================================================
   JX UNIVERSE — about.js v3.0
   The Story - Page specific logic & Living Portrait Fragmentation
   ================================================================ */

'use strict';

(function () {

  /* Page reveal */
  function revealPage () {
    const page = document.getElementById('page');
    if (!page) return;

    if (window.gsap) {
      gsap.to(page, { opacity: 1, duration: 0.7, ease: 'power2.out' });

      /* Hero cascade */
      const tl = gsap.timeline({ delay: 0.1 });
      tl.to('#ah-label', { opacity: 1, duration: 0.6, ease: 'power3.out' })
        .to('#ah-title',  { y: 0, opacity: 1, duration: 1, ease: 'expo.out' }, '-=0.3')
        .to('#ah-tag',    { opacity: 1, duration: 0.7, ease: 'power2.out' }, '-=0.5');

    } else {
      page.style.opacity = '1';
    }
  }

  /* Scroll animations */
  function initScrollAnimations () {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right').forEach(el => {
      const isScale = el.classList.contains('reveal-scale');
      const from = isScale ? { opacity: 0, scale: 0.94 } : { opacity: 0, y: 40 };
      const to   = isScale ? { opacity: 1, scale: 1 }     : { opacity: 1, y: 0 };

      gsap.fromTo(el, from, {
        ...to, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
  }

  /* Living Portrait: Canvas2D Particle Fragmentation (WOW #4) */
  function initLivingPortrait () {
    const wrap   = document.getElementById('portrait-wrap');
    const img    = document.getElementById('portrait-img');
    const canvas = document.getElementById('portrait-canvas');
    if (!canvas || !img) return;

    // We keep the setup in a function to handle window resizing
    const setup = () => {
      const W = wrap.offsetWidth;
      const H = wrap.offsetHeight;
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      /* Off-screen source */
      const src = document.createElement('canvas');
      src.width  = W;
      src.height = H;
      const sctx = src.getContext('2d');
      sctx.drawImage(img, 0, 0, W, H);
      const srcData = sctx.getImageData(0, 0, W, H).data;

      // Create particles based on resolution density
      const step = 4; // Lower is higher density but slower
      const particles = [];
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          const i = (y * W + x) * 4;
          const r = srcData[i];
          const g = srcData[i + 1];
          const b = srcData[i + 2];
          const a = srcData[i + 3];
          if (a > 10) { // only create particles for non-transparent pixels
            particles.push({
              ox: x, oy: y,      // original
              x: x, y: y,        // current
              vx: 0, vy: 0,      // velocity
              color: `rgba(${r},${g},${b},${a/255})`,
              size: step
            });
          }
        }
      }

      let mx = -1000, my = -1000;
      let active = false;

      wrap.addEventListener('mousemove', e => {
        const r  = wrap.getBoundingClientRect();
        mx = e.clientX - r.left;
        my = e.clientY - r.top;
        active = true;
      });
      wrap.addEventListener('mouseleave', () => { 
        active = false;
        mx = -1000;
        my = -1000;
      });

      let mouseRadius = 80;
      let friction = 0.85;
      let ease = 0.1;
      let isRunning = true;

      function draw () {
        if (!isRunning) return;
        requestAnimationFrame(draw);
        ctx.clearRect(0, 0, W, H);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          
          let dx = mx - p.x;
          let dy = my - p.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          
          let forceX = 0;
          let forceY = 0;

          // If mouse is near, repel particles
          if (active && dist < mouseRadius) {
            let force = (mouseRadius - dist) / mouseRadius;
            let angle = Math.atan2(dy, dx);
            forceX = -Math.cos(angle) * force * 15;
            forceY = -Math.sin(angle) * force * 15;
          }

          p.vx += forceX;
          p.vy += forceY;
          
          // Return to original position
          p.vx += (p.ox - p.x) * ease;
          p.vy += (p.oy - p.y) * ease;

          // Apply friction
          p.vx *= friction;
          p.vy *= friction;

          p.x += p.vx;
          p.y += p.vy;

          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      }

      draw();

      /* Handle basic resize by completely re-initializing */
      let resizeTimer;
      window.addEventListener('resize', () => {
        isRunning = false; // Stop current loop
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          setup(); 
        }, 300);
      }, { once: true });
    };

    if (img.complete) { setup(); } else { img.onload = setup; }
  }

  /* Lenis smooth scroll */
  function initLenis () {
    if (!window.Lenis) return;
    const lenis = new Lenis({ duration: 1.4, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      if (window.gsap) gsap.ticker.lagSmoothing(0);
    }
  }

  /* Boot */
  function init () {
    revealPage();
    initScrollAnimations();
    initLivingPortrait();
    initLenis();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
