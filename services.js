/* ================================================================
   JX UNIVERSE — services.js v3.0
   The Forge - Page specific logic & 3D Hover Effects
   ================================================================ */

'use strict';

(function () {
  function revealPage () {
    const page = document.getElementById('page');
    if (!page) return;
    if (window.gsap) {
      gsap.to(page, { opacity: 1, duration: 0.7, ease: 'power2.out' });
      const tl = gsap.timeline({ delay: 0.1 });
      tl.to('#sh-label', { opacity: 1, duration: 0.6 })
        .to('#sh-title',  { y: 0, opacity: 1, duration: 1, ease: 'expo.out' }, '-=0.3')
        .to('#sh-sub',    { opacity: 1, duration: 0.7 }, '-=0.5');
    } else {
      page.style.opacity = '1';
    }
  }

  function initScrollAnimations () {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right').forEach(el => {
      const isScale = el.classList.contains('reveal-scale');
      gsap.fromTo(el,
        isScale ? { opacity: 0, scale: 0.94 } : { opacity: 0, y: 40 },
        { ...(isScale ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 }),
          duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        }
      );
    });
  }

  /* 3D Hover Tilt Effects */
  function initHoverEffects() {
    const visuals = document.querySelectorAll('.service-deep-visual');
    visuals.forEach(visual => {
      visual.addEventListener('mousemove', e => {
        const rect = visual.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -10; // Max rotation 10deg
        const rotateY = ((x - centerX) / centerX) * 10;
        
        visual.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        visual.style.transition = 'none';
      });
      
      visual.addEventListener('mouseleave', () => {
        visual.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        visual.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
      });
    });
  }

  function initLenis () {
    if (!window.Lenis) return;
    const lenis = new Lenis({ duration: 1.4, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
  }

  function init () {
    if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    revealPage();
    initScrollAnimations();
    initHoverEffects();
    initLenis();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
