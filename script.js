/* ================================================================
   JX UNIVERSE — script.js v3.0
   The Awakening — Homepage Master Controller
   Okezie Ferdinand | jxdesigndev.com
   ================================================================ */

'use strict';

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


const JXUniverse = {

  /* ─── State ─── */
  loader:       null,
  loaderBar:    null,
  loaderPct:    null,
  loaderStatus: null,
  heroCanvas:   null,
  lenis:        null,
  threeCtx:     null,   // WebGL scene refs
  canvas2D:     null,   // 2D context if WebGL fails
  loadProgress: 0,
  cliOpen:      false,
  cliHistory:   [],
  cliIndex:     -1,

  /* ─── Boot ─── */
  async init () {
    this.loader       = document.getElementById('loader');
    this.loaderBar    = document.getElementById('loader-bar');
    this.loaderPct    = document.getElementById('loader-pct');
    this.loaderStatus = document.getElementById('loader-status-text');
    this.heroCanvas   = document.getElementById('hero-canvas');

    /* Activate loader noise */
    const loaderNoise = document.getElementById('loader-noise');
    if (loaderNoise) loaderNoise.classList.add('active');

    /* ── NUCLEAR FALLBACK: force-reveal after 25s no matter what ── */
    const nuclear = setTimeout(() => {
      console.warn('JX: Nuclear fallback — force revealing page.');
      this.revealPage();
      this.afterReveal();
    }, 25000);

    try {
      await this.preload();
      this.initLenis();
      await this.runLoader();
      clearTimeout(nuclear);
      this.revealPage();
      this.afterReveal();
    } catch (err) {
      console.error('JX Boot Error:', err);
      clearTimeout(nuclear);
      this.revealPage();
      this.afterReveal();
    }
  },

  /* ────────────────────────────────────────────────────────────────
     1. PRELOAD — fonts + hero image
     ──────────────────────────────────────────────────────────────── */
  async preload () {
    return new Promise(resolve => {
      let done = 0;
      const total = 6;
      const tick  = () => { done++; this.setProgress(done / total * 35); if (done >= total) resolve(); };

      /* Fonts */
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(tick);
      } else { tick(); }

      const load = (src) => {
        const img = new Image();
        img.onload = tick; img.onerror = tick;
        if (src.startsWith('data:image/svg+xml;base64,')) {
          fetch(src)
            .then(res => res.blob())
            .then(blob => {
              img.src = URL.createObjectURL(blob);
            })
            .catch(tick);
        } else {
          img.src = src;
        }
        return img;
      };

      this.imgOkezie1 = load('assets/images/okezie-1.webp');
      this.imgHero2 = load('assets/images/jx-hero-2.webp');
      this.imgPortrait = load('assets/images/okezie-2.webp');
      this.imgCoder = load('assets/images/okezie-coder.webp');
      this.imgDesigner = load('assets/images/okezie-designer.webp');
    });
  },

  setProgress (pct) {
    this.loadProgress = Math.min(pct, 100);
    if (this.loaderBar) this.loaderBar.style.width = this.loadProgress + '%';
    if (this.loaderPct) this.loaderPct.textContent  = Math.round(this.loadProgress) + '%';
  },

  setStatus (text) {
    if (!this.loaderStatus) return;
    this.loaderStatus.style.opacity = '0';
    setTimeout(() => {
      this.loaderStatus.textContent  = text;
      this.loaderStatus.style.transition = 'opacity 0.3s ease';
      this.loaderStatus.style.opacity = '1';
    }, 150);
  },

  /* ────────────────────────────────────────────────────────────────
     2. PARTICLE UNIVERSE — WebGL primary, Canvas2D fallback
     ──────────────────────────────────────────────────────────────── */
  initParticles: async function(...args) { const m = await import('./src/webgl.js'); m.attach(this); return this.initParticles(...args); },

  /* ── 2a. THREE.JS WebGL particle universe ── */
  initThreeJS: async function(...args) { const m = await import('./src/webgl.js'); m.attach(this); return this.initThreeJS(...args); },

  /* ── 2b. Canvas2D fallback (Firefox / no-WebGL) ── */
  initCanvas2D: async function(...args) { const m = await import('./src/webgl.js'); m.attach(this); return this.initCanvas2D(...args); },

  /* ── Uniform tweener (WebGL fade-in helper) ── */
  tweenUniform: async function(...args) { const m = await import('./src/webgl.js'); m.attach(this); return this.tweenUniform(...args); },

  /* ────────────────────────────────────────────────────────────────
     3. LENIS SMOOTH SCROLL
     ──────────────────────────────────────────────────────────────── */
  initLenis () {
    if (!window.Lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.JXLenis) {
      window.JXLenis = new Lenis({ duration: 1.4, smoothWheel: true });
      gsap.ticker.add((time) => { window.JXLenis.raf(time * 1000); });
      if (window.ScrollTrigger) window.JXLenis.on('scroll', ScrollTrigger.update);
    }
    this.lenis = window.JXLenis;
  },

  /* ────────────────────────────────────────────────────────────────
     4. CINEMATIC LOADER
     ──────────────────────────────────────────────────────────────── */
  runLoader () {
    return new Promise(async resolve => {
      if (sessionStorage.getItem('jx_visited')) {
        if (this.loader) this.loader.style.display = 'none';
        const skipBtn = document.getElementById('loader-skip');
        if (skipBtn) skipBtn.remove();
        await this.initParticles();
        this.particlesReady = true;
        if (this.threeCtx && !this.threeCtx.is2D) {
          const mats = this.threeCtx.mainMat.uniforms;
          mats.uAlpha.value = 1;
          mats.uProgress1.value = 0.0;
          mats.uProgress2.value = 1.0; 
          this.tweenUniform(mats.uGreenMix, 0, 0.15, 100);
        }
        resolve();
        return;
      }
      sessionStorage.setItem('jx_visited', '1');

      const statuses = [
        'SIGNAL ACQUIRED',
        'LOADING JX CONSCIOUSNESS',
        'CALIBRATING AFROFUTURIST ENGINE',
        'ASSEMBLING PARTICLE FIELD',
        'RENDERING THE AWAKENING',
        'SYSTEM ONLINE',
      ];

      let si = 0;
      let pct = this.loadProgress;
      let particlesInitDone = false;
      this.particlesReady = false;

      let phase2T1, phase2T2, phase2T3, phase2T4;
      let hasResolved = false;

      const finishLoader = () => {
        if (hasResolved) return;
        hasResolved = true;
        
        clearInterval(timer);
        clearTimeout(phase2T1);
        clearTimeout(phase2T2);
        clearTimeout(phase2T3);
        clearTimeout(phase2T4);

        const skipBtn = document.getElementById('loader-skip');
        if (skipBtn) skipBtn.remove();
        
        resolve();
      };

      const skipIntro = async () => {
        if (hasResolved) return;

        // 1. Instant UI Feedback
        const skipBtn = document.getElementById('loader-skip');
        if (skipBtn) {
          skipBtn.textContent = '[ SKIPPING... ]';
          skipBtn.style.pointerEvents = 'none';
        }

        clearInterval(timer);
        clearTimeout(phase2T1);
        clearTimeout(phase2T2);
        clearTimeout(phase2T3);
        clearTimeout(phase2T4);

        // Yield to the browser to paint the button text change before we block the main thread.
        // We don't start the GSAP slide-up here because it would stutter and hang 
        // midway through the animation due to the WebGL synchronous compilation freeze.
        await new Promise(r => requestAnimationFrame(() => setTimeout(r, 10)));

        // 2. Heavy Synchronous Work (WebGL Compilation)
        if (!particlesInitDone) {
          particlesInitDone = true;
          await this.initParticles();
          this.particlesReady = true;
        }

        // Snap particles
        if (this.threeCtx && !this.threeCtx.is2D) {
          const mats = this.threeCtx.mainMat.uniforms;
          mats.uAlpha.value = 1;
          this.threeCtx.ambMat.uniforms.uAlpha.value = 1;
          mats.uProgress1.value = 1;
          mats.uProgress2.value = 1;
          
          if (window.gsap && this.threeCtx.mainParticles) {
            gsap.killTweensOf(this.threeCtx.mainParticles.scale);
            gsap.killTweensOf(this.threeCtx.mainParticles.rotation);
            gsap.killTweensOf(mats.uSize);
            this.threeCtx.mainParticles.scale.set(1.05, 1.05, 1.05);
            this.threeCtx.mainParticles.rotation.y = 0.08;
            mats.uSize.value = window.innerWidth < 768 ? 2.5 : 3.5;
          }
        }

        // 3. Slide Out Loader
        const loader = this.loader;
        if (loader && window.gsap) {
          gsap.killTweensOf(loader);
          gsap.to(loader, {
            yPercent: -100,
            duration: 0.8,
            ease: 'expo.inOut',
            onComplete: () => { loader.style.display = 'none'; }
          });
        } else if (loader) {
          loader.style.display = 'none';
        }
        
        finishLoader();
      };

      if (document.getElementById('loader-skip')) {
        document.getElementById('loader-skip').addEventListener('click', skipIntro);
      }


      const timer = setInterval(() => {
        pct += (95 - pct) * 0.055 + 0.4;
        // Cap visual progress at 99% while waiting for WebGL worker
        this.setProgress(this.particlesReady ? pct : Math.min(pct, 99));

        if (pct > 45  && si === 0) { this.setStatus(statuses[1]); si++; }

        if (pct > 50 && !particlesInitDone) {
          particlesInitDone = true;
          requestAnimationFrame(() => {
            setTimeout(async () => {
              await this.initParticles(); /* WebGL or Canvas2D deferred init */
              this.particlesReady = true;
              
              if (hasResolved && this.threeCtx && !this.threeCtx.is2D) {
                 const mats = this.threeCtx.mainMat.uniforms;
                 mats.uAlpha.value = 1;
                 this.threeCtx.ambMat.uniforms.uAlpha.value = 1;
                 mats.uProgress1.value = 1;
                 mats.uProgress2.value = 1;
              }
            }, 0);
          });
        }

        if (pct > 60  && si === 1) { this.setStatus(statuses[2]); si++; }
        if (pct > 72  && si === 2) { this.setStatus(statuses[3]); si++; }
        if (pct > 83  && si === 3) { this.setStatus(statuses[4]); si++; }

        if (pct >= 94.5) {
          if (!this.particlesReady) return; // Wait for WebGL to finish booting before revealing
          clearInterval(timer);
          this.setProgress(100);
          this.setStatus(statuses[5]);

          // SLIDE LOADER UP IMMEDIATELY so Phase 2 is visible!
          const loader = this.loader;
          if (loader && window.gsap) {
            gsap.to(loader, {
              yPercent: -100,
              duration: 1.5,
              ease: 'expo.inOut',
              onComplete: () => { loader.style.display = 'none'; }
            });
          }

          /* Phase 2: Cinematic sequence of particles */
          if (this.threeCtx && !this.threeCtx.is2D) {
            const mats = this.threeCtx.mainMat.uniforms;
            this.tweenUniform(mats.uAlpha, 0, 1, 1500);
            this.tweenUniform(this.threeCtx.ambMat.uniforms.uAlpha,  0, 1, 1500);
            
            // Gentle cinematic rotation without blowing up scale, keeping particles dense and crystal clear!
            if (window.gsap && this.threeCtx.mainParticles) {
               gsap.to(this.threeCtx.mainParticles.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 6, ease: 'power2.inOut' });
               gsap.to(this.threeCtx.mainParticles.rotation, { y: 0.08, duration: 6, ease: 'power1.inOut' });
               // Crisp point size for sharp facial resolution
               gsap.to(mats.uSize, { value: window.innerWidth < 768 ? 2.5 : 3.5, duration: 6, ease: 'power2.inOut' });
            }
            
            // 1. Form okezie-1 (Actual colors) immediately as loader slides up
            phase2T1 = setTimeout(() => {
              if (window.JXAudio && window.JXAudio.enabled) window.JXAudio.morphWhisper();
              this.tweenUniform(mats.uProgress1, 0, 1, 2500); // 2.5s duration
            }, 200);
            
            // 2. Direct Morph to jx-hero-2 (Actual colors)
            phase2T2 = setTimeout(() => {
              if (window.JXAudio && window.JXAudio.enabled) window.JXAudio.morphWhisper();
              this.tweenUniform(mats.uProgress2, 0, 1, 2500); // 2.5s duration
            }, 3000); 
            
            // End Phase 2, move to Phase 3 (HTML Reveal)
            phase2T3 = setTimeout(finishLoader, 6000);
          } else {
            phase2T4 = setTimeout(finishLoader, 1500);
          }
        }
      }, 80);
    });
  },

  /* ────────────────────────────────────────────────────────────────
     5. PAGE REVEAL — Loader out, Hero in
     ──────────────────────────────────────────────────────────────── */
  revealPage () {
    const loader = this.loader;
    const page   = document.getElementById('page');

    if (!window.gsap) {
      if (loader) { loader.style.opacity = '0'; setTimeout(() => loader.style.display = 'none', 600); }
      if (page) { page.style.opacity = '1'; }
      return;
    }

    const tl = gsap.timeline();

    /* Fade page in */
    tl.to(page, { opacity: 1, duration: 0.6, ease: 'power2.out' });

    // Phase 3: Transition to Green and Lock Background
    tl.call(() => {
      if (this.threeCtx && !this.threeCtx.is2D) {
        const mats = this.threeCtx.mainMat.uniforms;
        
        // Lock to portrait, clear uProgress1 so scroll morphs work cleanly
        mats.uProgress1.value = 0.0;
        mats.uProgress2.value = 1.0; 
        
        // Keep jx-hero-2 crystal clear with a subtle 15% cybernetic matrix tint
        this.tweenUniform(mats.uGreenMix, 0, 0.15, 3000);

        // Shrink particles back to normal Phase 3 size and reset rotation/size
        if (window.gsap && this.threeCtx.mainParticles) {
          const baseSize = window.innerWidth < 768 ? 1.8 : 2.8;
          gsap.to(this.threeCtx.mainParticles.scale, { x: 1, y: 1, z: 1, duration: 2.5, ease: 'power2.inOut' });
          gsap.to(this.threeCtx.mainParticles.rotation, { y: 0, duration: 2.5, ease: 'power2.inOut' });
          gsap.to(mats.uSize, { value: baseSize, duration: 2.5, ease: 'power2.inOut' });
        }
      }
    });

    /* Hero elements cascade */
    tl.to(['#hero-eyebrow'], { opacity: 1, duration: 0.6, ease: 'power3.out' }, '+=0.2');

    if (window.SplitText) {
      /* Phase 4: Char-by-char slide-up from behind mask — signature SOTD effect */
      gsap.registerPlugin(SplitText);
      const split1 = SplitText.create('#hl-1', { type: 'words,chars', mask: 'chars' });
      const split2 = SplitText.create('#hl-2', { type: 'words,chars', mask: 'chars' });
      gsap.set(['#hl-1', '#hl-2'], { opacity: 1, y: 0, yPercent: 0 }); // parent spans visible; inline transform overrides CSS
      tl.from([...split1.chars, ...split2.chars], {
        yPercent: 100, duration: 0.85, ease: 'expo.out',
        stagger: { each: 0.032, from: 'start' }
      }, '-=0.3');
    } else {
      /* Fallback: word-level reveal (GSAP loaded but SplitText unavailable) */
      tl.to(['#hl-1', '#hl-2'], {
        yPercent: 0, opacity: 1, duration: 0.9,
        ease: 'expo.out', stagger: 0.08
      }, '-=0.3');
    }

    tl.to(['#hr-1', '#hr-2', '#hr-3', '.hero-role-separator'], {
      opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.06
    }, '-=0.4');

    tl.to('#hero-desc', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.2');
    tl.to('#hero-cta',  { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.2');

    tl.to('#hero-meta', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.5');
    tl.to('#hero-hud',  { opacity: 1, duration: 0.8, ease: 'power2.out', stagger: 0.08 }, '-=0.6');
    tl.to('#hero-scroll', { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.2');
  },

  /* ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
     3C. TYPE-TO-FORM
     Keystrokes rewrite aTarget3 via createTextCanvas(), tweening
     uProgress3 to 1 so particles sculpt the typed text in real time.
     After 3 s of silence they return to 0 (name formation restores).
     ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
  initTypeToForm () {
    /* Requires WebGL path — no-op on Canvas2D fallback */
    if (!this.threeCtx || this.threeCtx.is2D) return;
    if (!this._createTextCanvas || !this._pText) return;

    const THROTTLE_MS  = 100;
    const HOLD_MS      = 3000;
    const TWEEN_IN_MS  = 500;
    const TWEEN_OUT_MS = 800;
    const MAX_CHARS    = 18; /* keep it legible on the canvas */

    let typed       = '';
    let lastWrite   = 0;
    let idleTimer   = null;

    const rewrite = () => {
      const ctx = this.threeCtx;
      if (!ctx || ctx.is2D) return;

      const mats    = ctx.mainMat.uniforms;
      const geo     = ctx.mainParticles.geometry;
      const attr    = geo.getAttribute('aTarget3');
      if (!attr) return;

      /* Rebuild pText with typed string */
      const display = typed.toUpperCase().trim() || 'OKEZIE';
      /* Split at midpoint for two-line layout if long enough */
      let l1, l2;
      if (display.length <= 8) {
        l1 = display; l2 = '';
      } else {
        const mid = Math.ceil(display.length / 2);
        l1 = display.slice(0, mid);
        l2 = display.slice(mid);
      }
      this._createTextCanvas(l1, l2);

      /* Write new positions into the existing BufferAttribute */
      const pts    = this._pText();
      const count  = attr.count;
      for (let i = 0; i < count; i++) {
        const idx = Math.floor((i / count) * pts.length);
        const p   = pts[idx] || { x: 0, y: 0, z: 0 };
        attr.setXYZ(i, p.x, p.y, p.z);
      }
      attr.needsUpdate = true;

      /* Tween uProgress3 to 1 */
      this.tweenUniform(mats.uProgress3, mats.uProgress3.value, 1, TWEEN_IN_MS);

      /* Schedule idle fade-out */
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        this.tweenUniform(mats.uProgress3, mats.uProgress3.value, 0, TWEEN_OUT_MS);
        typed = '';
      }, HOLD_MS);
    };

    document.addEventListener('keydown', e => {
      /* Guard 1: pong active */
      if (this._pongActive) return;

      /* Guard 2: an input / textarea / contenteditable or the CLI is focused */
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === 'INPUT' ||
         active.tagName === 'TEXTAREA' ||
         active.isContentEditable ||
         active.closest('#cli-panel'))
      ) return;

      /* Guard 3: only printable single characters; skip modifiers */
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) {
        /* Backspace support */
        if (e.key === 'Backspace') {
          typed = typed.slice(0, -1);
        } else {
          return;
        }
      } else {
        typed = (typed + e.key).slice(-MAX_CHARS);
      }

      /* Guard 4: throttle to at most one buffer rewrite per 100 ms */
      const now = performance.now();
      if (now - lastWrite < THROTTLE_MS) return;
      lastWrite = now;

      rewrite();
    });
  },

  /* ────────────────────────────────────────────────────────────────
     6. AFTER REVEAL — all remaining system boots
     ──────────────────────────────────────────────────────────────── */
  afterReveal () {
    /* Load ScrollTrigger dynamically — it is not needed until after the loader exits,
       so we defer it entirely from the initial page load to keep the critical path lean.
       Once loaded: register plugin, wire Lenis integration, run all scroll animations. */
    const runScrollAnimations = () => {
      if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        /* Re-wire Lenis → ScrollTrigger integration (initLenis ran before ST was available) */
        if (window.JXLenis && !window.JXLenis._stWired) {
          window.JXLenis.on('scroll', ScrollTrigger.update);
          window.JXLenis._stWired = true;
        }
        this.initSplitTextReveals(); /* Phase 4: run before generic reveal scan */
        this.initScrollAnimations();
      }
    };

    if (window.ScrollTrigger) {
      /* Already loaded (e.g. cached from previous navigation) */
      runScrollAnimations();
    } else {
      const st = document.createElement('script');
      st.src = 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js';
      st.onload = runScrollAnimations;
      st.onerror = () => console.warn('JX: ScrollTrigger failed to load — scroll animations disabled.');
      document.head.appendChild(st);
    }

    this.initOrganicFloat();
    this.initHUD();
    this.initCLI();
    this.initTypeToForm();
    this.loadFeaturedProjects();
    this.loadTestimonials();
    this.loadTools();
  },

  /* ────────────────────────────────────────────────────────────────
     6b. SPLITTEXT SECTION HEADING REVEALS (Phase 4)
     Character-level ScrollTrigger reveals for all section h2 headings.
     Runs before initScrollAnimations() so it can strip the 'reveal' class
     from elements it owns, preventing double-animation.
     ──────────────────────────────────────────────────────────────── */
  initSplitTextReveals () {
    if (!window.gsap || !window.SplitText || !window.ScrollTrigger) return;
    const prefsRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.registerPlugin(SplitText, ScrollTrigger);

    /* Targets: section h2 headings outside the hero */
    const headings = document.querySelectorAll(
      'h2.featured-title, h2.headline-lg.reveal'
    );

    if (prefsRM) {
      headings.forEach(el => {
        el.classList.remove('reveal');
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    headings.forEach(el => {
      /* Remove 'reveal' class so generic initScrollAnimations() skips this element */
      el.classList.remove('reveal');
      el.style.opacity = '1'; // parent visible; chars masked by SplitText

      const split = SplitText.create(el, { type: 'words,chars', mask: 'chars' });

      gsap.from(split.chars, {
        yPercent: 100,
        opacity: 0,
        duration: 0.7,
        ease: 'expo.out',
        stagger: { each: 0.022 },
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          once: true,
        }
      });
    });
  },

  /* ────────────────────────────────────────────────────────────────
     7. SCROLL ANIMATIONS
     ──────────────────────────────────────────────────────────────── */
  initScrollAnimations () {
    /* Particle Morphing ScrollTriggers */
    const prefsRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.threeCtx && !this.threeCtx.is2D && window.gsap && window.ScrollTrigger && !prefsRM) {
      const mats = this.threeCtx.mainMat.uniforms;
      
      // About Section -> Portrait (Target 4)
      gsap.to(mats.uProgress4, {
        value: 1,
        scrollTrigger: { trigger: '.about-strip', start: 'top bottom', end: 'center center', scrub: true }
      });

      // Work Section -> Coder (Target 5)
      gsap.to(mats.uProgress5, {
        value: 1,
        scrollTrigger: { trigger: '.featured-section', start: 'top bottom', end: 'center center', scrub: true }
      });

      // Services Section -> Designer (Target 6)
      gsap.to(mats.uProgress6, {
        value: 1,
        scrollTrigger: { trigger: '.services-strip', start: 'top bottom', end: 'center center', scrub: true }
      });
    }

    const heroEl = document.getElementById('hero');
    const reveals = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur'
    );

    reveals.forEach(el => {
      /* Skip elements already animated by the GSAP hero entrance timeline */
      if (heroEl && heroEl.contains(el)) return;
      const isLeft  = el.classList.contains('reveal-left');
      const isRight = el.classList.contains('reveal-right');
      const isScale = el.classList.contains('reveal-scale');
      const isBlur  = el.classList.contains('reveal-blur');

      const from = isLeft  ? { opacity: 0, x: -40 }
                 : isRight ? { opacity: 0, x: 40  }
                 : isScale ? { opacity: 0, scale: 0.92 }
                 : isBlur  ? { opacity: 0, filter: 'blur(12px)' }
                 : { opacity: 0, y: 40 };

      const to = isLeft || isRight ? { opacity: 1, x: 0 }
               : isScale           ? { opacity: 1, scale: 1 }
               : isBlur            ? { opacity: 1, filter: 'blur(0px)' }
               : { opacity: 1, y: 0 };

      if (prefsRM) {
        gsap.set(el, to);
      } else {
        gsap.fromTo(el, from, {
          ...to,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          }
        });
      }
    });

    /* Service cards stagger */
    if (prefsRM) {
      gsap.set('.service-card', { opacity: 1, y: 0 });
    } else {
      gsap.fromTo('.service-card', { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: { trigger: '.services-grid', start: 'top 85%', once: true }
      });
    }
  },

  /* ────────────────────────────────────────────────────────────────
     7b. PONG GAME ENGINE — Phase 4
     ──────────────────────────────────────────────────────────────── */
  initPong: async function(...args) { const m = await import('./src/pong.js'); m.attach(this); return this.initPong(...args); },

  /* ────────────────────────────────────────────────────────────────
     ORGANIC FLOAT (JS Perlin-like motion for Hero SVGs)
     ──────────────────────────────────────────────────────────────── */
  initOrganicFloat () {
    const symbols = document.querySelectorAll('.hero-symbol');
    if (!symbols.length) return;
    
    const configs = Array.from(symbols).map(() => ({
      freqX: (Math.random() * 0.5 + 0.5) * 0.001,
      freqY: (Math.random() * 0.5 + 0.5) * 0.001,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      ampX: Math.random() * 10 + 10,
      ampY: Math.random() * 15 + 20
    }));
    
    let floatRaf;
    let isVisible = true;

    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
      if (isVisible) requestAnimationFrame(animate);
    }, { rootMargin: '100px' });
    
    const hero = document.getElementById('hero');
    if (hero) observer.observe(hero);

    const animate = (time) => {
      if (!isVisible) return;
      symbols.forEach((sym, i) => {
        const conf = configs[i];
        const x = Math.sin(time * conf.freqX + conf.phaseX) * conf.ampX;
        const y = Math.sin(time * conf.freqY + conf.phaseY) * conf.ampY;
        sym.style.transform = `translate(${x}px, ${y}px)`;
      });
      floatRaf = requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  },

  /* ────────────────────────────────────────────────────────────────
     8. HUD WIDGETS
     ──────────────────────────────────────────────────────────────── */
  initHUD () {
    /* Clock */
    const clockEl = document.getElementById('hero-clock');
    if (clockEl) {
      window.JX && window.JX.nav && window.JX.nav.startClock
        ? window.JX.nav.startClock(clockEl)
        : this.startClock(clockEl);
    }

    /* Availability from Supabase */
    this.loadHUDStatus();
  },

  startClock (el) {
    const update = () => {
      el.textContent = 'NGT ' + new Date().toLocaleTimeString('en-GB', {
        timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    };
    update();
    setInterval(update, 1000);
  },

  async loadHUDStatus () {
    const statusEl = document.getElementById('hud-status');
    const countEl  = document.getElementById('hud-project-count');
    const statEl   = document.getElementById('stat-projects');

    try {
      if (window.initSupabase) await window.initSupabase();
      if (typeof supabase === 'undefined' || !supabase.from) return;

      /* Availability */
      const { data: av } = await supabase
        .from('site_settings').select('value').eq('key', 'availability_status').maybeSingle();
      if (av && statusEl) {
        if (av.value === 'available') statusEl.textContent = '● Available';
        else if (av.value === 'limited') { statusEl.textContent = '◐ Limited'; statusEl.style.color = 'var(--amber)'; }
        else { statusEl.textContent = '○ Unavailable'; statusEl.style.color = 'var(--gray-3)'; }
      }

      /* Project count */
      const { count } = await supabase
        .from('projects').select('*', { count: 'exact', head: true });
      if (count !== null) {
        if (countEl) countEl.textContent = String(count).padStart(2, '0');
        if (statEl)  statEl.textContent  = count + '+';
      }
    } catch (_) {}
  },

  /* ────────────────────────────────────────────────────────────────
     9. FEATURED PROJECTS
     ──────────────────────────────────────────────────────────────── */
  async loadFeaturedProjects () {
    const grid = document.getElementById('featured-grid');
    if (!grid) return;
    try {
      if (window.initSupabase) await window.initSupabase();
    } catch (err) {
      console.warn("Supabase init failed", err);
    }
    if (typeof supabase === 'undefined' || !supabase.from) return;

    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('featured', true)
        .order('priority', { ascending: true })
        .limit(6);

      let renderList = projects;
      if (error || !projects || projects.length === 0) {
        /* Local fallback project data (concept flag added) */
        renderList = [
          {
            id: 'fallback-1',
            title: 'Neural Cursor Engine',
            category: 'Experiment',
            year: '2026',
            description: 'A study in cursor tracking, particle morphing, and reactive WebGL aesthetics.',
            tools: ['WebGL', 'GLSL', 'GSAP'],
            concept: true
          },
          {
            id: 'fallback-2',
            title: 'Particle Pong',
            category: 'Interactive',
            year: '2026',
            description: 'Classic arcade mechanics recreated using fluid simulations and 55,000 points.',
            tools: ['Three.js', 'Physics'],
            concept: true
          },
          {
            id: 'fallback-3',
            title: 'Audio Synesthesia',
            category: 'Sound Design',
            year: '2026',
            description: 'Procedural audio generation reacting to scroll velocity and particle interactions.',
            tools: ['Web Audio API'],
            concept: true
          }
        ];
      }

      grid.innerHTML = renderList.map((p, i) => this.renderProjectCard(p, i)).join('');

      /* Animate the whole container in on scroll */
      if (window.gsap) {
        gsap.fromTo(grid, { opacity: 0, y: 40 }, {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: grid, start: 'top 85%', once: true }
        });
      }

      /* Boot the Reelfolio hover interaction (initializes layout + sets up tracking) */
      this.initVaultHover();

      /* Bind card clicks */
      grid.querySelectorAll('.reelfolio-card').forEach((card, i) => {
        const p = renderList[i];
        if (!p) return;
        const handleClick = () => {
          if (p.slug) {
            window.location.href = `project.html?slug=${encodeURIComponent(p.slug)}`;
          } else if (p.case_study && p.case_study.startsWith('/projects/')) {
            window.location.href = p.case_study;
          } else {
            this.openModal(p);
          }
        };
        card.addEventListener('click', handleClick);
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } });
      });

      /* Refresh cursor hover states */
      if (window.JX && window.JX.refreshCursor) window.JX.refreshCursor();

    } catch (err) {
      console.error('JX: Featured projects error:', err);
    }
  },

  renderProjectCard (p, i) {
    /* Reelfolio Hover — Interactive Horizontal Card Fan */
    const title     = p.title || 'Untitled';
    const category  = p.category || 'Project';
    const year      = p.year || '';
    const hasImage  = !!p.image_url;
    const isVid     = hasImage && (p.image_url.toLowerCase().endsWith('.mp4') || p.image_url.toLowerCase().endsWith('.webm'));
    const sub       = [category, year].filter(Boolean).join(' / ');

    const media = hasImage 
      ? (isVid ? `<video src="${p.image_url}" class="reelfolio-card-img" autoplay loop muted playsinline loading="lazy"></video>` : `<img src="${p.image_url}" alt="${escapeHTML(title)}" class="reelfolio-card-img" loading="lazy">`)
      : `<div class="reelfolio-card-ph">${title.slice(0, 2).toUpperCase()}</div>`;

    return `
      <article class="reelfolio-card" role="listitem" tabindex="0" aria-label="View project: ${escapeHTML(title)}">
        ${media}
        <div class="reelfolio-card-overlay">
          <h3 class="reelfolio-card-title">${escapeHTML(title)}</h3>
          <span class="reelfolio-card-sub">${escapeHTML(sub)}</span>
        </div>
      </article>
    `;
  },

  /* ────────────────────────────────────────────────────────────────
     9b. VAULT REELFOLIO HOVER (THE HYBRID "MERGE")
     Combines the sweeping horizontal 3D rotation fan with a highly
     tactile, specific vertical 'pop-up' when hovering individual cards.
     ──────────────────────────────────────────────────────────────── */
  initVaultHover () {
    if (!window.gsap) return;

    const container = document.getElementById('featured-grid');
    if (!container) return;
    
    const cards = Array.from(container.querySelectorAll('.reelfolio-card'));
    if (!cards.length) return;

    const isHoverable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (!isHoverable) {
      if (!window.ScrollTrigger) {
        setTimeout(() => this.initVaultHover(), 100);
        return;
      }
      /* Mobile Scroll-Driven Stack Peel */
      const numCards = cards.length;
      
      // Initial Stack State
      // Initial Stack State (Deeper, more elegant spacing)
      cards.forEach((card, i) => {
        gsap.set(card, {
          xPercent: -50,
          yPercent: -50,
          y: i * 25,
          scale: 1 - i * 0.06,
          zIndex: numCards - i,
          opacity: 1 - i * 0.2
        });
      });

      // Native Sticky Scrub (No JS Pinning)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.featured-section',
          start: "top top",
          end: "bottom bottom", 
          scrub: 1 // Adds luxurious fluid momentum to the scroll
        }
      });

      // Smoother Peeling Animation
      cards.forEach((card, i) => {
        if (i < numCards - 1) {
          // Top card peels UP, slightly sideways, and fades out
          tl.to(card, {
            y: -window.innerHeight * 0.8,
            x: (i % 2 === 0 ? -40 : 40), // Gentle horizontal drift
            rotation: (i % 2 === 0 ? -5 : 5), // Softer, more elegant rotation
            opacity: 0,
            duration: 1,
            ease: "power2.inOut" // Silkier easing
          }, i);

          // All cards beneath it elegantly slide up and brighten
          for (let j = i + 1; j < numCards; j++) {
            tl.to(cards[j], {
              y: (j - i - 1) * 25,
              scale: 1 - (j - i - 1) * 0.06,
              opacity: 1 - (j - i - 1) * 0.2,
              duration: 1,
              ease: "power2.inOut" // Match the top card's smoothness
            }, i); 
          }
        }
      });

      return;
    }

    const numCards = cards.length;
    let activeIndex = -1;

    // Securely center all absolute cards
    cards.forEach(card => gsap.set(card, { xPercent: -50, yPercent: -50 }));

    /* Core function to update the physics of the entire deck */
    const updateDeck = (hoveredIndex) => {
      cards.forEach((card, i) => {
        let x = 0, y = 0, rot = 0, scale = 1, zIndex = 1;
        
        // Base horizontal spread across the container
        const offsetFromCenter = i - (numCards - 1) / 2;
        const baseX = offsetFromCenter * 45; // e.g. for 6 cards: -112.5, -67.5...
        
        if (hoveredIndex === -1) {
          /* 1. IDLE STATE: A gentle, centered fan */
          x = baseX;
          y = Math.abs(offsetFromCenter) * 8;
          rot = offsetFromCenter * 5;
          scale = 0.95 - Math.abs(offsetFromCenter) * 0.015;
          zIndex = i;
        } else {
          /* 2. ACTIVE SWEEP STATE: The hovered card pops, others sweep away */
          const diff = i - hoveredIndex;
          
          if (diff === 0) {
            // THE LIFT (The exact card being hovered)
            x = baseX;      // Stay anchored to its natural horizontal zone so it doesn't run away from the mouse
            y = -45;        // Proudly pop vertically up
            rot = 0;        // Straighten out perfectly
            scale = 1.15;   // Grow larger
            zIndex = 50;    // Jump to absolute front
          } else {
            // THE SWEEP/FAN (Cards giving way)
            x = baseX + (Math.sign(diff) * 55); // Push away from the center card
            y = Math.abs(diff) * 12;            // Push slightly down into the background
            rot = diff * 10;                    // Fan outward (left leans left, right leans right)
            scale = 0.95 - Math.abs(diff) * 0.03; // Shrink slightly the further away they are
            zIndex = 10 - Math.abs(diff);       // Layer sequentially behind
          }
        }

        /* 3. FLUID TRANSITION: Use a silky smooth spring-like ease */
        gsap.to(card, {
          x: x, 
          y: y, 
          rotation: rot, 
          scale: scale, 
          zIndex: zIndex,
          duration: 0.55, 
          ease: 'power3.out', // Extremely fluid and responsive
          overwrite: 'auto'
        });
      });
    };

    /* Initialize the deck to the idle fan */
    updateDeck(-1);

    /* Event Listeners: Trigger animations strictly on physical card hover */
    cards.forEach((card, i) => {
      card.addEventListener('mouseenter', () => {
        if (activeIndex !== i) {
          activeIndex = i;
          updateDeck(i);
        }
      });
    });

    /* Return to the gentle fan ONLY when the mouse leaves the entire container */
    container.addEventListener('mouseleave', () => {
      activeIndex = -1;
      updateDeck(-1);
    });
  },

  /* ────────────────────────────────────────────────────────────────
     10. CINEMATIC MODAL
     ──────────────────────────────────────────────────────────────── */
  openModal: async function(...args) { const m = await import('./src/modal.js'); m.attach(this); return this.openModal(...args); },

  closeModal: async function(...args) { const m = await import('./src/modal.js'); m.attach(this); return this.closeModal(...args); },

  /* ────────────────────────────────────────────────────────────────
     12. JX TERMINAL — CLI
     ──────────────────────────────────────────────────────────────── */
  initCLI: async function(...args) { const m = await import('./src/cli.js'); m.attach(this); return this.initCLI(...args); },

  /* ────────────────────────────────────────────────────────────────
     13. TESTIMONIALS
     ──────────────────────────────────────────────────────────────── */
  loadTestimonials: async function(...args) { const m = await import('./src/testimonials.js'); m.attach(this); return this.loadTestimonials(...args); },

  /* ────────────────────────────────────────────────────────────────
     14. TOOLS / STACK
     ──────────────────────────────────────────────────────────────── */
  loadTools: async function(...args) { const m = await import('./src/tools.js'); m.attach(this); return this.loadTools(...args); },};

