new_js = """(function() {
  'use strict';

  /* ────────────────────────────────────────────────────────────────
     1. GLOBAL SETUP & LENIS
     ──────────────────────────────────────────────────────────────── */
  function initLenis() {
    if (!window.Lenis) return;
    if (!window.JXLenis) {
      window.JXLenis = new Lenis({ duration: 1.4, smoothWheel: true });
      const raf = t => { window.JXLenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      if (window.ScrollTrigger) {
        window.JXLenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => { window.JXLenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
      }
    }
  }

  /* ────────────────────────────────────────────────────────────────
     2. THE HUB SCROLL MECHANICS (Bento Mask Reveals)
     ──────────────────────────────────────────────────────────────── */
  function initBentoScroll() {
    if (!window.gsap || !window.ScrollTrigger) return;
    
    const hubView = document.getElementById('dbx-hub-view');
    if (!hubView) return;

    // We animate the fixed elements based on scrolling through dbx-hub-view
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hubView,
        start: "top top",
        end: "bottom bottom",
        scrub: 1
      }
    });

    // Logo shrinks aggressively and moves to top center
    tl.to('.dbx-massive-logo', { scale: 0.15, y: '-38vh', duration: 1, ease: 'power2.inOut' }, 0);
    tl.to('.dbx-hero-manifesto', { opacity: 0, y: -40, duration: 0.3, ease: 'power1.in' }, 0);

    // The Grid itself fades in
    tl.to('.dbx-bento-grid', { opacity: 1, duration: 0.5, ease: 'none' }, 0.2);

    // Content inside the grid sharp-masks up (The Dropbox Mechanic)
    const cells = document.querySelectorAll('.dbx-cell');
    cells.forEach((cell, i) => {
      const num = cell.querySelector('.dbx-num');
      const maskText = cell.querySelector('.mask-text');
      
      const delay = 0.4 + (i * 0.1);
      
      tl.to(num, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, delay);
      tl.to(maskText, { y: '0%', duration: 0.5, ease: 'power3.out' }, delay);
    });
  }

  /* ────────────────────────────────────────────────────────────────
     3. STRUCTURAL TAKEOVERS (The Wipe)
     ──────────────────────────────────────────────────────────────── */
  function initTakeovers() {
    const cells = document.querySelectorAll('.dbx-cell');
    const wipe = document.getElementById('dbx-takeover-layer');
    const backBtn = document.getElementById('back-to-hub');
    const hubView = document.getElementById('dbx-hub-view');
    const page = document.getElementById('page');

    if(page) gsap.to(page, { opacity: 1, duration: 0.5 });
    gsap.fromTo('.dbx-massive-logo', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.5, ease: 'power3.out', delay: 0.2 });

    cells.forEach(cell => {
      cell.addEventListener('click', () => {
        const targetId = cell.getAttribute('data-target');
        if (!targetId || targetId === 'view-transmission') return;

        gsap.set(wipe, { transformOrigin: 'bottom' });
        gsap.to(wipe, {
          scaleY: 1, 
          duration: 0.7, 
          ease: 'expo.inOut',
          onComplete: () => {
            hubView.style.display = 'none';
            document.querySelectorAll('.content-view').forEach(v => v.style.display = 'none');
            const targetView = document.getElementById(targetId);
            if (targetView) targetView.style.display = 'block';

            window.scrollTo(0, 0);
            if (window.JXLenis) window.JXLenis.scrollTo(0, { immediate: true });
            
            gsap.set(wipe, { transformOrigin: 'top' });
            gsap.to(wipe, {
              scaleY: 0, 
              duration: 0.7, 
              ease: 'expo.inOut',
              onComplete: () => {
                backBtn.classList.add('active');
                ScrollTrigger.refresh();
                if (targetId === 'view-origin') animateOriginTimeline();
                if (targetId === 'view-philosophy') animatePhilosophy();
              }
            });
          }
        });
      });
    });

    backBtn.addEventListener('click', () => {
      backBtn.classList.remove('active');
      gsap.set(wipe, { transformOrigin: 'top' });
      gsap.to(wipe, {
        scaleY: 1, 
        duration: 0.7, 
        ease: 'expo.inOut',
        onComplete: () => {
          document.querySelectorAll('.content-view').forEach(v => v.style.display = 'none');
          hubView.style.display = 'block';
          
          window.scrollTo(0, 0);
          if (window.JXLenis) window.JXLenis.scrollTo(0, { immediate: true });
          ScrollTrigger.refresh();

          gsap.set(wipe, { transformOrigin: 'bottom' });
          gsap.to(wipe, {
            scaleY: 0, 
            duration: 0.7, 
            ease: 'expo.inOut'
          });
        }
      });
    });
  }

  /* ────────────────────────────────────────────────────────────────
     4. INTERIOR: THE ORIGIN (Timeline)
     ──────────────────────────────────────────────────────────────── */
  function populateOrigin() {
    const container = document.querySelector('.timeline-nodes');
    if (!container) return;
    const chapters = [
      { era: "The Early Years", title: "Born to Create", body: "Before code, before computers, there was art. Tracing character by character. Physics class became a love affair with the geometry of the perfect building. Not just buildings, experiences." },
      { era: "The Discovery", title: "Then I Found Computers", body: "A machine that could do anything. First as a student, watching. Then under a technician, hands inside machines, wires making sense. I wasn't just using computers anymore. I was building with them." },
      { era: "The Canvas", title: "Digital Art & Animation", body: "My passion for drawing evolved. I transitioned from pencil and paper to creating digital art directly on my phone. This sparked my desire to go into animation—bringing static frames to life through motion." },
      { era: "The Convergence", title: "JX", body: "The artist, the computer technician, the architect, the digital creator—converged into a single identity: JX. It is the culmination of every pixel drawn, every system built, and every world designed." },
      { era: "The Present", title: "A Language of My Own", body: "The gold and scattered marks aren't trend—they're intentional. Built without copying, carrying the instinct of my Igbo ancestors for turning meaning into symbol. This is what my identity looks like." }
    ];

    chapters.forEach(ch => {
      const node = document.createElement('div');
      node.className = 'timeline-node';
      node.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="timeline-era">${ch.era}</div>
        <h3 class="timeline-heading">${ch.title}</h3>
        <p class="timeline-body">${ch.body}</p>
      `;
      container.appendChild(node);
    });
  }

  function animateOriginTimeline() {
    if (!window.gsap || !window.ScrollTrigger) return;
    
    gsap.fromTo('.cv-title-inner', { y: 150, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power4.out' });

    gsap.to('.timeline-line-fill', {
      height: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: '.origin-timeline-container',
        start: 'top center',
        end: 'bottom center',
        scrub: true
      }
    });

    gsap.utils.toArray('.timeline-node').forEach(node => {
      gsap.fromTo(node, 
        { opacity: 0, y: 50 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: node, start: 'top 85%' }
        }
      );
    });
  }

  /* ────────────────────────────────────────────────────────────────
     5. INTERIOR: THE ARSENAL (Supabase Sticky Stack)
     ──────────────────────────────────────────────────────────────── */
  async function initArsenalStack() {
    const container = document.querySelector('.arsenal-stack-container');
    if (!container) return;

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
        container.innerHTML = '<div style="color:var(--gray-2);">No arsenal entries found.</div>';
        return;
      }

      data.forEach(exp => {
        const card = document.createElement('div');
        card.className = 'arsenal-card';
        card.innerHTML = `
          <div style="font-family:var(--font-mono); color:var(--gray-2); font-size:var(--text-sm); margin-bottom:var(--s-2);">${exp.date_range} • ${exp.company}</div>
          <h3 class="ac-title">${exp.role_title}</h3>
          <p style="font-size:var(--text-lg); color:var(--gray-1); margin-bottom:var(--s-4);">${exp.description || ''}</p>
          <div class="ac-tools">Core Stack // Architecture, Systems, Motion</div>
        `;
        container.appendChild(card);
      });
    } catch (err) {
      console.error('Failed to load arsenal:', err);
    }
  }

  /* ────────────────────────────────────────────────────────────────
     6. INTERIOR: THE PHILOSOPHY (Kinetic Typo)
     ──────────────────────────────────────────────────────────────── */
  function animatePhilosophy() {
    if (!window.gsap || !window.ScrollTrigger) return;
    
    const texts = gsap.utils.toArray('.kinetic-text');
    texts.forEach((text, i) => {
      gsap.to(text, {
        opacity: 1,
        y: 0,
        color: '#ffffff',
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.philosophy-kinetic-container',
          start: `top+=${i * 30}% center`,
          end: `top+=${(i + 1) * 30}% center`,
          scrub: true
        }
      });
    });
  }

  /* ────────────────────────────────────────────────────────────────
     7. TRANSMISSION (Video Modal)
     ──────────────────────────────────────────────────────────────── */
  async function initTransmission() {
    const transCard = document.querySelector('.dbx-cell[data-target="view-transmission"]');
    const portal = document.getElementById('view-transmission');
    const ring = document.querySelector('.tp-ring');
    const videoWrap = document.querySelector('.tp-video-wrapper');
    const video = document.getElementById('intro-video');

    if (!transCard || !portal) return;

    try {
      if (window.initSupabase) await window.initSupabase();
      if (typeof supabase !== 'undefined') {
        const { data, error } = await supabase.from('site_settings').select('*').eq('key', 'about_video_url').single();
        if (data && data.value) video.src = data.value;
      }
    } catch (e) { console.warn("Video link failed", e); }

    transCard.addEventListener('click', () => {
      portal.style.display = 'flex';
      gsap.fromTo(portal, { opacity: 0 }, { opacity: 1, duration: 0.5 });
      gsap.fromTo(ring, { scale: 0, opacity: 1 }, { scale: 4, opacity: 0, duration: 1.5, ease: 'power2.out' });
      gsap.fromTo(videoWrap, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 });
      video.play().catch(()=>{});
    });

    portal.addEventListener('click', (e) => {
      if (e.target === portal || e.target === ring) {
        gsap.to(portal, { opacity: 0, duration: 0.5, onComplete: () => {
          portal.style.display = 'none';
          video.pause();
        }});
      }
    });
  }

  /* ────────────────────────────────────────────────────────────────
     BOOT
     ──────────────────────────────────────────────────────────────── */
  function init() {
    initLenis();
    populateOrigin();
    initArsenalStack();
    initBentoScroll();
    initTakeovers();
    initTransmission();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
"""

with open('about.js', 'w') as f:
    f.write(new_js)

print("about.js entirely rewritten with strict JS mechanics.")
