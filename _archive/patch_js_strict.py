import re

with open('about.js', 'r') as f:
    js = f.read()

# We completely rewrite the first half of about.js up to INTERIOR VIEWS
target_js = r'/\* ── THE HUB SCROLL MECHANICS.*?/\* ── INTERIOR: THE ORIGIN'

new_js = """/* ── THE HUB SCROLL MECHANICS (Bento Mask Reveals) ── */
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
      
      // Delay slightly staggered for each cell
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

    // Reveal page immediately on boot
    if(page) gsap.to(page, { opacity: 1, duration: 0.5 });
    gsap.fromTo('.dbx-massive-logo', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.5, ease: 'power3.out', delay: 0.2 });

    cells.forEach(cell => {
      cell.addEventListener('click', () => {
        const targetId = cell.getAttribute('data-target');
        if (!targetId || targetId === 'view-transmission') return;

        // Wipe up
        gsap.set(wipe, { transformOrigin: 'bottom' });
        gsap.to(wipe, {
          scaleY: 1, 
          duration: 0.7, 
          ease: 'expo.inOut',
          onComplete: () => {
            // Swap DOM
            hubView.style.display = 'none';
            document.querySelectorAll('.content-view').forEach(v => v.style.display = 'none');
            const targetView = document.getElementById(targetId);
            if (targetView) targetView.style.display = 'block';

            // Scroll reset
            window.scrollTo(0, 0);
            if (window.JXLenis) window.JXLenis.scrollTo(0, { immediate: true });
            
            // Wipe away
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

  /* ── INTERIOR: THE ORIGIN"""

js = re.sub(r'/\* ── 2\. THE HUB SCROLL MECHANICS.*?/\* ── INTERIOR: THE ORIGIN', new_js, js, flags=re.DOTALL)
# One more replace to remove the old redundant initTakeovers block if any regex missed.
# Actually, the regex specifically matched from `/* ── 2. THE HUB SCROLL` to `/* ── 4. INTERIOR: THE ORIGIN`.
js = re.sub(r'/\* ── 4\. INTERIOR', '/* ── INTERIOR', js)
js = re.sub(r'/\* ── 5\. INTERIOR', '/* ── INTERIOR', js)
js = re.sub(r'/\* ── 6\. INTERIOR', '/* ── INTERIOR', js)

with open('about.js', 'w') as f:
    f.write(js)

print("about.js strictly updated.")