/* ── Boot ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => JXUniverse.init());
} else {
  JXUniverse.init();
}

/* ── Service Worker Registration ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('SW registration failed:', err);
    });
  });
}

/* ── HUD Scroll Logic ── */
document.addEventListener('DOMContentLoaded', () => {
  const heroHud = document.getElementById('hero-hud');
  if (heroHud) {
    let isPastHero = false;

    window.addEventListener('scroll', () => {
      isPastHero = window.scrollY > window.innerHeight * 0.7;
      if (isPastHero) {
        heroHud.classList.add('hud-hidden');
      } else {
        heroHud.classList.remove('hud-hidden');
        heroHud.classList.remove('hud-force-show');
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isPastHero) {
        if (e.clientX > window.innerWidth - 350) {
          heroHud.classList.add('hud-force-show');
        } else {
          heroHud.classList.remove('hud-force-show');
        }
      }
    });
  }
});

/* ── Auto-fit Hero Text ── */
function autoFitHeroText() {
  const lines = document.querySelectorAll('.hero-name-line');
  if (!lines.length) return;

  lines.forEach(line => {
    // Reset inline font size so CSS clamp applies again
    line.style.fontSize = '';
    
    // Check if the text overflows its container
    if (line.scrollWidth > line.clientWidth) {
      let currentSize = parseFloat(window.getComputedStyle(line).fontSize);
      
      // Reduce font size until it fits, with a 24px floor
      while (line.scrollWidth > line.clientWidth && currentSize > 24) {
        currentSize -= 1;
        line.style.fontSize = currentSize + 'px';
      }
    }
  });
}

