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
    if (!window.JXLenis) {
      window.JXLenis = new Lenis({ duration: 1.4, smoothWheel: true });
      const raf = t => { window.JXLenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      if (window.ScrollTrigger) window.JXLenis.on('scroll', ScrollTrigger.update);
    }
  }

  /* Supabase Experience Timeline */
  async function initExperienceTimeline() {
    const timeline = document.getElementById('experience-timeline');
    if (!timeline) return;

    try {
      if (window.initSupabase) await window.initSupabase();
      if (typeof supabase === 'undefined') throw new Error('Database offline.');

      const { data, error } = await supabase
        .from('experience')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        timeline.innerHTML = '<div class="work-empty" style="text-align:left; padding:var(--s-6); color:var(--gray-2); font-family:var(--font-mono); font-size:var(--text-sm);">No experience entries found.</div>';
        return;
      }

      timeline.innerHTML = '';
      const newNodes = [];

      data.forEach(exp => {
        // Build elements safely via DOM API to prevent XSS
        const item = document.createElement('div');
        item.className = 'experience-item reveal';

        const meta = document.createElement('div');
        meta.className = 'exp-meta';

        const dateSpan = document.createElement('span');
        dateSpan.className = 'exp-date';
        dateSpan.textContent = exp.date_range;

        const companySpan = document.createElement('span');
        companySpan.className = 'exp-company';
        companySpan.textContent = exp.company;

        meta.appendChild(dateSpan);
        meta.appendChild(companySpan);

        const content = document.createElement('div');

        const roleHead = document.createElement('h3');
        roleHead.className = 'exp-role';
        roleHead.textContent = exp.role_title;

        const descP = document.createElement('p');
        descP.className = 'exp-desc';
        descP.textContent = exp.description || '';

        content.appendChild(roleHead);
        content.appendChild(descP);

        item.appendChild(meta);
        item.appendChild(content);

        timeline.appendChild(item);
        newNodes.push(item);
      });

      // Animate newly injected nodes
      if (window.gsap && window.ScrollTrigger) {
        newNodes.forEach(el => {
          gsap.fromTo(el, { opacity: 0, y: 40 }, {
            opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true }
          });
        });
        ScrollTrigger.refresh();
      } else {
        newNodes.forEach(el => {
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
      }

    } catch (err) {
      console.error('Failed to load experience:', err);
      timeline.innerHTML = '<div class="work-empty" style="text-align:left; padding:var(--s-6); color:var(--red); font-family:var(--font-mono); font-size:var(--text-sm);">Error loading experience timeline.</div>';
    }
  }

  /* Supabase About Video */
  async function initAboutVideo() {
    const videoSection = document.getElementById('about-video-section');
    const videoPlayer = document.getElementById('about-video-player');
    if (!videoSection || !videoPlayer) return;

    try {
      if (window.initSupabase) await window.initSupabase();
      if (typeof supabase === 'undefined') throw new Error('Database offline.');

      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'about_video_url')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"

      if (!data || !data.value) {
        // Hide section gracefully if no video exists
        videoSection.style.display = 'none';
        return;
      }

      // Update the video src and reveal normally
      videoPlayer.src = data.value;
      
    } catch (err) {
      console.error('Failed to load about video:', err);
      videoSection.style.display = 'none';
    }
  }

  /* Boot */
  function init () {
    revealPage();
    initScrollAnimations();
    initLivingPortrait();
    initLenis();
    initExperienceTimeline();
    initAboutVideo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
