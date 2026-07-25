/* ================================================================
   JX UNIVERSE — script.js v3.0
   The Awakening — Homepage Master Controller
   Okezie Ferdinand | jxdesigndev.com
   ================================================================ */

'use strict';

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
      this.initParticles(); /* WebGL or Canvas2D */
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
        img.src = src;
        return img;
      };

      this.imgOkezie1 = load('assets/images/okezie-1.png');
      this.imgHero2 = load('assets/images/jx-hero-2.jpg');
      this.imgPortrait = load('assets/images/okezie-2.png');
      this.imgCoder = load('assets/images/okezie-coder.png');
      this.imgDesigner = load('assets/images/okezie-designer.png');
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
  initParticles () {
    const canvas = this.heroCanvas;
    if (!canvas) return;

    /* Try WebGL first */
    if (window.THREE) {
      try {
        this.initThreeJS(canvas);
        return;
      } catch (e) {
        console.warn('JX: WebGL failed, switching to Canvas2D.', e.message);
      }
    }

    /* Canvas2D fallback */
    this.initCanvas2D(canvas);
  },

  /* ── 2a. THREE.JS WebGL particle universe ── */
  initThreeJS (canvas) {
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(75, W / H, 0.1, 2000);
    camera.position.z = 80;

    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    /* Extract Pixel Data for Faces */
    const extractPixels = (img, posArr, colorArr, useColor=false, offsetX=0, offsetY=0, offsetZ=0, scale=0.6) => {
      if (!img) return;
      const c = document.createElement('canvas');
      const sampleW = 350;
      const sampleH = Math.round(350 * (img.height / img.width));
      c.width = sampleW;
      c.height = sampleH;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, sampleW, sampleH);
      const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;
      const bgR = imgData[0], bgG = imgData[1], bgB = imgData[2];

      let rawPixels = [];
      let minX = sampleW, maxX = 0, minY = sampleH, maxY = 0;

      for (let y = 0; y < sampleH; y+=1) {
        for (let x = 0; x < sampleW; x+=1) {
          const idx = (y * sampleW + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx+1];
          const b = imgData[idx+2];
          const a = imgData[idx+3];
          
          const brightness = (r + g + b) / 3;
          
          if (a > 15 && brightness > 8) {
            rawPixels.push({ x, y, r, g, b, brightness });
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (rawPixels.length === 0) return;

      const subW = Math.max(1, maxX - minX);
      const subH = Math.max(1, maxY - minY);
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      const maxDim = Math.max(subW, subH);
      const normScale = (65.0 / maxDim) * (scale / 0.6);

      for (let i = 0; i < rawPixels.length; i++) {
        const p = rawPixels[i];
        let px = (p.x - centerX) * normScale + offsetX;
        let py = -(p.y - centerY) * normScale + offsetY;
        let pz = (p.brightness / 255) * 5.0 + offsetZ;
        posArr.push({ x: px, y: py, z: pz });
        if (useColor && colorArr) {
          colorArr.push({ r: p.r/255, g: p.g/255, b: p.b/255 });
        }
      }
    };
    
    let pOkezie1 = [], cOkezie1 = [];
    let pHero2 = [], cHero2 = [];
    let pPortrait = [], cPortrait = [];
    let pCoder = [], cCoder = [];
    let pDesigner = [], cDesigner = [];

    // Phase 2 & Phase 3 Hero: centered, crisp, scale=0.6
    extractPixels(this.imgOkezie1, pOkezie1, cOkezie1, true, 0, 0, 0, 0.6);
    extractPixels(this.imgHero2, pHero2, cHero2, true, 0, 0, 0, 0.6);

    // Target 4 (About): offset to left (-25.0, 0, -10.0, scale=0.5) so it never overlaps or disturbs text on right
    extractPixels(this.imgPortrait, pPortrait, cPortrait, true, -25.0, 0, -10.0, 0.5);

    // Target 5 (Work): offset to right (+28.0, 5.0, -12.0, scale=0.5) so it never overlaps text on left
    extractPixels(this.imgCoder, pCoder, cCoder, true, 28.0, 5.0, -12.0, 0.5);

    // Target 6 (Services): offset to left (-28.0, 5.0, -12.0, scale=0.5) so it never overlaps text on right
    extractPixels(this.imgDesigner, pDesigner, cDesigner, true, -28.0, 5.0, -12.0, 0.5);

    /* Extract Text Pixels */
    let pText = [];
    const createTextCanvas = () => {
      const c = document.createElement('canvas');
      const cw = 400, ch = 200;
      c.width = cw; c.height = ch;
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.font = 'bold 45px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OKEZIE', cw/2, ch/2 - 25);
      ctx.fillText('FERDINAND', cw/2, ch/2 + 25);
      
      const imgData = ctx.getImageData(0, 0, cw, ch).data;
      for (let y = 0; y < ch; y+=2) {
        for (let x = 0; x < cw; x+=2) {
          const a = imgData[(y * cw + x) * 4 + 3];
          if (a > 100) {
            pText.push({
              x: (x - cw/2) * 0.35,
              y: -(y - ch/2) * 0.35,
              z: 0.0 // NO JITTER
            });
          }
        }
      }
    };
    createTextCanvas();

    /* ── Main particle field (55,000) ── */
    const MAIN_COUNT = window.innerWidth < 768 ? 28000 : 55000;
    const mainGeo    = new THREE.BufferGeometry();
    const mainPos    = new Float32Array(MAIN_COUNT * 3);
    const target1    = new Float32Array(MAIN_COUNT * 3);
    const target2    = new Float32Array(MAIN_COUNT * 3);
    const targetText = new Float32Array(MAIN_COUNT * 3);
    const target4    = new Float32Array(MAIN_COUNT * 3);
    const target5    = new Float32Array(MAIN_COUNT * 3);
    const target6    = new Float32Array(MAIN_COUNT * 3);

    const col1 = new Float32Array(MAIN_COUNT * 3);
    const col2 = new Float32Array(MAIN_COUNT * 3);
    const col4 = new Float32Array(MAIN_COUNT * 3);
    const col5 = new Float32Array(MAIN_COUNT * 3);
    const col6 = new Float32Array(MAIN_COUNT * 3);

    const mainAlpha  = new Float32Array(MAIN_COUNT);

    for (let i = 0; i < MAIN_COUNT; i++) {
      const r_rand = 80 + Math.random() * 150;
      const theta_rand = Math.random() * Math.PI * 2;
      const phi_rand = Math.acos(2 * Math.random() - 1);
      mainPos[i*3]   = r_rand * Math.sin(phi_rand) * Math.cos(theta_rand);
      mainPos[i*3+1] = r_rand * Math.sin(phi_rand) * Math.sin(theta_rand);
      mainPos[i*3+2] = r_rand * Math.cos(phi_rand);
      
      const setTarget = (arr, tp, colorArr, cp) => {
        if (arr.length > 0) {
          const idx = Math.floor((i / MAIN_COUNT) * arr.length); // Uniform sampling across full portrait height
          const fp = arr[idx];
          tp[i*3]   = fp.x;
          tp[i*3+1] = fp.y;
          tp[i*3+2] = fp.z;
          if (colorArr && cp) {
            const fc = colorArr[idx];
            cp[i*3] = fc.r; cp[i*3+1] = fc.g; cp[i*3+2] = fc.b;
          }
        } else {
          tp[i*3] = mainPos[i*3]*0.5; tp[i*3+1] = mainPos[i*3+1]*0.5; tp[i*3+2] = mainPos[i*3+2]*0.5;
          if (cp) { cp[i*3] = 0; cp[i*3+1] = 1; cp[i*3+2] = 0; }
        }
      };
      
      setTarget(pOkezie1, target1, cOkezie1, col1);
      setTarget(pHero2, target2, cHero2, col2);
      setTarget(pText, targetText, null, null);
      setTarget(pPortrait, target4, cPortrait, col4);
      setTarget(pCoder, target5, cCoder, col5);
      setTarget(pDesigner, target6, cDesigner, col6);

      mainAlpha[i] = 0.1 + Math.random() * 0.9;
    }

    mainGeo.setAttribute('position',   new THREE.BufferAttribute(mainPos, 3));
    mainGeo.setAttribute('aTarget1',   new THREE.BufferAttribute(target1, 3));
    mainGeo.setAttribute('aTarget2',   new THREE.BufferAttribute(target2, 3));
    mainGeo.setAttribute('aTarget3',   new THREE.BufferAttribute(targetText, 3));
    mainGeo.setAttribute('aTarget4',   new THREE.BufferAttribute(target4, 3));
    mainGeo.setAttribute('aTarget5',   new THREE.BufferAttribute(target5, 3));
    mainGeo.setAttribute('aTarget6',   new THREE.BufferAttribute(target6, 3));
    mainGeo.setAttribute('aColor1',    new THREE.BufferAttribute(col1, 3));
    mainGeo.setAttribute('aColor2',    new THREE.BufferAttribute(col2, 3));
    mainGeo.setAttribute('aColor4',    new THREE.BufferAttribute(col4, 3));
    mainGeo.setAttribute('aColor5',    new THREE.BufferAttribute(col5, 3));
    mainGeo.setAttribute('aColor6',    new THREE.BufferAttribute(col6, 3));
    mainGeo.setAttribute('aAlpha',     new THREE.BufferAttribute(mainAlpha, 1));

    const mainMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:     { value: 0 },
        uAlpha:    { value: 0 },
        uProgress1:{ value: 0 },
        uProgress2:{ value: 0 },
        uProgress3:{ value: 0 },
        uProgress4:{ value: 0 },
        uProgress5:{ value: 0 },
        uProgress6:{ value: 0 },
        uGreenMix: { value: 0 },
        uMouse:    { value: new THREE.Vector2(9999, 9999) }, // Offscreen by default so no bald hole in center
        uSize:     { value: window.innerWidth < 768 ? 1.5 : 2.5 },
      },
      vertexShader: `
        attribute vec3 aTarget1;
        attribute vec3 aTarget2;
        attribute vec3 aTarget3;
        attribute vec3 aTarget4;
        attribute vec3 aTarget5;
        attribute vec3 aTarget6;
        attribute vec3 aColor1;
        attribute vec3 aColor2;
        attribute vec3 aColor4;
        attribute vec3 aColor5;
        attribute vec3 aColor6;
        attribute float aAlpha;

        uniform float uTime;
        uniform float uProgress1;
        uniform float uProgress2;
        uniform float uProgress3;
        uniform float uProgress4;
        uniform float uProgress5;
        uniform float uProgress6;
        uniform float uGreenMix;
        uniform vec2 uMouse;
        uniform float uSize;

        varying float vAlpha;
        varying vec3 vColor;

        void main () {
          vAlpha = aAlpha;
          
          vec3 pos = mix(position, aTarget1, uProgress1);
          pos = mix(pos, aTarget2, uProgress2);
          pos = mix(pos, aTarget3, uProgress3);
          pos = mix(pos, aTarget4, uProgress4);
          pos = mix(pos, aTarget5, uProgress5);
          pos = mix(pos, aTarget6, uProgress6);

          vec3 color = vec3(0.0, 1.0, 0.25); // base green
          vec3 c1 = clamp(aColor1 * 1.25, 0.0, 1.0);
          vec3 c2 = clamp(aColor2 * 1.25, 0.0, 1.0);
          vec3 c4 = clamp(aColor4 * 1.25, 0.0, 1.0);
          vec3 c5 = clamp(aColor5 * 1.25, 0.0, 1.0);
          vec3 c6 = clamp(aColor6 * 1.25, 0.0, 1.0);

          color = mix(color, c1, uProgress1);
          color = mix(color, c2, uProgress2);
          color = mix(color, vec3(1.0), uProgress3); // Text is pure white
          color = mix(color, c4, uProgress4);
          color = mix(color, c5, uProgress5);
          color = mix(color, c6, uProgress6);
          // Subtle holographic sheen instead of heavy green wash
          float holoGlow = clamp((uProgress1 + uProgress2) * 0.4, 0.0, 1.0);
          color = mix(color, vec3(0.0, 1.0, 0.3), max(uGreenMix, holoGlow * 0.15)); 

          vColor = color;
          
          float totalProg = max(max(max(uProgress1, uProgress2), max(uProgress3, uProgress4)), max(uProgress5, uProgress6));
          float drift = 1.0 - (totalProg * 0.9); 
          pos.x += sin(uTime * 0.3 + position.y * 0.05) * 0.6 * drift;
          pos.y += cos(uTime * 0.2 + position.x * 0.05) * 0.6 * drift;
          pos.z += sin(uTime * 0.25 + position.z * 0.05) * 0.4 * drift;
          
          // Subtle Mouse Repulsion Ripple
          vec2 m = uMouse * vec2(150.0, 150.0);
          float d = distance(pos.xy, m);
          if (d < 10.0) {
            vec2 dir = normalize(pos.xy - m);
            float force = (10.0 - d) * 0.25;
            pos.xy += dir * force;
            pos.z += force * 0.6;
          }

          gl_Position  = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          float pSize = uSize * (180.0 / -gl_Position.z); 
          gl_PointSize = clamp(pSize, 1.0, 25.0); 
        }
      `,
      fragmentShader: `
        uniform float uAlpha;
        varying float vAlpha;
        varying vec3 vColor;

        void main () {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.35, dist);
          gl_FragColor = vec4(vColor, alpha * vAlpha * uAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const mainParticles = new THREE.Points(mainGeo, mainMat);
    mainParticles.frustumCulled = false;
    // Start at exactly 1.0 scale so portrait fits perfectly without being blown up or cropped
    mainParticles.scale.set(1.0, 1.0, 1.0);
    scene.add(mainParticles);

    /* ── Amber accent cloud (2,000) ── */
    const AMB_COUNT = 2000;
    const ambGeo    = new THREE.BufferGeometry();
    const ambPos    = new Float32Array(AMB_COUNT * 3);
    for (let i = 0; i < AMB_COUNT; i++) {
      const r   = 60 + Math.random() * 80;
      const t   = Math.random() * Math.PI * 2;
      const p   = Math.acos(2 * Math.random() - 1);
      ambPos[i*3]   = r * Math.sin(p) * Math.cos(t);
      ambPos[i*3+1] = r * Math.sin(p) * Math.sin(t);
      ambPos[i*3+2] = r * Math.cos(p);
    }
    ambGeo.setAttribute('position', new THREE.BufferAttribute(ambPos, 3));

    const ambMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 } },
      vertexShader: `
        uniform float uTime;
        void main () {
          vec3 pos = position;
          pos.x += cos(uTime * 0.15 + position.z * 0.04) * 1.2;
          pos.y += sin(uTime * 0.18 + position.x * 0.04) * 1.2;
          gl_Position  = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = 1.2 * (180.0 / -gl_Position.z);
          gl_PointSize = clamp(gl_PointSize, 0.4, 2.0);
        }
      `,
      fragmentShader: `
        uniform float uAlpha;
        void main () {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          float glow = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(1.0, 0.72, 0.0, glow * 0.6 * uAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const ambParticles = new THREE.Points(ambGeo, ambMat);
    scene.add(ambParticles);

    /* ── Resize ── */
    window.addEventListener('resize', () => {
      const W2 = window.innerWidth, H2 = window.innerHeight;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    });

    /* ── Mouse parallax & Shader Uniform ── */
    let mouseX = 0, mouseY = 0;
    window.addEventListener('mousemove', e => {
      mouseX = (e.clientX / window.innerWidth  - 0.5);
      mouseY = (e.clientY / window.innerHeight - 0.5);
      if (this.threeCtx && this.threeCtx.mainMat) {
         this.threeCtx.mainMat.uniforms.uMouse.value.set(mouseX * 2, -mouseY * 2); 
      }
    }, { passive: true });
    window.addEventListener('mouseleave', () => {
      if (this.threeCtx && this.threeCtx.mainMat) {
         this.threeCtx.mainMat.uniforms.uMouse.value.set(9999, 9999); 
      }
    });

    /* ── Tick ── */
    let clock = 0;
    const tick = () => {
      requestAnimationFrame(tick);
      clock += 0.016;

      const scrollY = window.scrollY;
      // Parallax zoom IN on scroll, clamped so particles never get too close or obstruct text/UI
      camera.position.z = Math.max(55.0, 80 - scrollY * 0.006);
      
      // Slight mouse parallax, absolutely NO spinning or scroll rotation
      mainParticles.rotation.y = mouseX * 0.15;
      mainParticles.rotation.x = mouseY * 0.15;
      
      ambParticles.rotation.y = mouseX * 0.1;
      ambParticles.rotation.x = mouseY * 0.1;

      mainMat.uniforms.uTime.value = clock;
      ambMat.uniforms.uTime.value  = clock;

      renderer.render(scene, camera);
    };

    tick();

    this.threeCtx = { mainMat, ambMat, mainParticles };
  },

  /* ── 2b. Canvas2D fallback (Firefox / no-WebGL) ── */
  initCanvas2D (canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COUNT = window.innerWidth < 768 ? 1500 : 3500;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    /* Build particles spread in a sphere-ish distribution */
    const pts = [];
    for (let i = 0; i < COUNT; i++) {
      const angle  = Math.random() * Math.PI * 2;
      const radius = 60 + Math.random() * Math.min(canvas.width, canvas.height) * 0.44;
      const cx = canvas.width  / 2;
      const cy = canvas.height / 2;
      const roll = Math.random();

      let r, g, b;
      if (roll < 0.06) { r = 255; g = 184; b = 0; }         /* amber */
      else if (roll < 0.10) { r = 0; g = 255; b = 204; }    /* cyan */
      else { const br = 100 + Math.random() * 155; r = 0; g = br; b = Math.floor(br * 0.06); }

      pts.push({
        ox: cx + Math.cos(angle) * radius,
        oy: cy + Math.sin(angle) * radius,
        x: 0, y: 0,
        size:  0.7 + Math.random() * 1.8,
        r, g, b,
        alpha: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.006,
      });
    }

    let mx = 0, my = 0;
    window.addEventListener('mousemove', e => {
      mx = e.clientX / window.innerWidth  - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    let ga = 0;  /* global alpha fade-in — controlled by loader */
    let t  = 0;

    this.canvas2DAlpha = () => ga;
    this.canvas2DSetAlpha = v => { ga = v; };

    const draw = () => {
      requestAnimationFrame(draw);
      t += 0.016;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x = p.ox + Math.cos(t * p.speed * 30 + p.phase) * 14 + mx * 22;
        p.y = p.oy + Math.sin(t * p.speed * 55 + p.phase) * 8  + my * 22;

        const pulse = 0.55 + 0.45 * Math.sin(t * p.speed * 80 + p.phase);
        const a     = p.alpha * pulse * ga;
        if (a < 0.01) continue;

        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.5);
        grd.addColorStop(0,   `rgba(${p.r},${p.g},${p.b},${a})`);
        grd.addColorStop(0.4, `rgba(${p.r},${p.g},${p.b},${a * 0.35})`);
        grd.addColorStop(1,   `rgba(${p.r},${p.g},${p.b},0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
    };

    draw();
    this.threeCtx = { is2D: true }; /* mark as active so loader knows */
  },

  /* ── Uniform tweener (WebGL fade-in helper) ── */
  tweenUniform (uniform, from, to, duration) {
    const start = performance.now();
    uniform.value = from;
    const step = now => {
      const t = Math.min((now - start) / duration, 1);
      uniform.value = from + (to - from) * (1 - Math.pow(1 - t, 3));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  /* ────────────────────────────────────────────────────────────────
     3. LENIS SMOOTH SCROLL
     ──────────────────────────────────────────────────────────────── */
  initLenis () {
    if (!window.Lenis) return;
    this.lenis = new Lenis({
      duration: 1.4,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });
    const raf = time => { this.lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (window.ScrollTrigger) {
      this.lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.lagSmoothing(0);
      gsap.ticker.add(time => this.lenis.raf(time * 1000));
    }
  },

  /* ────────────────────────────────────────────────────────────────
     4. CINEMATIC LOADER
     ──────────────────────────────────────────────────────────────── */
  runLoader () {
    return new Promise(resolve => {
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

      const timer = setInterval(() => {
        pct += (95 - pct) * 0.055 + 0.4;
        this.setProgress(pct);

        if (pct > 45  && si === 0) { this.setStatus(statuses[1]); si++; }
        if (pct > 60  && si === 1) { this.setStatus(statuses[2]); si++; }
        if (pct > 72  && si === 2) { this.setStatus(statuses[3]); si++; }
        if (pct > 83  && si === 3) { this.setStatus(statuses[4]); si++; }

        if (pct >= 94.5) {
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
            setTimeout(() => {
              this.tweenUniform(mats.uProgress1, 0, 1, 2500); // 2.5s duration
            }, 200);
            
            // 2. Direct Morph to jx-hero-2 (Actual colors)
            setTimeout(() => {
              this.tweenUniform(mats.uProgress2, 0, 1, 2500); // 2.5s duration
            }, 3000); 
            
            // End Phase 2, move to Phase 3 (HTML Reveal)
            setTimeout(resolve, 6000);
          } else {
            setTimeout(resolve, 1500);
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

    tl.to(['#hl-1', '#hl-2'], {
      y: 0, opacity: 1, duration: 0.9,
      ease: 'expo.out', stagger: 0.08
    }, '-=0.3');

    tl.to(['#hr-1', '#hr-2', '#hr-3', '.hero-role-separator'], {
      opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.06
    }, '-=0.4');

    tl.to('#hero-desc', { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.2');
    tl.to('#hero-cta',  { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.2');

    tl.to('#hero-meta', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.5');
    tl.to('#hero-hud',  { opacity: 1, duration: 0.8, ease: 'power2.out', stagger: 0.08 }, '-=0.6');
    tl.to('#hero-scroll', { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.2');
  },

  /* ────────────────────────────────────────────────────────────────
     6. AFTER REVEAL — all remaining system boots
     ──────────────────────────────────────────────────────────────── */
  afterReveal () {
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      this.initScrollAnimations();
    }
    this.initHUD();
    this.initTicker();
    this.initCLI();
    this.loadFeaturedProjects();
  },

  /* ────────────────────────────────────────────────────────────────
     7. SCROLL ANIMATIONS
     ──────────────────────────────────────────────────────────────── */
  initScrollAnimations () {
    /* Particle Morphing ScrollTriggers */
    if (this.threeCtx && !this.threeCtx.is2D && window.gsap && window.ScrollTrigger) {
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
    });

    /* Service cards stagger */
    gsap.fromTo('.service-card', { opacity: 0, y: 30 }, {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: '.services-grid', start: 'top 85%', once: true }
    });
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
    if (window.initSupabase) await window.initSupabase();
    if (typeof supabase === 'undefined' || !supabase.from) return;

    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('featured', true)
        .order('priority', { ascending: true })
        .limit(3);

      if (error || !projects || projects.length === 0) {
        grid.innerHTML = '<p class="featured-empty" style="text-align:center;color:var(--gray-3);font-family:var(--font-mono);font-size:var(--text-sm);padding:60px;">No featured projects yet — add them in the admin panel.</p>';
        return;
      }

      grid.innerHTML = projects.map((p, i) => this.renderProjectCard(p, i)).join('');

      /* Animate cards in */
      if (window.gsap) {
        gsap.fromTo('.project-card', { opacity: 0, y: 40 }, {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1,
          scrollTrigger: { trigger: grid, start: 'top 85%', once: true }
        });
      }

      /* Bind card clicks */
      grid.querySelectorAll('.project-card').forEach((card, i) => {
        card.addEventListener('click', () => this.openModal(projects[i]));
        card.addEventListener('keydown', e => { if (e.key === 'Enter') this.openModal(projects[i]); });
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View project: ${projects[i].title}`);
      });

      /* Refresh cursor hover states */
      if (window.JX && window.JX.refreshCursor) window.JX.refreshCursor();

    } catch (err) {
      console.error('JX: Featured projects error:', err);
    }
  },

  renderProjectCard (p, i) {
    const imagePart = p.image_url
      ? `<img src="${p.image_url}" alt="${p.title}" class="project-card-image" loading="lazy">`
      : `<div class="project-card-placeholder">${(p.title || 'JX').slice(0,2).toUpperCase()}</div>`;

    const tools = (p.tools || []).slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('');

    return `
      <article class="project-card" data-id="${p.id}">
        ${imagePart}
        <div class="project-card-body">
          <div class="project-card-meta">
            <span class="project-card-category">${p.category || 'Project'}</span>
            <span class="project-card-year">${p.year || ''}</span>
          </div>
          <h3 class="project-card-title">${p.title}</h3>
          <p class="project-card-desc">${(p.description || '').slice(0, 100)}${(p.description || '').length > 100 ? '…' : ''}</p>
          <div class="project-card-tools">${tools}</div>
        </div>
        <div class="project-card-arrow" aria-hidden="true">↗</div>
      </article>
    `;
  },

  /* ────────────────────────────────────────────────────────────────
     10. CINEMATIC MODAL
     ──────────────────────────────────────────────────────────────── */
  openModal (p) {
    /* Remove any existing modal */
    document.getElementById('jx-modal-overlay')?.remove();

    const tools = (p.tools || []).map(t => `<span class="tag">${t}</span>`).join('');
    const imagePart = p.image_url
      ? `<div class="modal-image-pane">
           <img src="${p.image_url}" alt="${p.title}">
           <div class="modal-image-overlay"></div>
         </div>`
      : `<div class="modal-image-pane" style="background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:5rem;font-weight:800;color:var(--green);">
           ${(p.title || '').slice(0,2).toUpperCase()}
         </div>`;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'jx-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', p.title);
    overlay.innerHTML = `
      <div class="modal">
        ${imagePart}
        <div class="modal-content">
          <div class="section-label">${p.category || 'Project'}</div>
          <h2 class="modal-title">${p.title}</h2>
          <p style="font-size:var(--text-sm);color:var(--gray-2);line-height:var(--lead-relaxed);">
            ${p.description || ''}
          </p>
          <div class="project-card-tools">${tools}</div>
          ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener" class="btn btn-primary" style="align-self:flex-start;margin-top:var(--s-4);">View Project ↗</a>` : ''}
          ${p.case_study ? `<p style="font-size:var(--text-sm);color:var(--gray-2);line-height:var(--lead-relaxed);border-top:1px solid var(--border);padding-top:var(--s-6);margin-top:var(--s-2);">${p.case_study}</p>` : ''}
        </div>
        <button class="modal-close" id="modal-close" aria-label="Close modal">✕</button>
      </div>
    `;

    document.body.append(overlay);

    /* Open */
    requestAnimationFrame(() => {
      overlay.classList.add('open');
      document.getElementById('modal-close')?.addEventListener('click', () => this.closeModal());
      overlay.addEventListener('click', e => { if (e.target === overlay) this.closeModal(); });
      document.addEventListener('keydown', this._escListener = e => {
        if (e.key === 'Escape') this.closeModal();
      });
      document.body.style.overflow = 'hidden';
    });
  },

  closeModal () {
    const overlay = document.getElementById('jx-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this._escListener);
    setTimeout(() => overlay.remove(), 500);
  },

  /* ────────────────────────────────────────────────────────────────
     11. SKILLS TICKER
     ──────────────────────────────────────────────────────────────── */
  initTicker () {
    const wrap = document.getElementById('ticker-inner');
    if (!wrap) return;

    const items = [
      'Product Design', 'Figma', 'UI/UX Research', 'Design Systems',
      'React', 'Next.js', 'Three.js', 'WebGL', 'GSAP',
      'Node.js', 'Supabase', 'PostgreSQL',
      'N8N Automations', 'Workflow Design',
      'Ethical Hacking', 'Cybersecurity',
      'Afrofuturism', 'Lagos', '2089',
    ];

    const makeItem = t =>
      `<span class="ticker-item"><span class="ticker-diamond">◆</span>${t}</span>`;

    /* Duplicate for infinite loop */
    const html = [...items, ...items].map(makeItem).join('');
    wrap.innerHTML = html;
  },

  /* ────────────────────────────────────────────────────────────────
     12. JX TERMINAL — CLI
     ──────────────────────────────────────────────────────────────── */
  initCLI () {
    const panel   = document.getElementById('cli-panel');
    const trigger = document.getElementById('cli-trigger');
    const closeBtn = document.getElementById('cli-close');
    const input   = document.getElementById('cli-input');
    const output  = document.getElementById('cli-output');
    if (!panel || !input || !output) return;

    const BOOT_MESSAGES = [
      { text: '╔══════════════════════════════════╗', class: 'green' },
      { text: '║     JX UNIVERSE — v3.0           ║', class: 'green' },
      { text: '║     jxdesigndev.com              ║', class: 'green' },
      { text: '╚══════════════════════════════════╝', class: 'green' },
      { text: '' },
      { text: 'SYSTEM: Consciousness online.', class: 'dim' },
      { text: 'LOCATION: Lagos, Nigeria · NGT', class: 'dim' },
      { text: 'STATUS: Ready.', class: 'dim' },
      { text: '' },
      { text: "Type 'help' to see available commands.", class: 'dim' },
    ];

    const COMMANDS = {
      help: [
        { text: '┌─ AVAILABLE COMMANDS ────────────────┐', class: 'green' },
        { text: '│  about     → Who is JX?             │' },
        { text: '│  skills    → Full skill stack        │' },
        { text: '│  work      → View project vault      │' },
        { text: '│  services  → The Forge               │' },
        { text: '│  contact   → Get in touch            │' },
        { text: '│  hire me   → Let\'s build together    │' },
        { text: '│  clear     → Clear terminal          │' },
        { text: '│  status    → System vitals           │' },
        { text: '└─────────────────────────────────────┘', class: 'green' },
      ],
      about: [
        { text: '> Scanning JX consciousness...', class: 'dim' },
        { text: '' },
        { text: 'NAME:       Okezie Ferdinand', class: 'green' },
        { text: 'ALIAS:      JX' },
        { text: 'ORIGIN:     Lagos, Nigeria' },
        { text: 'MISSION:    Build the world\'s best digital experiences.' },
        { text: '' },
        { text: 'JOURNEY:    Cartoon Artist → Character Designer', class: 'amber' },
        { text: '            → UI/UX Designer → Product Designer', class: 'amber' },
        { text: '            → Full-Stack Developer → Security Learner', class: 'amber' },
        { text: '            → Game Builder → [UNDEFINED — STILL GROWING]', class: 'amber' },
        { text: '' },
        { text: 'TRUTH:      "I don\'t just build websites. I build worlds."', class: 'green' },
      ],
      skills: [
        { text: '> Loading skill matrix...', class: 'dim' },
        { text: '' },
        { text: '[ DESIGN ]', class: 'green' },
        { text: '  Figma · Prototyping · Design Systems · UX Research' },
        { text: '' },
        { text: '[ DEVELOPMENT ]', class: 'green' },
        { text: '  HTML · CSS · JavaScript · React · Next.js · Node.js' },
        { text: '  Three.js · WebGL · GSAP · Supabase · PostgreSQL' },
        { text: '' },
        { text: '[ AUTOMATION ]', class: 'green' },
        { text: '  N8N · Workflow Design · API Integration' },
        { text: '' },
        { text: '[ SECURITY ]', class: 'green' },
        { text: '  Ethical Hacking · Penetration Testing [LEARNING]' },
        { text: '' },
        { text: '[ GAMES ]', class: 'green' },
        { text: '  Afrocentric character design · Game logic [IN PROGRESS]' },
      ],
      status: [
        { text: '> Running diagnostics...', class: 'dim' },
        { text: '' },
        { text: '● CONSCIOUSNESS:  ONLINE', class: 'green' },
        { text: `● LOCATION:       Lagos, Nigeria — NGT` },
        { text: '● AVAILABILITY:   OPEN TO WORK', class: 'amber' },
        { text: '● CREATIVITY:     ████████████ 100%', class: 'green' },
        { text: '● AMBITION:       INFINITE', class: 'amber' },
        { text: '● COFFEE LEVEL:   SUFFICIENT', class: 'dim' },
      ],
      work: [
        { text: '> Opening The Vault...', class: 'green' },
        { text: 'Navigating to work.html in 1 second...', class: 'dim' },
      ],
      services: [
        { text: '> Activating The Forge...', class: 'green' },
        { text: 'Navigating to services.html in 1 second...', class: 'dim' },
      ],
      contact: [
        { text: '> Opening The Signal...', class: 'green' },
        { text: 'Navigating to contact.html in 1 second...', class: 'dim' },
      ],
      'hire me': [
        { text: '> EXCELLENT DECISION.', class: 'green' },
        { text: '' },
        { text: '  Initiating hire sequence...', class: 'amber' },
        { text: '  Calibrating genius levels...', class: 'dim' },
        { text: '  Opening contact portal...', class: 'dim' },
        { text: '' },
        { text: "  Let's build something historic.", class: 'green' },
      ],
    };

    const print = (lines, delay = 0) => {
      lines.forEach((line, i) => {
        setTimeout(() => {
          const el = document.createElement('p');
          el.className = 'cli-line ' + (line.class || '');
          el.textContent = line.text || '\u00A0';
          output.append(el);
          output.scrollTop = output.scrollHeight;
        }, delay + i * 30);
      });
    };

    const open = () => {
      panel.classList.add('open');
      this.cliOpen = true;
      if (output.children.length === 0) {
        print(BOOT_MESSAGES);
      }
      setTimeout(() => input.focus(), 200);
    };

    const close = () => {
      panel.classList.remove('open');
      this.cliOpen = false;
    };

    trigger?.addEventListener('click', () => this.cliOpen ? close() : open());
    closeBtn?.addEventListener('click', close);

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.cliOpen ? close() : open();
      }
      if (e.key === 'Escape' && this.cliOpen) close();
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const cmd = input.value.trim().toLowerCase();
        input.value = '';
        if (!cmd) return;

        /* Echo command */
        const cmdLine = document.createElement('p');
        cmdLine.className = 'cli-line';
        cmdLine.textContent = `jx@universe:~$ ${cmd}`;
        output.append(cmdLine);
        output.scrollTop = output.scrollHeight;

        this.cliHistory.unshift(cmd);
        this.cliIndex = -1;

        if (cmd === 'clear') {
          output.innerHTML = '';
          return;
        }

        const response = COMMANDS[cmd];
        if (response) {
          print(response, 80);
          /* Navigate commands */
          if (cmd === 'work')     setTimeout(() => { sessionStorage.setItem('ct-active','1'); window.location.href = 'work.html'; }, 1500);
          if (cmd === 'services') setTimeout(() => { sessionStorage.setItem('ct-active','1'); window.location.href = 'services.html'; }, 1500);
          if (cmd === 'contact' || cmd === 'hire me') setTimeout(() => { sessionStorage.setItem('ct-active','1'); window.location.href = 'contact.html'; }, 2200);
        } else {
          print([
            { text: `Command not found: '${cmd}'`, class: 'error' },
            { text: "Type 'help' for available commands.", class: 'dim' },
          ], 80);
        }
      }

      /* History navigation */
      if (e.key === 'ArrowUp') {
        if (this.cliIndex < this.cliHistory.length - 1) {
          this.cliIndex++;
          input.value = this.cliHistory[this.cliIndex];
        }
      }
      if (e.key === 'ArrowDown') {
        if (this.cliIndex > 0) {
          this.cliIndex--;
          input.value = this.cliHistory[this.cliIndex];
        } else {
          this.cliIndex = -1;
          input.value = '';
        }
      }
    });
  },

};

/* ── Boot ── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => JXUniverse.init());
} else {
  JXUniverse.init();
}