// Run safely after fonts load to ensure accurate measurements
// Resize listener is debounced to prevent layout-thrash during continuous resize
(function() {
  let resizeTimer = null;
  function debouncedAutoFit() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(autoFitHeroText, 120);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      autoFitHeroText();
      window.addEventListener('resize', debouncedAutoFit, { passive: true });
    });
  } else {
    window.addEventListener('load', autoFitHeroText);
    window.addEventListener('resize', debouncedAutoFit, { passive: true });
  }
})();

// Bento Box Mouse Tracking — cached rects to avoid layout thrash on every move
(function() {
  let bentoRects = [];
  let bentoItems = [];
  let rafPending = false;
  let lastX = 0, lastY = 0;

  function cacheBentoRects() {
    bentoItems = Array.from(document.querySelectorAll('.bento-item'));
    bentoRects = bentoItems.map(item => item.getBoundingClientRect());
  }

  function applyBentoSpotlight() {
    rafPending = false;
    bentoItems.forEach((item, i) => {
      const rect = bentoRects[i];
      if (!rect) return;
      item.style.setProperty('--mouse-x', `${lastX - rect.left}px`);
      item.style.setProperty('--mouse-y', `${lastY - rect.top}px`);
    });
  }

  // Cache after DOM is settled, and on resize
  requestAnimationFrame(cacheBentoRects);
  window.addEventListener('resize', cacheBentoRects, { passive: true });

  document.addEventListener('mousemove', (e) => {
    lastX = e.clientX;
    lastY = e.clientY;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(applyBentoSpotlight);
    }
  }, { passive: true });
})();

// Global GSAP/ScrollTrigger cleanup for page transitions
window.addEventListener("beforeunload", () => {
  if (window.ScrollTrigger) window.ScrollTrigger.getAll().forEach(t => t.kill());
  if (window.gsap) window.gsap.globalTimeline.clear();
});
