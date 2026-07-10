/* =========================================
   JX Design & Dev — Portfolio
   script.js — Core Initialization
   ========================================= */

(function () {
  'use strict';

  /* ---- Custom Cursor (Dennis Snellenberg style) ---- */
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursor-follower');

  let mouseX = 0;
  let mouseY = 0;
  let followerX = 0;
  let followerY = 0;
  const followerSpeed = 0.1; // lerp factor — lower = more lag

  // Track mouse & move dot via GSAP (near-instant, buttery smooth)
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Dot follows mouse with GSAP — ultra-fast tween
    gsap.to(cursor, {
      left: mouseX,
      top: mouseY,
      duration: 0.08,
      ease: 'none',
      overwrite: true,
    });
  });

  // Follower ring — smooth lerp via requestAnimationFrame
  function animateFollower() {
    followerX += (mouseX - followerX) * followerSpeed;
    followerY += (mouseY - followerY) * followerSpeed;

    follower.style.left = followerX + 'px';
    follower.style.top = followerY + 'px';

    requestAnimationFrame(animateFollower);
  }
  animateFollower();

  // Hover detection — links, buttons, .btn, .tag elements
  function addCursorHoverListeners() {
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
  }

  // Fade cursor out when mouse leaves the document
  document.addEventListener('mouseleave', () => {
    gsap.to(cursor, { opacity: 0, duration: 0.3, ease: 'power2.out' });
    gsap.to(follower, { opacity: 0, duration: 0.3, ease: 'power2.out' });
  });

  // Fade cursor back in when mouse enters the document
  document.addEventListener('mouseenter', () => {
    gsap.to(cursor, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    gsap.to(follower, { opacity: 0.5, duration: 0.3, ease: 'power2.out' });
  });

  /* ---- Lenis Smooth Scroll ---- */
  let lenisInstance = null;

  function initLenis() {
    if (typeof Lenis === 'undefined') return;

    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    // Connect Lenis to GSAP ScrollTrigger
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenisInstance.on('scroll', ScrollTrigger.update);

      gsap.ticker.add((time) => {
        lenisInstance.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---- Navigation Scroll Behavior ---- */
  /* NOTE: Handled by nav.js (shared across all pages) */

  /* ---- Mobile Menu ---- */
  /* NOTE: Handled by nav.js (shared across all pages) */

  /* ---- Cinematic Loader Animation ---- */
  function playLoader() {
    const loader = document.getElementById('loader');
    const loaderBar = document.getElementById('loader-bar');
    const loaderLogo = document.querySelector('.loader-logo');

    // Lock scroll during loader
    document.body.style.overflow = 'hidden';

    const tl = gsap.timeline({
      onComplete: () => {
        // Remove loader from DOM after animation
        loader.style.display = 'none';
        // Unlock scroll
        document.body.style.overflow = '';
        // Trigger hero entrance
        heroEnter();
      },
    });

    // Step 1: Bar fills from 0% to 100%
    tl.to(loaderBar, {
      width: '100%',
      duration: 1.2,
      ease: 'power2.inOut',
    });

    // Step 2: Logo scales up then fades out
    tl.to(loaderLogo, {
      scale: 1.1,
      duration: 0.2,
      ease: 'power2.out',
    });
    tl.to(loaderLogo, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out',
    });

    // Step 3: Entire loader slides UP off screen
    tl.to(loader, {
      y: '-100%',
      duration: 0.8,
      ease: 'power4.inOut',
    });
  }

  /* ---- Three.js Hero Particles ---- */
  let particleSystem = null;
  let particlePositions = null;
  let particleSpeeds = null;

  function initHeroParticles() {
    if (typeof THREE === 'undefined') return;

    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create particles based on global styles
    let intensity = 50;
    let particleColor = 0x33ff14;
    
    if (window.jxGlobalStyles) {
      if (window.jxGlobalStyles.particle_intensity !== undefined) {
        intensity = window.jxGlobalStyles.particle_intensity;
      }
      if (window.jxGlobalStyles.primary_color) {
        particleColor = parseInt(window.jxGlobalStyles.primary_color.replace('#', '0x'));
      }
    }
    
    const particleCount = Math.floor((intensity / 50) * 1800);
    if (particleCount <= 0) return; // Disable particles if intensity is 0

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1000;     // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 800;  // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 600;  // z
      speeds[i] = 0.2 + Math.random() * 0.6;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlePositions = positions;
    particleSpeeds = speeds;

    const material = new THREE.PointsMaterial({
      color: particleColor,
      size: 1.8,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // Mouse rotation targets
    let targetRotX = 0;
    let targetRotY = 0;

    document.addEventListener('mousemove', (e) => {
      targetRotX = ((e.clientY / window.innerHeight) - 0.5) * 0.3;
      targetRotY = ((e.clientX / window.innerWidth) - 0.5) * 0.3;
    });

    // Animation loop
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Drift particles upward with sine wave
      for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3 + 1] += particleSpeeds[i] * 0.3;
        particlePositions[i * 3] += Math.sin(elapsed + i * 0.01) * 0.08;

        // Reset to bottom when off top
        if (particlePositions[i * 3 + 1] > 400) {
          particlePositions[i * 3 + 1] = -400;
          particlePositions[i * 3] = (Math.random() - 0.5) * 1000;
        }
      }
      geometry.attributes.position.needsUpdate = true;

      // Lerp rotation toward mouse target
      particleSystem.rotation.x += (targetRotX - particleSystem.rotation.x) * 0.02;
      particleSystem.rotation.y += (targetRotY - particleSystem.rotation.y) * 0.02;

      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    window.addEventListener('resize', () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  /* ---- Water Ripple Effect (right side of hero) ---- */
  function initWaterRipple() {
    const canvas = document.getElementById('water-canvas');
    const heroWrap = document.querySelector('.hero-image-wrap');
    const heroSection = document.getElementById('hero');
    if (!canvas || !heroWrap || !heroSection) return;

    const ctx = canvas.getContext('2d');
    let ripples = [];
    let animFrameId = null;
    let lastRippleTime = 0;
    const RIPPLE_THROTTLE = 80; // ms between new ripples
    const RIPPLE_MAX_AGE = 1200; // ms
    const RIPPLE_MAX_RADIUS = 250;
    const RIPPLE_RING_COUNT = 5;
    const NEON_R = 51, NEON_G = 255, NEON_B = 20;

    // Resize canvas to match container
    function resizeCanvas() {
      const rect = heroWrap.getBoundingClientRect();
      canvas.width = rect.width * Math.min(window.devicePixelRatio, 2);
      canvas.height = rect.height * Math.min(window.devicePixelRatio, 2);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(
        Math.min(window.devicePixelRatio, 2),
        Math.min(window.devicePixelRatio, 2)
      );
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse over the hero area — only right side
    heroSection.addEventListener('mousemove', (e) => {
      const heroRect = heroSection.getBoundingClientRect();
      const wrapRect = heroWrap.getBoundingClientRect();

      // Only trigger if mouse is over the right portion (image area)
      if (e.clientX < wrapRect.left) return;

      const now = performance.now();
      if (now - lastRippleTime < RIPPLE_THROTTLE) return;
      lastRippleTime = now;

      // Convert mouse position to canvas-local coordinates
      const x = e.clientX - wrapRect.left;
      const y = e.clientY - wrapRect.top;

      ripples.push({
        x: x,
        y: y,
        born: now,
        maxRadius: RIPPLE_MAX_RADIUS + Math.random() * 80,
      });

      // Activate canvas visibility
      canvas.classList.add('active');
    });

    // Render loop
    function renderRipples() {
      const now = performance.now();
      const rect = heroWrap.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Remove expired ripples
      ripples = ripples.filter(r => (now - r.born) < RIPPLE_MAX_AGE);

      if (ripples.length === 0) {
        animFrameId = requestAnimationFrame(renderRipples);
        return;
      }

      for (let i = 0; i < ripples.length; i++) {
        const ripple = ripples[i];
        const age = now - ripple.born;
        const progress = age / RIPPLE_MAX_AGE; // 0 → 1
        const currentMaxRadius = ripple.maxRadius * easeOutCubic(progress);

        // Overall fade: strong at start, gone at end
        const masterAlpha = (1 - progress) * (1 - progress);

        // Draw concentric rings
        for (let ring = 0; ring < RIPPLE_RING_COUNT; ring++) {
          const ringProgress = ring / RIPPLE_RING_COUNT;
          const radius = currentMaxRadius * (1 - ringProgress * 0.7);

          if (radius < 2) continue;

          // Sine wave modulation for organic feel
          const wave = Math.sin(ringProgress * Math.PI * 3 + progress * 8);
          const ringAlpha = masterAlpha * 0.15 * (0.5 + wave * 0.5) * (1 - ringProgress * 0.6);

          if (ringAlpha < 0.005) continue;

          // Ring thickness varies
          const thickness = 1.5 + (1 - ringProgress) * 2;

          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${NEON_R}, ${NEON_G}, ${NEON_B}, ${ringAlpha})`;
          ctx.lineWidth = thickness;
          ctx.stroke();
        }

        // Central glow dot (fades quickly)
        if (progress < 0.3) {
          const dotAlpha = (1 - progress / 0.3) * 0.2;
          const gradient = ctx.createRadialGradient(
            ripple.x, ripple.y, 0,
            ripple.x, ripple.y, 20
          );
          gradient.addColorStop(0, `rgba(${NEON_R}, ${NEON_G}, ${NEON_B}, ${dotAlpha})`);
          gradient.addColorStop(1, `rgba(${NEON_R}, ${NEON_G}, ${NEON_B}, 0)`);
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, 20, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      }

      animFrameId = requestAnimationFrame(renderRipples);
    }

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    // Start render loop
    renderRipples();
  }

  /* ---- Hero Enter — triggered after loader exits ---- */
  function heroEnter() {
    const nav = document.getElementById('nav');
    const heroCanvas = document.getElementById('hero-canvas');
    const heroWrap = document.querySelector('.hero-image-wrap');
    const heroEyebrow = document.querySelector('.hero-eyebrow');
    const titleLines = document.querySelectorAll('.title-line');
    const heroSub = document.querySelector('.hero-sub');
    const heroCta = document.querySelector('.hero-cta');
    const tags = document.querySelectorAll('.tag');
    const badges = document.querySelectorAll('.badge');
    const scrollIndicator = document.querySelector('.scroll-indicator');

    // Set initial states
    gsap.set(heroCanvas, { opacity: 0 });
    gsap.set(heroWrap, { opacity: 0, scale: 1.08, x: 60 });
    gsap.set(heroEyebrow, { opacity: 0, x: -40 });
    gsap.set(titleLines, { opacity: 0, y: 100, skewY: 6 });
    gsap.set(heroSub, { opacity: 0, y: 30 });
    gsap.set(heroCta, { opacity: 0, y: 20 });
    gsap.set(tags, { opacity: 0, y: 14 });
    gsap.set(badges, { opacity: 0, y: -14 });
    gsap.set(scrollIndicator, { opacity: 0 });

    // Build cinematic entrance timeline
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Nav
    tl.to(nav, {
      opacity: 1, y: 0, duration: 0.8,
    }, 0);

    // Canvas fade in
    tl.to(heroCanvas, {
      opacity: 1, duration: 2, ease: 'power2.out',
    }, 0);

    // Photo reveal (animates entire wrap — active image visible inside)
    tl.to(heroWrap, {
      opacity: 1, scale: 1, x: 0, duration: 1.8, ease: 'power2.out',
    }, 0.3);

    // Eyebrow
    tl.to(heroEyebrow, {
      opacity: 1, x: 0, duration: 0.9,
    }, 0.9);

    // Title lines stagger
    tl.to(titleLines, {
      opacity: 1, y: 0, skewY: 0,
      stagger: 0.15, duration: 1.1, ease: 'power4.out',
    }, 1.1);

    // Subtitle
    tl.to(heroSub, {
      opacity: 1, y: 0, duration: 0.8,
    }, 1.6);

    // Badges
    tl.to(badges, {
      opacity: 1, y: 0, stagger: 0.2, duration: 0.7,
    }, 1.7);

    // CTA
    tl.to(heroCta, {
      opacity: 1, y: 0, duration: 0.7,
    }, 1.85);

    // Tags stagger
    tl.to(tags, {
      opacity: 1, y: 0, stagger: 0.06, duration: 0.5,
    }, 2.0);

    // Scroll indicator
    tl.to(scrollIndicator, {
      opacity: 1, duration: 0.6,
    }, 2.4);

    // Re-bind cursor hover listeners
    addCursorHoverListeners();

    // Start the name glitch loop after title animations finish
    tl.call(() => {
      startGlitchLoop();
    }, null, 3.0);
  }

  /* ---- Glitch Name + Image Loop Engine ---- */
  const GLITCH_STATES = [
    {
      line1: { text: 'Okezie', font: "'Syne', sans-serif", weight: '800', style: 'normal', color: 'var(--white)', stroke: false, textShadow: 'none' },
      line2: { text: 'Ferdinand', font: "'Syne', sans-serif", weight: '800', style: 'normal', color: 'transparent', stroke: true, textShadow: '0 0 60px var(--neon-dim)' },
      imgId: 'hero-img-1',
      duration: 3000
    },
    {
      line1: { text: 'Product', font: "'Playfair Display', serif", weight: '900', style: 'italic', color: 'var(--white)', stroke: false, textShadow: 'none' },
      line2: { text: 'Design Sage', font: "'Playfair Display', serif", weight: '900', style: 'italic', color: 'var(--white)', stroke: false, textShadow: 'none' },
      imgId: 'hero-img-2',
      duration: 2500
    },
    {
      line1: { text: 'No-Code /', font: "'Share Tech Mono', monospace", weight: '400', style: 'normal', color: 'var(--neon)', stroke: false, textShadow: '0 0 30px var(--neon-glow)' },
      line2: { text: 'Vibe Code God', font: "'Share Tech Mono', monospace", weight: '400', style: 'normal', color: 'var(--neon)', stroke: false, textShadow: '0 0 30px var(--neon-glow)' },
      imgId: 'hero-img-3',
      duration: 2500
    },
    {
      line1: { text: 'Security &', font: "'Share Tech Mono', monospace", weight: '400', style: 'normal', color: 'var(--neon)', stroke: false, textShadow: '0 0 30px var(--neon-glow)' },
      line2: { text: 'Automation Architect', font: "'Share Tech Mono', monospace", weight: '400', style: 'normal', color: 'var(--neon)', stroke: false, textShadow: '0 0 30px var(--neon-glow)' },
      imgId: 'hero-img-4',
      duration: 2500
    }
  ];

  const GLITCH_CHARS = '!@#$%^&*<>{}[]|\\/01';
  const GLITCH_DURATION = 400;
  let glitchCurrentState = 0;
  let glitchRunning = false;
  let glitchPaused = false;

  function getRandomGlitchChar() {
    return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
  }

  /**
   * Scramble text from current content to target string.
   * Characters resolve left-to-right with random glitch symbols.
   */
  function scrambleText(element, targetText, duration) {
    const frames = 20;
    const frameTime = duration / frames;
    let frame = 0;

    const interval = setInterval(() => {
      frame++;
      const progress = frame / frames;

      let display = '';
      for (let i = 0; i < targetText.length; i++) {
        if (targetText[i] === ' ') {
          display += ' ';
        } else if (i < Math.floor(progress * targetText.length)) {
          display += targetText[i];
        } else {
          display += getRandomGlitchChar();
        }
      }
      element.textContent = display;

      if (frame >= frames) {
        clearInterval(interval);
        element.textContent = targetText;
      }
    }, frameTime);
  }

  /**
   * Canvas-based image glitch transition.
   * Draws random horizontal scan lines with RGB split,
   * swaps the active image at the midpoint.
   */
  function glitchImageTransition(fromImg, toImg) {
    const canvas = document.getElementById('glitch-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    canvas.style.opacity = '1';

    let frame = 0;
    const totalFrames = 12;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw random horizontal glitch slices
      const slices = Math.floor(Math.random() * 8) + 4;
      for (let i = 0; i < slices; i++) {
        const y = Math.random() * canvas.height;
        const height = Math.random() * 30 + 5;
        const offset = (Math.random() - 0.5) * 40;

        // Neon scan line
        ctx.fillStyle = `rgba(51, 255, 20, ${Math.random() * 0.15})`;
        ctx.fillRect(0, y, canvas.width, height);

        // RGB split — red channel
        ctx.fillStyle = `rgba(255, 0, 0, ${Math.random() * 0.1})`;
        ctx.fillRect(offset, y, canvas.width, height * 0.5);

        // RGB split — cyan channel
        ctx.fillStyle = `rgba(0, 255, 255, ${Math.random() * 0.1})`;
        ctx.fillRect(-offset, y, canvas.width, height * 0.5);
      }

      // Swap images at midpoint
      if (frame === Math.floor(totalFrames / 2)) {
        fromImg.classList.remove('active');
        toImg.classList.add('active');
      }

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.opacity = '0';
      }
    };
    requestAnimationFrame(animate);
  }

  /**
   * Apply font / color / stroke styling for a given glitch state.
   */
  function applyGlitchState(state) {
    const line1El = document.getElementById('glitch-line-1');
    const line2El = document.getElementById('glitch-line-2');
    if (!line1El || !line2El) return;

    [line1El, line2El].forEach((el, i) => {
      const s = i === 0 ? state.line1 : state.line2;
      el.style.fontFamily = s.font;
      el.style.fontWeight = s.weight;
      el.style.fontStyle = s.style;
      el.style.color = s.color;
      el.style.webkitTextStroke = s.stroke ? '1.5px var(--neon)' : 'none';
      el.style.textShadow = s.textShadow;
    });
  }

  /**
   * Main glitch loop — cycles through all states infinitely.
   * Pauses when tab is not visible, resumes when active.
   */
  function startGlitchLoop() {
    if (glitchRunning) return;
    glitchRunning = true;

    const line1El = document.getElementById('glitch-line-1');
    const line2El = document.getElementById('glitch-line-2');
    if (!line1El || !line2El) return;

    // Apply initial state styling
    applyGlitchState(GLITCH_STATES[0]);

    async function runCycle() {
      while (glitchRunning) {
        const current = GLITCH_STATES[glitchCurrentState];

        // Hold current state for its duration
        await new Promise((r) => setTimeout(r, current.duration));

        // Pause if tab is not visible
        while (glitchPaused) {
          await new Promise((r) => setTimeout(r, 100));
        }

        // Calculate next state
        const nextIndex = (glitchCurrentState + 1) % GLITCH_STATES.length;
        const next = GLITCH_STATES[nextIndex];

        // Get image elements
        const currentImg = document.getElementById(current.imgId);
        const nextImg = document.getElementById(next.imgId);

        // Add glitch CSS animation to text
        line1El.classList.add('glitching');
        line2El.classList.add('glitching');

        // Start image glitch canvas effect
        if (currentImg && nextImg) {
          glitchImageTransition(currentImg, nextImg);
        }

        // Scramble text to next state
        scrambleText(line1El, next.line1.text, GLITCH_DURATION);
        scrambleText(line2El, next.line2.text, GLITCH_DURATION);

        // Wait for scramble to complete + small buffer
        await new Promise((r) => setTimeout(r, GLITCH_DURATION + 20));

        // Remove glitch animation and apply new state styling
        line1El.classList.remove('glitching');
        line2El.classList.remove('glitching');
        applyGlitchState(next);
        glitchCurrentState = nextIndex;
      }
    }

    runCycle();

    // Pause/resume when tab visibility changes
    document.addEventListener('visibilitychange', () => {
      glitchPaused = document.hidden;
    });
  }

  /* ---- Scroll Parallax ---- */
  function initScrollParallax() {
    if (typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const heroWrap = document.querySelector('.hero-image-wrap');
    const heroContent = document.querySelector('.hero-content');

    if (heroWrap) {
      gsap.to(heroWrap, {
        y: 100,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
      });
    }

    if (heroContent) {
      gsap.to(heroContent, {
        y: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }
  }

  /* ---- Stats Counter ---- */
  window.addEventListener('load', () => {
    setTimeout(() => {
      function countUp(id, target, suffix) {
        const el = document.getElementById(id);
        if (!el) return;
        let current = 0;
        const step = target / 80;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            el.textContent = target + suffix;
            clearInterval(timer);
          } else {
            el.textContent = Math.floor(current);
          }
        }, 25);
      }
      countUp('stat-1', 4, '+');
      countUp('stat-2', 20, '+');
      countUp('stat-3', 4, '+');
      countUp('stat-4', 100, '%');
    }, 1500);
  });

  /* ---- Stats Scroll Animation ---- */
  function initStatsAnimation() {
    if (typeof ScrollTrigger === 'undefined') return;

    const stats = document.querySelectorAll('.stat');
    const dividers = document.querySelectorAll('.stat-divider');

    gsap.set(stats, { opacity: 0, y: 40 });
    gsap.set(dividers, { opacity: 0, scale: 0 });

    ScrollTrigger.create({
      trigger: '.stats-bar',
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(stats, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
        });
        gsap.to(dividers, {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'back.out(2)',
          delay: 0.2,
        });
      },
    });
  }

  /* ---- Dynamic Home Content Fetch ---- */
  async function initDynamicHomeContent() {
    await window.initSupabase();
    try {
      const { data, error } = await window.supabaseClient
        .from('site_settings')
        .select('hero_content, about_content')
        .limit(1)
        .single();
      
      if (data && data.hero_content && Object.keys(data.hero_content).length > 0) {
        const h = data.hero_content;
        
        // Update DOM elements
        const badge1 = document.getElementById('hero-badge1');
        if (badge1 && h.badge1) badge1.textContent = h.badge1;
        
        const badge2 = document.getElementById('hero-badge2');
        if (badge2 && h.badge2) badge2.textContent = h.badge2;
        
        const eyebrow = document.getElementById('hero-eyebrow-text');
        if (eyebrow && h.eyebrow) eyebrow.textContent = h.eyebrow;
        
        const sub = document.getElementById('hero-subtitle');
        if (sub && h.subtitle) sub.innerHTML = h.subtitle.replace(/\n/g, '<br/>');
        
        const btn1 = document.getElementById('hero-btn1');
        if (btn1 && h.btn1) btn1.textContent = h.btn1;
        
        const btn2 = document.getElementById('hero-btn2');
        if (btn2 && h.btn2) btn2.textContent = h.btn2;
        
        const skillsContainer = document.getElementById('hero-skills-container');
        if (skillsContainer && h.skills && Array.isArray(h.skills)) {
          skillsContainer.innerHTML = h.skills.map(s => `<span class="tag">${s}</span>`).join('');
        }

        // Update Glitch States (the loop uses GLITCH_STATES)
        // Ensure GLITCH_STATES array length is maintained.
        // For each of the 4 slides, we update text and optionally image if defined.
        if (typeof GLITCH_STATES !== 'undefined') {
          [1, 2, 3, 4].forEach(i => {
            const state = GLITCH_STATES[i-1];
            if (state) {
              if (h[`s${i}_l1`]) state.line1.text = h[`s${i}_l1`];
              if (h[`s${i}_l2`]) state.line2.text = h[`s${i}_l2`];
              if (h[`s${i}_img`]) {
                const imgEl = document.getElementById(state.imgId);
                if (imgEl) imgEl.src = h[`s${i}_img`];
              }
            }
          });
        }
      }

      if (data && data.about_content && Object.keys(data.about_content).length > 0) {
        const a = data.about_content;
        
        const title = document.getElementById('home-about-title');
        if (title) {
          title.innerHTML = `${a.h1 || ''}<br/>${a.h2 || ''}<br/>${a.h3 || ''} <span class="accent-symbol">✦</span>`;
        }

        const desc1 = document.getElementById('home-about-desc1');
        const desc2 = document.getElementById('home-about-desc2');
        if (desc1 && a.desc) {
          // split by double newline for simple paragraphing
          const paras = a.desc.split('\n\n');
          desc1.innerHTML = paras[0] || '';
          if (desc2 && paras[1]) {
            desc2.innerHTML = paras[1];
          } else if (desc2) {
            desc2.innerHTML = '';
          }
        }

        const cvBtn = document.getElementById('home-about-cv');
        if (cvBtn && a.cv) cvBtn.href = a.cv;

        const fun = document.getElementById('home-about-fun');
        if (fun && a.funfact) fun.textContent = `✦ ${a.funfact}`;
      }
    } catch (err) {
      console.warn("Could not load dynamic home content:", err);
    }
  }

  /* ---- Work Section Dynamic Fetch & Animation ---- */
  async function initWorkAnimation() {
    await window.initSupabase();
    const gridContainer = document.getElementById('featured-work-grid');
    if (!gridContainer) return;

    // Fetch featured projects
    try {
      const { data: featuredProjects } = await window.supabaseClient
        .from('projects')
        .select('*')
        .eq('featured', true)
        .order('priority', { ascending: false })
        .limit(4);

      if (featuredProjects && featuredProjects.length > 0) {
        featuredProjects.forEach((p, index) => {
          const cardClass = (index === 0 || index === 3) ? 'work-card-lg' : 'work-card-sm';
          const toolsRaw = Array.isArray(p.tools) ? p.tools : JSON.parse(p.tools || '[]');
          const toolsHtml = (toolsRaw || []).map(t => `<span class="tool-pill">${t}</span>`).join('');
          
          const card = document.createElement('div');
          card.className = `work-card ${cardClass}`;
          card.innerHTML = `
            <div class="card-image" style="background: linear-gradient(135deg, var(--${p.gradient || 'neon-green'}), #0a0a0a 100%);">
              ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;mix-blend-mode:overlay;opacity:0.6;">` : ''}
              <div class="card-overlay"><span>View Case Study →</span></div>
            </div>
            <div class="card-body">
              <span class="card-category">${p.category}</span>
              <h3 class="card-title">${p.name}</h3>
              <p class="card-desc">${p.shortDesc || ''}</p>
              <div class="card-tools">${toolsHtml}</div>
              <span class="card-arrow">→</span>
            </div>
          `;
          // Optional clicking link setup here if needed, or wrap in an anchor
          gridContainer.appendChild(card);
        });
      } else {
        gridContainer.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; margin: 60px 0; color: var(--text-muted);">Please add some featured projects in Admin.</div>';
      }
    } catch (err) {
      console.error("Error fetching featured projects", err);
    }

    if (typeof ScrollTrigger === 'undefined') return;

    const workHeader = document.querySelector('.work-header');
    const workCards = document.querySelectorAll('.work-card');
    const workCta = document.querySelector('.work-cta');

    if (workHeader) {
      gsap.set(workHeader, { opacity: 0, y: 50 });
      ScrollTrigger.create({
        trigger: '.work',
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(workHeader, {
            opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          });
        },
      });
    }

    if (workCards.length) {
      gsap.set(workCards, { opacity: 0, y: 60 });
      ScrollTrigger.create({
        trigger: '.work-grid',
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(workCards, {
            opacity: 1, y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
          });
        },
      });
    }

    if (workCta) {
      gsap.set(workCta, { opacity: 0, y: 20 });
      ScrollTrigger.create({
        trigger: workCta,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          gsap.to(workCta, {
            opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          });
        },
      });
    }
  }

  /* ---- About Section Scroll Animation ---- */
  function initAboutAnimation() {
    if (typeof ScrollTrigger === 'undefined') return;

    const aboutLeft = document.querySelector('.about-left');
    const aboutRight = document.querySelector('.about-right');

    if (aboutLeft) {
      const leftChildren = aboutLeft.querySelectorAll(
        '.section-label, .section-title, .about-text, .about-skills, .btn, .about-fun'
      );

      gsap.set(aboutLeft, { opacity: 0, x: -60 });
      gsap.set(leftChildren, { opacity: 0, y: 25 });

      ScrollTrigger.create({
        trigger: '.about',
        start: 'top 75%',
        once: true,
        onEnter: () => {
          gsap.to(aboutLeft, {
            opacity: 1, x: 0, duration: 0.9, ease: 'power3.out',
          });
          gsap.to(leftChildren, {
            opacity: 1, y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
            delay: 0.2,
          });
        },
      });
    }

    if (aboutRight) {
      gsap.set(aboutRight, { opacity: 0, x: 60 });

      ScrollTrigger.create({
        trigger: '.about',
        start: 'top 75%',
        once: true,
        onEnter: () => {
          gsap.to(aboutRight, {
            opacity: 1, x: 0, duration: 1, ease: 'power3.out', delay: 0.3,
          });
        },
      });
    }
  }

  /* ---- Services Section Scroll Animation ---- */
  function initServicesAnimation() {
    if (typeof ScrollTrigger === 'undefined') return;

    const servicesCards = document.querySelectorAll('.service-card');
    
    if (servicesCards.length) {
      gsap.set(servicesCards, { opacity: 0, y: 40 });
      ScrollTrigger.create({
        trigger: '.services-grid',
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(servicesCards, {
            opacity: 1, 
            y: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out',
          });
        },
      });
    }
  }

  /* ---- Contact Section Scroll Animation ---- */
  function initContactAnimation() {
    if (typeof ScrollTrigger === 'undefined') return;

    const contactElements = document.querySelectorAll('.contact-content > *');
    
    if (contactElements.length) {
      gsap.set(contactElements, { opacity: 0, y: 30 });
      ScrollTrigger.create({
        trigger: '.contact',
        start: 'top 75%',
        once: true,
        onEnter: () => {
          gsap.to(contactElements, {
            opacity: 1, 
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out',
          });
        },
      });
    }
  }

  /* ---- Theme Toggle ---- */
  /* NOTE: Handled by nav.js (shared across all pages) */

  /* ---- Scroll To Top ---- */
  function initScrollToTop() {
    const scrollTopBtn = document.getElementById('scroll-top');
    if (!scrollTopBtn) return;

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

  /* ---- Active Nav Observer ---- */
  /* NOTE: Handled by nav.js (shared across all pages) */

  /* ---- CLI Terminal Easter Egg ---- */
  function initCLI() {
    const toggleBtn = document.getElementById('cli-toggle');
    const panel = document.getElementById('cli-panel');
    const closeBtn = document.getElementById('cli-close');
    const input = document.getElementById('cli-input');
    const output = document.getElementById('cli-output');
    
    if (!toggleBtn || !panel) return;

    let isOpen = false;
    let rateLimitCount = 0;
    
    // Reset rate limit every minute
    setInterval(() => { rateLimitCount = 0; }, 60000);

    const RESPONSES = {
      'whoami': 'Okezie Ferdinand — System Designer & Builder\nProduct Designer | No-Code Dev | Automation | Security',
      'skills': '▸ UI/UX Design (Figma, Framer, Canva)\n▸ No-Code/Vibe Coding (Bubble, Webflow, Lovable, Bolt)\n▸ Automation (n8n, APIs, Webhooks)\n▸ Cybersecurity (Learning — CTF, Linux, Kali)',
      'tools': 'Design: Figma, Framer, Canva\nBuild: Bubble.io, Webflow, Lovable, Bolt, Replit\nAutomate: n8n, Airtable, Zapier\nCode: HTML, CSS, JS, Python (learning)\nSecurity: Linux, Kali Linux, CTF tools',
      'projects': '▸ Clara AI — Bubble.io MVP (3 days)\n▸ Rento India — Bolt.new + Supabase\n▸ Lekker.social — SaaS Dashboard (SA)\n▸ Zenflow — Figma Fitness App\nType \'view [project name]\' for details',
      'view clara': 'Clara AI (Client MVP)\nBuilt functional MVP in 3 days\nStack: Figma → Bubble.io\nFeatures: Lead intake, AI insights, client tracking\nStatus: Delivered ✓',
      'view rento': 'Rento — India Rental Platform\nStack: Bolt.new + Supabase, deployed Netlify\nNow scaling in Bubble.io\nStatus: Live ✓',
      'view zenflow': 'Zenflow — Figma Fitness App\nUI/UX Case Study\nInteractive prototype focused on mindfulness and exercise tracking.',
      'view lekker': 'Lekker.social — SaaS Dashboard\nSouth African social management tool.\nFocus: Clean UI, data visualization.',
      'experience': '▸ Freelance Product Designer (May 2024 - Present)\n▸ Design Tutor, Team Xcel (Aug 2024 - Present)\n▸ Freelance Designer, Rendr (Dec 2024 - May 2025)\n▸ Product Design Intern, GettyVersity (May-Aug 2025)',
      'contact': 'Email: justxaviers@icloud.com\nWhatsApp: +234 902 882 1109\nLinkedIn: linkedin.com/in/okezie-ferdinand\nTwitter: @JX_Design_Dev\nGitHub: github.com/jxdesigndev',
      'hire': 'Currently available for freelance projects.\nResponse time: < 24 hours on WhatsApp\nType \'contact\' for details or visit /contact',
      'help': 'Available commands:\nwhoami | skills | tools | projects | experience\nls | cd [dir] | pwd | cat [file] | grep [text]\ncontact | hire | clear | exit\nview [project] — view rento | view clara | view zenflow | view lekker'
    };

    function sanitize(str) {
      if (!str) return '';
      return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    
    function escapeRegExp(string) {
      if (!string) return '';
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function printLine(text, isEcho = false, isTyping = false) {
      const line = document.createElement('div');
      line.className = 'cli-line' + (isEcho ? ' cmd-echo' : '');
      output.appendChild(line);

      if (isTyping && !isEcho) {
        let i = 0;
        function typeChar() {
          if (i < text.length) {
            line.textContent += text.charAt(i);
            i++;
            output.scrollTop = output.scrollHeight;
            setTimeout(typeChar, 20); // Sped up mildly for better UX reading long cat/grep lines
          }
        }
        typeChar();
      } else {
        line.innerHTML = text; // safe since user input relies on sanitize(), and responses are statically defined via JS dict
        output.scrollTop = output.scrollHeight;
      }
    }

    function processCommand(cmd) {
      const trimmed = cmd.trim();
      const lowerCmd = trimmed.toLowerCase();
      if (!trimmed) return;

      // Echo command
      printLine(`jx@portfolio:~$ ${sanitize(trimmed)}`, true, false);

      if (rateLimitCount >= 40) {
        printLine('Rate limit reached. Wait 60s.', false, true);
        return;
      }
      rateLimitCount++;

      if (lowerCmd === 'clear') {
        output.innerHTML = '<div class="cli-line cli-intro">Terminal cleared.</div>';
        return;
      }
      
      if (lowerCmd === 'exit') {
        closeTerminal();
        return;
      }

      // 1. Direct hardcoded match first
      const response = RESPONSES[lowerCmd];
      if (response) {
        printLine(response, false, true);
        return;
      }

      // 2. Parse Linux Commands
      const parts = trimmed.split(' ');
      const baseCmd = parts[0].toLowerCase();
      const args = parts.slice(1).join(' ');

      if (baseCmd === 'ls') {
        printLine('hero/  work/  about/  services/  contact/\nskills.txt  projects.txt  contact.txt', false, true);
        return;
      }

      if (baseCmd === 'pwd') {
        const scrollY = window.scrollY;
        const sections = ['hero', 'work', 'about', 'services', 'contact'];
        let currentSec = 'hero';
        sections.forEach(secId => {
          const el = document.getElementById(secId);
          if (el && scrollY >= (el.offsetTop - 300)) currentSec = secId;
        });
        printLine(`/home/visitor/${currentSec}`, false, true);
        return;
      }

      if (baseCmd === 'cd') {
        let target = args.toLowerCase().replace(/\//g, '');
        if (!target || target === '~' || target === '..') { target = 'hero'; }
        
        const el = document.getElementById(target);
        if (el && target !== 'hero-canvas' && target !== 'water-canvas' && target !== 'glitch-canvas') {
          if (typeof lenisInstance !== 'undefined' && lenisInstance) {
            lenisInstance.scrollTo(el, { duration: 1.2 });
          } else {
            el.scrollIntoView({ behavior: 'smooth' });
          }
          printLine(`Changed directory to /home/visitor/${sanitize(target)}`, false, true);
        } else {
          printLine(`cd: ${sanitize(args)}: No such file or directory`, false, true);
        }
        return;
      }

      if (baseCmd === 'cat') {
        const target = args.toLowerCase().replace(/\//g, '');
        if (!target) return printLine('cat: missing file operand', false, true);
        if (target.includes('skill')) return printLine(RESPONSES['skills'], false, true);
        if (target.includes('project')) return printLine(RESPONSES['projects'], false, true);
        if (target.includes('contact')) return printLine(RESPONSES['contact'], false, true);
        
        const el = document.getElementById(target);
        if (el && target !== 'hero-canvas' && target !== 'water-canvas' && target !== 'glitch-canvas') {
          let text = el.innerText || '';
          if (text.length > 250) {
            text = text.substring(0, 250) + '\n... [truncated]';
          }
          printLine(`[CONTENT of ${sanitize(target)}]\n${sanitize(text)}`, false, true);
        } else {
          printLine(`cat: ${sanitize(args)}: No such file or directory`, false, true);
        }
        return;
      }

      if (baseCmd === 'grep') {
        if (!args) {
          printLine('grep: missing search pattern', false, true);
          return;
        }
        
        const bodyText = document.body.innerText || '';
        const lines = bodyText.split('\n');
        const matches = [];
        const safeArgs = sanitize(args);
        const lowerArgs = args.toLowerCase();
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.length > 0 && line.toLowerCase().includes(lowerArgs)) {
            // Prevent duplicate adjacent line matching issues 
            if (matches.length > 0 && matches[matches.length-1].includes(sanitize(line.substring(0, 40)))) continue;
            
            let safeLine = sanitize(line);
            if (safeLine.length > 100) safeLine = safeLine.substring(0, 100) + '...';
            
            // Highlight exact match
            const regex = new RegExp(`(${escapeRegExp(safeArgs)})`, "gi");
            safeLine = safeLine.replace(regex, '<span style="color: var(--neon); text-decoration: underline;">$1</span>');
            
            matches.push(safeLine);
            if (matches.length >= 6) break;
          }
        }
        
        if (matches.length > 0) {
          printLine(matches.join('\n'), false, false); 
        } else {
          printLine(`No matches found for '${safeArgs}'.`, false, true);
        }
        return;
      }

      printLine(`Command not found: ${sanitize(baseCmd)}\nType 'help' for available commands.`, false, true);
    }

    function openTerminal() {
      if (isOpen) return;
      isOpen = true;
      gsap.to(panel, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', pointerEvents: 'all' });
      setTimeout(() => input.focus(), 500);
    }

    function closeTerminal() {
      if (!isOpen) return;
      isOpen = false;
      gsap.to(panel, { opacity: 0, y: 20, duration: 0.4, ease: 'power3.in', pointerEvents: 'none' });
      input.blur();
    }

    toggleBtn.addEventListener('click', openTerminal);
    closeBtn.addEventListener('click', closeTerminal);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value;
        if (val) {
          processCommand(val);
          input.value = '';
        }
      }
    });

    // Make clicking anywhere inside panel focus input
    panel.addEventListener('click', () => {
      if (window.getSelection().toString() === '') {
        input.focus();
      }
    });
  }

  /* ---- Init ---- */
  function init() {
    addCursorHoverListeners();
    initLenis();
    initScrollToTop();
    initHeroParticles();
    initWaterRipple();
    initScrollParallax();
    initStatsAnimation();
    initWorkAnimation();
    initAboutAnimation();
    initServicesAnimation();
    initContactAnimation();
    initCLI();
    initDynamicHomeContent();
    playLoader();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
