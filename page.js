/* =========================================
   JX Design & Dev — Shared Page Utilities
   page.js — Cursor + Scroll-to-top for sub-pages
   ========================================= */

(function () {
  'use strict';

  /* ---- Custom Cursor ---- */
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursor-follower');

  if (cursor && follower) {
    let mouseX = 0;
    let mouseY = 0;
    let followerX = 0;
    let followerY = 0;
    const followerSpeed = 0.1;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (typeof gsap !== 'undefined') {
        gsap.to(cursor, {
          left: mouseX,
          top: mouseY,
          duration: 0.08,
          ease: 'none',
          overwrite: true,
        });
      }
    });

    function animateFollower() {
      followerX += (mouseX - followerX) * followerSpeed;
      followerY += (mouseY - followerY) * followerSpeed;
      follower.style.left = followerX + 'px';
      follower.style.top = followerY + 'px';
      requestAnimationFrame(animateFollower);
    }
    animateFollower();

    // Hover detection
    const hoverTargets = document.querySelectorAll('a, button, .btn, .tag');
    hoverTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('hover');
        follower.classList.add('hover');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('hover');
        follower.classList.remove('hover');
      });
    });

    // Fade cursor on document leave/enter
    document.addEventListener('mouseleave', () => {
      if (typeof gsap !== 'undefined') {
        gsap.to(cursor, { opacity: 0, duration: 0.3, ease: 'power2.out' });
        gsap.to(follower, { opacity: 0, duration: 0.3, ease: 'power2.out' });
      }
    });
    document.addEventListener('mouseenter', () => {
      if (typeof gsap !== 'undefined') {
        gsap.to(cursor, { opacity: 1, duration: 0.3, ease: 'power2.out' });
        gsap.to(follower, { opacity: 0.5, duration: 0.3, ease: 'power2.out' });
      }
    });
  }

  /* ---- Lenis Smooth Scroll (sub-pages) ---- */
  let lenisInstance = null;

  function initLenis() {
    if (typeof Lenis === 'undefined') return;

    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    // Connect Lenis to GSAP ScrollTrigger if available
    if (typeof gsap !== 'undefined') {
      if (typeof ScrollTrigger !== 'undefined') {
        lenisInstance.on('scroll', ScrollTrigger.update);
      }

      gsap.ticker.add((time) => {
        lenisInstance.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      // Fallback: run Lenis with requestAnimationFrame if GSAP is not available
      function raf(time) {
        lenisInstance.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  initLenis();

  /* ---- Scroll To Top ---- */
  const scrollTopBtn = document.getElementById('scroll-top');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    });

    scrollTopBtn.addEventListener('click', () => {
      if (lenisInstance) {
        lenisInstance.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
})();
