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
  async initParticles () {
    const canvas = this.heroCanvas;
    if (!canvas) return;

    /* Try WebGL first */
    if (window.THREE) {
      try {
        await this.initThreeJS(canvas);
        return;
      } catch (e) {
        console.warn('JX: WebGL failed, switching to Canvas2D.', e.message);
      }
    }

    /* Canvas2D fallback */
    this.initCanvas2D(canvas);
  },

  /* ── 2a. THREE.JS WebGL particle universe ── */
  async initThreeJS (canvas) {
    if (!this.particleWorker) {
      this.particleWorker = new Worker('particle-worker.js');
      this.workerPending = {};
      this.workerId = 0;
      this.particleWorker.onmessage = (e) => {
        const data = e.data;
        if (this.workerPending[data.id]) {
          clearTimeout(this.workerPending[data.id].timer);
          if (data.error) this.workerPending[data.id].reject(new Error(data.error));
          else this.workerPending[data.id].resolve(data);
          delete this.workerPending[data.id];
        }
      };
    }
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(75, W / H, 0.1, 2000);
    camera.position.z = 80;

    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, alpha: true,
      powerPreference: 'high-performance',
    });
    const maxPixelRatio = window.innerWidth < 768 ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);

    /* Extract Pixel Data for Faces (Fallback Math) */
    const extractPixelsFallback = (img, posArr, colorArr, useColor=false, offsetX=0, offsetY=0, offsetZ=0, scale=0.6) => {
      if (!img) return;
      const c = document.createElement('canvas');
      const sampleW = 350;
      const sampleH = Math.round(350 * (img.height / img.width));
      c.width = sampleW;
      c.height = sampleH;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, sampleW, sampleH);
      const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;

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

    /* Extract Pixel Data for Faces (Worker Call) */
    const extractPixels = (img, posArr, colorArr, useColor=false, offsetX=0, offsetY=0, offsetZ=0, scale=0.6) => {
      return new Promise((resolve) => {
        if (!img) return resolve();
        
        const c = document.createElement('canvas');
        const sampleW = 350;
        const sampleH = Math.round(350 * (img.height / img.width));
        c.width = sampleW;
        c.height = sampleH;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, sampleW, sampleH);
        const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
        
        this.workerId++;
        const id = this.workerId;
        
        const fallback = () => {
          console.warn(`JX: Worker timed out or failed for id ${id}, falling back to synchronous math.`);
          extractPixelsFallback(img, posArr, colorArr, useColor, offsetX, offsetY, offsetZ, scale);
          resolve();
        };

        const timer = setTimeout(() => {
          if (this.workerPending[id]) {
            delete this.workerPending[id];
            fallback();
          }
        }, 3000); // 3s timeout

        this.workerPending[id] = {
          timer,
          resolve: (data) => {
            if (data.posBuffer) {
              const posFloat = new Float32Array(data.posBuffer);
              for (let i = 0; i < posFloat.length; i+=3) {
                posArr.push({ x: posFloat[i], y: posFloat[i+1], z: posFloat[i+2] });
              }
            }
            if (useColor && data.colorBuffer && colorArr) {
              const colorFloat = new Float32Array(data.colorBuffer);
              for (let i = 0; i < colorFloat.length; i+=3) {
                colorArr.push({ r: colorFloat[i], g: colorFloat[i+1], b: colorFloat[i+2] });
              }
            }
            resolve();
          },
          reject: (err) => {
            console.error('Worker error:', err);
            fallback();
          }
        };

        this.particleWorker.postMessage({
          id,
          imgDataBuffer: imgData.data.buffer,
          sampleW,
          sampleH,
          useColor,
          offsetX,
          offsetY,
          offsetZ,
          scale
        }, [imgData.data.buffer]);
      });
    };
    
    let pOkezie1 = [], cOkezie1 = [];
    let pHero2 = [], cHero2 = [];
    let pPortrait = [], cPortrait = [];
    let pCoder = [], cCoder = [];
    let pDesigner = [], cDesigner = [];

    // Phase 2 & Phase 3 Hero: responsive scale and offset
    const isMobileHero = window.innerWidth < 768;
    const heroScale = isMobileHero ? 0.45 : 0.72;
    const heroOffsetX = isMobileHero ? 0.0 : 15.0;
    
    await Promise.all([
      extractPixels(this.imgOkezie1, pOkezie1, cOkezie1, true, heroOffsetX, 0, 0, heroScale),
      extractPixels(this.imgHero2, pHero2, cHero2, true, heroOffsetX, 0, 0, heroScale),
      // Target 4 (About): offset to left (-25.0, 0, -10.0, scale=0.5) so it never overlaps or disturbs text on right
      extractPixels(this.imgPortrait, pPortrait, cPortrait, true, -25.0, 0, -10.0, 0.5),
      // Target 5 (Work): offset to right (+28.0, 5.0, -12.0, scale=0.5) so it never overlaps text on left
      extractPixels(this.imgCoder, pCoder, cCoder, true, 28.0, 5.0, -12.0, 0.5),
      // Target 6 (Services): offset to left (-28.0, 5.0, -12.0, scale=0.5) so it never overlaps text on right
      extractPixels(this.imgDesigner, pDesigner, cDesigner, true, -28.0, 5.0, -12.0, 0.5)
    ]);

    /* Extract Text Pixels */
    let pText = [];
    const createTextCanvas = (line1, line2) => {
      pText = []; /* reset on each call */
      const c = document.createElement('canvas');
      const cw = 400, ch = 200;
      c.width = cw; c.height = ch;
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.font = 'bold 45px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const l1 = line1 !== undefined ? line1 : 'OKEZIE';
      const l2 = line2 !== undefined ? line2 : 'FERDINAND';
      if (l2) {
        ctx.fillText(l1, cw/2, ch/2 - 25);
        ctx.fillText(l2, cw/2, ch/2 + 25);
      } else {
        ctx.fillText(l1, cw/2, ch/2);
      }

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
    createTextCanvas(); /* initial call — keeps existing name text */

    /* 3C: expose to initTypeToForm (which lives outside this closure) */
    this._pText            = () => pText;
    this._createTextCanvas = createTextCanvas;

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

    /* ── Phase 4: Build Pong Arena Target (aTarget7) ── */
    const buildPongArena = (count) => {
      const arr = new Float32Array(count * 3);
      const W = 60, H = 40; // arena half-dimensions in scene units
      const PADDLE_H = 12;

      for (let i = 0; i < count; i++) {
        const roll = i / count;
        let x = 0, y = 0, z = 0;

        if (roll < 0.20) {
          /* Top wall */
          x = (Math.random() * 2 - 1) * W;
          y = H + Math.random() * 1.0;
        } else if (roll < 0.40) {
          /* Bottom wall */
          x = (Math.random() * 2 - 1) * W;
          y = -H - Math.random() * 1.0;
        } else if (roll < 0.60) {
          /* Left paddle */
          x = -W + (Math.random() - 0.5) * 2;
          y = (Math.random() * 2 - 1) * PADDLE_H;
        } else if (roll < 0.80) {
          /* Right paddle */
          x = W - (Math.random() - 0.5) * 2;
          y = (Math.random() * 2 - 1) * PADDLE_H;
        } else if (roll < 0.95) {
          /* Ball dot */
          const br = Math.random() * 3;
          const ba = Math.random() * Math.PI * 2;
          x = Math.cos(ba) * br;
          y = Math.sin(ba) * br;
        } else {
          /* Scattered arena dust */
          x = (Math.random() * 2 - 1) * W * 0.9;
          y = (Math.random() * 2 - 1) * H * 0.9;
          z = (Math.random() - 0.5) * 10;
        }
        arr[i * 3]     = x;
        arr[i * 3 + 1] = y;
        arr[i * 3 + 2] = z;
      }
      return arr;
    };

    for (let i = 0; i < MAIN_COUNT; i++) {
      const r_rand = 80 + Math.random() * 150;
      const theta_rand = Math.random() * Math.PI * 2;
      const phi_rand = Math.acos(2 * Math.random() - 1);
      mainPos[i*3]   = r_rand * Math.sin(phi_rand) * Math.cos(theta_rand);
      mainPos[i*3+1] = r_rand * Math.sin(phi_rand) * Math.sin(theta_rand);
      mainPos[i*3+2] = r_rand * Math.cos(phi_rand);

      const setTarget = (arr, tp, colorArr, cp) => {
        if (arr.length > 0) {
          const idx = Math.floor((i / MAIN_COUNT) * arr.length);
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

    /* Build and store pong target (done after loop) */
    const target7 = buildPongArena(MAIN_COUNT);
    this._pongArena = target7; // store for potential runtime updates

    mainGeo.setAttribute('position',   new THREE.BufferAttribute(mainPos, 3));
    mainGeo.setAttribute('aTarget1',   new THREE.BufferAttribute(target1, 3));
    mainGeo.setAttribute('aTarget2',   new THREE.BufferAttribute(target2, 3));
    mainGeo.setAttribute('aTarget3',   new THREE.BufferAttribute(targetText, 3));
    mainGeo.setAttribute('aTarget4',   new THREE.BufferAttribute(target4, 3));
    mainGeo.setAttribute('aTarget5',   new THREE.BufferAttribute(target5, 3));
    mainGeo.setAttribute('aTarget6',   new THREE.BufferAttribute(target6, 3));
    mainGeo.setAttribute('aTarget7',   new THREE.BufferAttribute(target7, 3)); /* Phase 4 Pong */
    mainGeo.setAttribute('aColor1',    new THREE.BufferAttribute(col1, 3));
    mainGeo.setAttribute('aColor2',    new THREE.BufferAttribute(col2, 3));
    mainGeo.setAttribute('aColor4',    new THREE.BufferAttribute(col4, 3));
    mainGeo.setAttribute('aColor5',    new THREE.BufferAttribute(col5, 3));
    mainGeo.setAttribute('aColor6',    new THREE.BufferAttribute(col6, 3));
    mainGeo.setAttribute('aAlpha',     new THREE.BufferAttribute(mainAlpha, 1));

    const mainMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:          { value: 0 },
        uAlpha:         { value: 0 },
        uProgress1:     { value: 0 },
        uProgress2:     { value: 0 },
        uProgress3:     { value: 0 },
        uProgress4:     { value: 0 },
        uProgress5:     { value: 0 },
        uProgress6:     { value: 0 },
        uGreenMix:      { value: 0 },
        uMouse:         { value: new THREE.Vector2(9999, 9999) },
        uSize:          { value: window.innerWidth < 768 ? 1.5 : 2.5 },
        /* Phase 2 — Scroll Consciousness */
        uScrollVelocity:{ value: 0 },
        uScrollColor:   { value: 0 },
        /* Phase 3 — Particle Sculpting */
        uMouseForce:    { value: new THREE.Vector3(9999, 9999, 0) },
        uExplosion:     { value: new THREE.Vector3(9999, 9999, 0) },
        /* Phase 4 — Pong */
        uProgress7:     { value: 0 },
      },
      vertexShader: `
        attribute vec3 aTarget1;
        attribute vec3 aTarget2;
        attribute vec3 aTarget3;
        attribute vec3 aTarget4;
        attribute vec3 aTarget5;
        attribute vec3 aTarget6;
        attribute vec3 aTarget7;
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
        uniform float uProgress7;
        uniform float uGreenMix;
        uniform vec2  uMouse;
        uniform float uSize;
        uniform float uScrollVelocity;
        uniform float uScrollColor;
        uniform vec3  uMouseForce;
        uniform vec3  uExplosion;

        varying float vAlpha;
        varying vec3  vColor;

        /* Simplex-like hash for per-particle variation */
        float hash(float n) { return fract(sin(n) * 43758.5453); }

        void main () {
          vAlpha = mix(aAlpha, 1.0, uProgress7); // Force solid alpha in Pong mode

          vec3 pos = mix(position, aTarget1, uProgress1);
          pos = mix(pos, aTarget2, uProgress2);
          pos = mix(pos, aTarget3, uProgress3);
          pos = mix(pos, aTarget4, uProgress4);
          pos = mix(pos, aTarget5, uProgress5);
          pos = mix(pos, aTarget6, uProgress6);
          pos = mix(pos, aTarget7, uProgress7); /* Phase 4: Pong arena */

          /* ── Color morphing ── */
          vec3 color = vec3(0.0, 1.0, 0.25);
          vec3 c1 = clamp(aColor1 * 1.25, 0.0, 1.0);
          vec3 c2 = clamp(aColor2 * 1.25, 0.0, 1.0);
          vec3 c4 = clamp(aColor4 * 1.25, 0.0, 1.0);
          vec3 c5 = clamp(aColor5 * 1.25, 0.0, 1.0);
          vec3 c6 = clamp(aColor6 * 1.25, 0.0, 1.0);
          color = mix(color, c1, uProgress1);
          color = mix(color, c2, uProgress2);
          color = mix(color, vec3(1.0), uProgress3);
          color = mix(color, c4, uProgress4);
          color = mix(color, c5, uProgress5);
          color = mix(color, c6, uProgress6);
          float holoGlow = clamp((uProgress1 + uProgress2) * 0.4, 0.0, 1.0);
          color = mix(color, vec3(0.0, 1.0, 0.3), max(uGreenMix, holoGlow * 0.15));
          /* Phase 2: section-aware color shift — green → amber → cyan */
          vec3 sectionAmber = vec3(1.0, 0.72, 0.0);
          vec3 sectionCyan  = vec3(0.0, 1.0, 0.8);
          float sc = uScrollColor;
          color = mix(color, mix(sectionAmber, sectionCyan, smoothstep(0.5, 1.0, sc)), sc * 0.25);
          color = mix(color, vec3(1.0, 1.0, 1.0), uProgress7); // Force bright white in Pong mode
          vColor = color;

          /* ── Drift (ambient nebula motion) ── */
          float totalProg = max(max(max(max(uProgress1, uProgress2), max(uProgress3, uProgress4)), max(uProgress5, uProgress6)), uProgress7);
          float drift = 1.0 - totalProg * 0.9;
          float pid = hash(position.x + position.y * 13.7);
          pos.x += sin(uTime * 0.3 + position.y * 0.05 + pid) * 0.6 * drift;
          pos.y += cos(uTime * 0.2 + position.x * 0.05 + pid) * 0.6 * drift;
          pos.z += sin(uTime * 0.25 + position.z * 0.05 + pid) * 0.4 * drift;

          /* ── Phase 2: Scroll velocity stretch ── */
          /* Particles stretch along Y axis as you scroll fast */
          float stretchY = uScrollVelocity * 3.5;
          pos.y += stretchY * (pid - 0.5) * (1.0 - totalProg * 0.8);
          /* Z-depth parallax layers — slower particles drift back on scroll */
          pos.z -= uScrollVelocity * pid * 4.0;

          /* ── Phase 3A: Fluid mouse force field (large radius) ── */
          if (uMouseForce.z > 0.0) {
            vec2 mf = uMouseForce.xy * vec2(130.0, 130.0);
            vec2 toMouse = pos.xy - mf;
            float dist = length(toMouse);
            float radius = 28.0; /* much larger than old 10.0 */
            if (dist < radius && dist > 0.001) {
              vec2 dir    = normalize(toMouse);
              float falloff = 1.0 - smoothstep(0.0, radius, dist);
              float force   = falloff * falloff * uMouseForce.z * 6.0;
              pos.xy += dir * force;
              pos.z  += falloff * uMouseForce.z * 2.5;
              vAlpha  = clamp(vAlpha + falloff * 0.4, 0.0, 1.0);
            }
          }

          /* ── Phase 3B: Explosion shockwave ── */
          if (uExplosion.z > 0.0) {
            vec2 ec = uExplosion.xy * vec2(130.0, 130.0);
            vec2 fromBoom = pos.xy - ec;
            float eDist   = length(fromBoom);
            float eRadius = 60.0;
            if (eDist < eRadius && eDist > 0.001) {
              vec2  eDir     = normalize(fromBoom);
              float eFalloff = 1.0 - smoothstep(0.0, eRadius, eDist);
              float eForce   = eFalloff * uExplosion.z * 18.0;
              pos.xy += eDir * eForce;
              pos.z  += eFalloff * uExplosion.z * 8.0;
              /* Explosion colors flash amber/white */
              vColor = mix(vColor, vec3(1.0, 0.8, 0.2), eFalloff * uExplosion.z * 0.9);
              vAlpha = clamp(vAlpha + eFalloff * uExplosion.z, 0.0, 1.0);
            }
          }

          gl_Position  = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          float pSize  = uSize * (180.0 / -gl_Position.z);
          gl_PointSize = clamp(pSize, 1.0, 25.0);
        }
      `,
      fragmentShader: `
        uniform float uAlpha;
        varying float vAlpha;
        varying vec3  vColor;

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

    /* ── Phase 1: Mouse from JX.cursor bus ── */
    /* Phase 3: Force field tracking ── */
    let mouseX = 0, mouseY = 0;
    let isMouseOnCanvas = false;

    document.addEventListener('mousemove', e => {
      mouseX = (e.clientX / window.innerWidth  - 0.5);
      mouseY = (e.clientY / window.innerHeight - 0.5);
      isMouseOnCanvas = true;
      if (this.threeCtx && this.threeCtx.mainMat) {
        const u = this.threeCtx.mainMat.uniforms;
        u.uMouse.value.set(mouseX * 2, -mouseY * 2);
        /* Phase 3: Force field follows cursor with moderate strength */
        u.uMouseForce.value.set(mouseX * 2, -mouseY * 2, 0.55);
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      isMouseOnCanvas = false;
      if (this.threeCtx && this.threeCtx.mainMat) {
        const u = this.threeCtx.mainMat.uniforms;
        u.uMouse.value.set(9999, 9999);
        u.uMouseForce.value.set(9999, 9999, 0);
      }
    });

    /* ── Phase 3: Click explosion ── */
    document.addEventListener('click', e => {
      if (!this.threeCtx || this.threeCtx.is2D) return;
      const nx = (e.clientX / window.innerWidth  - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * -2;
      const u  = this.threeCtx.mainMat.uniforms;
      /* Trigger explosion, then decay */
      u.uExplosion.value.set(nx, ny, 1.0);
      setTimeout(() => {
        if (this.threeCtx && this.threeCtx.mainMat)
          this.threeCtx.mainMat.uniforms.uExplosion.value.set(9999, 9999, 0);
      }, 400);
    });

    /* ── Phase 3: Mobile touch sculpt ── */
    document.addEventListener('touchmove', e => {
      if (!this.threeCtx || this.threeCtx.is2D) return;
      const t  = e.touches[0];
      const nx = (t.clientX / window.innerWidth  - 0.5) * 2;
      const ny = (t.clientY / window.innerHeight - 0.5) * -2;
      this.threeCtx.mainMat.uniforms.uMouseForce.value.set(nx, ny, 0.7);
    }, { passive: true });
    document.addEventListener('touchend', () => {
      if (this.threeCtx && this.threeCtx.mainMat)
        this.threeCtx.mainMat.uniforms.uMouseForce.value.set(9999, 9999, 0);
    });

    /* ── Phase 3: Shake to explode (mobile) ── */
    let lastShake = 0;
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', e => {
        const a = e.acceleration;
        if (!a) return;
        const mag = Math.sqrt((a.x||0)**2 + (a.y||0)**2 + (a.z||0)**2);
        if (mag > 18 && Date.now() - lastShake > 1200) {
          lastShake = Date.now();
          if (this.threeCtx && this.threeCtx.mainMat) {
            const u = this.threeCtx.mainMat.uniforms;
            u.uExplosion.value.set(0, 0, 1.0);
            setTimeout(() => {
              if (this.threeCtx && this.threeCtx.mainMat)
                u.uExplosion.value.set(9999, 9999, 0);
            }, 600);
          }
        }
      }, { passive: true });
    }

    /* ── Phase 2: Scroll velocity tracking ── */
    let lastScrollY  = window.scrollY;
    let scrollVel    = 0;
    let scrollSection = 0; // 0..1 normalized through page

    /* ── Tick ── */
    let clock = 0;
    const _mqlRM = window.matchMedia('(prefers-reduced-motion: reduce)');

    let rafId = null;
    let isVisible = !document.hidden;
    let inViewport = true;

    const startLoop = () => {
      if (!rafId && isVisible && inViewport) {
        tick();
      }
    };
    const stopLoop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
      if (isVisible) startLoop();
      else stopLoop();
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          inViewport = entry.isIntersecting;
          if (inViewport) startLoop();
          else stopLoop();
        });
      }, { threshold: 0.01 });
      observer.observe(canvas);
    }

    let cachedScrollY = window.scrollY;
    let cachedDocH = Math.max(1, document.body.scrollHeight - window.innerHeight);

    window.addEventListener('scroll', () => { cachedScrollY = window.scrollY; }, { passive: true });
    window.addEventListener('resize', () => { cachedDocH = Math.max(1, document.body.scrollHeight - window.innerHeight); }, { passive: true });

    const tick = (now) => {
      rafId = requestAnimationFrame(tick);
      if (!_mqlRM.matches) clock += 0.016;

      const scrollY    = cachedScrollY;
      const rawVel     = (scrollY - lastScrollY);
      lastScrollY      = scrollY;
      /* Smooth the velocity so it doesn't snap */
      scrollVel        = scrollVel * 0.85 + rawVel * 0.15;

      /* Scroll section 0=hero, 1=bottom */
      const docH = cachedDocH;
      scrollSection    = docH > 0 ? Math.min(scrollY / docH, 1) : 0;

      /* Phase 2: Camera Z parallax */
      camera.position.z = Math.max(55.0, 80 - scrollY * 0.006);
      /* Phase 2: tiny Y drift on scroll for depth sensation */
      camera.position.y = !_mqlRM.matches ? scrollVel * 0.04 : 0;

      /* Mouse parallax rotation (no spinning) */
      if (!_mqlRM.matches) {
        mainParticles.rotation.y = mouseX * 0.15;
        mainParticles.rotation.x = mouseY * 0.15;
        ambParticles.rotation.y  = mouseX * 0.10;
        ambParticles.rotation.x  = mouseY * 0.10;
      } else {
        mainParticles.rotation.y = 0;
        mainParticles.rotation.x = 0;
        ambParticles.rotation.y  = 0;
        ambParticles.rotation.x  = 0;
      }

      mainMat.uniforms.uTime.value          = clock;
      mainMat.uniforms.uScrollVelocity.value = scrollVel / 60.0; // normalize to ~0..±1
      mainMat.uniforms.uScrollColor.value    = scrollSection;
      ambMat.uniforms.uTime.value            = clock;

      /* Phase 3: Smoothly decay explosion */
      const exp = mainMat.uniforms.uExplosion.value;
      if (exp.z > 0.001 && exp.x !== 9999) {
        exp.z = Math.max(0, exp.z - 0.025);
      }

      renderer.render(scene, camera);
    };

    startLoop();

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

    let rafId = null;
    let isVisible = !document.hidden;
    let inViewport = true;

    const startLoop = () => {
      if (!rafId && isVisible && inViewport) {
        draw();
      }
    };
    const stopLoop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
      if (isVisible) startLoop();
      else stopLoop();
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          inViewport = entry.isIntersecting;
          if (inViewport) startLoop();
          else stopLoop();
        });
      }, { threshold: 0.01 });
      observer.observe(canvas);
    }

    const draw = () => {
      rafId = requestAnimationFrame(draw);
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

    startLoop();
    this.threeCtx = { is2D: true }; /* mark as active so loader knows */
  },

  /* ── Uniform tweener (WebGL fade-in helper) ── */
  tweenUniform (uniform, from, to, duration) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      uniform.value = to;
      return;
    }
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
    if (!window.Lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.JXLenis) {
      window.JXLenis = new Lenis({ duration: 1.4, smoothWheel: true });
      const raf = t => { window.JXLenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      if (window.ScrollTrigger) window.JXLenis.on('scroll', ScrollTrigger.update);
    }
    this.lenis = window.JXLenis;
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
      let particlesInitDone = false;
      this.particlesReady = false;

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
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      this.initScrollAnimations();
    }
    this.initHUD();
    this.initTicker();
    this.initCLI();
    this.initTypeToForm();
    this.loadFeaturedProjects();
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
  initPong () {
    if (this._pongActive) return; // already running
    if (!this.threeCtx || this.threeCtx.is2D) {
      console.warn('JX Pong: WebGL required');
      return;
    }

    this._pongActive = true;
    document.body.classList.add('pong-active');
    const mats = this.threeCtx.mainMat.uniforms;

    /* Transition particles to pong arena */
    this.tweenUniform(mats.uProgress7, 0, 1, 1200);
    /* Fade out portrait / section morphs while in game */
    const savedP4 = mats.uProgress4.value;
    const savedP5 = mats.uProgress5.value;
    const savedP6 = mats.uProgress6.value;
    this.tweenUniform(mats.uProgress4, mats.uProgress4.value, 0, 800);
    this.tweenUniform(mats.uProgress5, mats.uProgress5.value, 0, 800);
    this.tweenUniform(mats.uProgress6, mats.uProgress6.value, 0, 800);
    /* Camera pull back */
    if (window.gsap && this.threeCtx.mainParticles) {
      gsap.to(this.threeCtx.mainParticles.position, { z: -20, duration: 1.2, ease: 'power2.inOut' });
    }

    /* \u2500\u2500 Build HUD overlay \u2500\u2500 */
    const isTouch = window.matchMedia('(hover: none)').matches;
    const hud = document.createElement('div');
    hud.id = 'pong-hud';
    hud.innerHTML = `
      <div class="pong-score" aria-live="polite" aria-atomic="true">
        <span id="pong-score-l">00</span>
        <span class="pong-sep">·</span>
        <span id="pong-score-r">00</span>
      </div>
      <div class="pong-title">PARTICLE PONG</div>
      <div class="pong-hint">${isTouch ? 'Drag to play · Tap ✕ to exit' : 'Move mouse · Esc to exit'}</div>
      <button class="pong-close-btn" id="pong-close-btn" aria-label="Exit Pong">✕</button>
    `;
    document.body.append(hud);

    /* Inject pong HUD CSS if not already there */
    if (!document.getElementById('pong-css')) {
      const s = document.createElement('style');
      s.id = 'pong-css';
      s.textContent = `
        body.pong-active #page {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.5s ease;
        }
        body.pong-active #hero-canvas {
          background-color: var(--bg, #030508);
          z-index: 201;
        }
        body.pong-active nav {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        #pong-hud {
          position: fixed; inset: 0; z-index: 9998;
          display: flex; flex-direction: column;
          align-items: center; justify-content: flex-start;
          pointer-events: none;
          padding-top: 32px;
          animation: pong-fadein 0.6s ease;
        }
        @keyframes pong-fadein { from { opacity: 0; } to { opacity: 1; } }
        .pong-score {
          font-family: var(--font-mono, monospace);
          font-size: clamp(36px, 6vw, 72px);
          font-weight: 700;
          color: var(--green, #00ff41);
          text-shadow: 0 0 20px rgba(0,255,65,0.8), 0 0 50px rgba(0,255,65,0.4);
          letter-spacing: 0.2em;
          line-height: 1;
        }
        .pong-sep { color: rgba(0,255,65,0.3); margin: 0 0.3em; }
        .pong-title {
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          letter-spacing: 0.3em;
          color: rgba(0,255,65,0.4);
          margin-top: 8px;
          text-transform: uppercase;
        }
        .pong-hint {
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          letter-spacing: 0.2em;
          color: rgba(255,255,255,0.25);
          margin-top: 4px;
        }
        .pong-close-btn {
          position: absolute;
          top: var(--s-4, 1rem);
          right: var(--s-4, 1rem);
          background: var(--surface-2, #0c0e12);
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          color: var(--white, #F0F4F8);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: var(--text-sm, 0.875rem);
          transition: border-color 0.2s ease, color 0.2s ease;
          pointer-events: auto;
          z-index: 10;
        }
        .pong-close-btn:hover {
          border-color: var(--green, #00FF41);
          color: var(--green, #00FF41);
        }
      `;
      document.head.append(s);
    }

    /* \u2500\u2500 Game state \u2500\u2500 */
    const ARENA_W = 60, ARENA_H = 40, PADDLE_H = 12;
    let ballX = 0, ballY = 0;
    let ballVX = 0.5, ballVY = 0.3;
    let paddleLY = 0, paddleRY = 0;
    let scoreL = 0, scoreR = 0;
    let mouseNY = 0; // player (left) paddle
    const SPEED_BASE = 0.45;
    const AI_SPEED   = 0.06;

    ballVX = SPEED_BASE * (Math.random() > 0.5 ? 1 : -1);
    ballVY = SPEED_BASE * (Math.random() * 0.8 - 0.4);

    const scoreElL = document.getElementById('pong-score-l');
    const scoreElR = document.getElementById('pong-score-r');

    /* Mouse/touch control for left paddle */
    const onMove = (e) => {
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      mouseNY = -(cy / window.innerHeight - 0.5) * 2; // -1..1
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: true });

    /* ─── Game loop ─── */
    let pongRAF;
    const step = () => {
      if (!this._pongActive) return;
      pongRAF = requestAnimationFrame(step);

      /* Player paddle (left) follows mouse */
      paddleLY += (mouseNY * (ARENA_H - PADDLE_H) - paddleLY) * 0.12;
      paddleLY  = Math.max(-ARENA_H + PADDLE_H, Math.min(ARENA_H - PADDLE_H, paddleLY));

      /* AI paddle (right) tracks ball */
      const aiTarget = ballY;
      paddleRY += (aiTarget - paddleRY) * AI_SPEED;
      paddleRY  = Math.max(-ARENA_H + PADDLE_H, Math.min(ARENA_H - PADDLE_H, paddleRY));

      /* Ball movement */
      ballX += ballVX;
      ballY += ballVY;

      /* Top/bottom wall bounce */
      if (ballY > ARENA_H - 1 || ballY < -ARENA_H + 1) {
        ballVY *= -1;
        ballY   = Math.sign(ballY) * (ARENA_H - 1);
        /* Explosion on wall hit */
        if (mats.uExplosion) {
          mats.uExplosion.value.set(ballX / 130, ballY / 130, 0.5);
          setTimeout(() => { if (mats.uExplosion) mats.uExplosion.value.set(9999, 9999, 0); }, 200);
        }
      }

      /* Left paddle collision */
      if (ballX < -ARENA_W + 3 && Math.abs(ballY - paddleLY) < PADDLE_H) {
        ballVX = Math.abs(ballVX) * 1.03; // speed up slightly
        ballVY += (ballY - paddleLY) * 0.04;
        if (mats.uExplosion) {
          mats.uExplosion.value.set(-1, paddleLY / 130, 0.6);
          setTimeout(() => { if (mats.uExplosion) mats.uExplosion.value.set(9999, 9999, 0); }, 200);
        }
      }

      /* Right paddle collision */
      if (ballX > ARENA_W - 3 && Math.abs(ballY - paddleRY) < PADDLE_H) {
        ballVX = -Math.abs(ballVX) * 1.03;
        ballVY += (ballY - paddleRY) * 0.04;
        if (mats.uExplosion) {
          mats.uExplosion.value.set(1, paddleRY / 130, 0.6);
          setTimeout(() => { if (mats.uExplosion) mats.uExplosion.value.set(9999, 9999, 0); }, 200);
        }
      }

      /* Cap speed */
      const speed = Math.sqrt(ballVX**2 + ballVY**2);
      if (speed > 1.4) { ballVX /= speed / 1.4; ballVY /= speed / 1.4; }

      /* Scoring: ball exits arena */
      if (ballX > ARENA_W + 2) {
        scoreL = Math.min(scoreL + 1, 99);
        if (scoreElL) scoreElL.textContent = String(scoreL).padStart(2, '0');
        ballX = 0; ballY = 0;
        ballVX = -SPEED_BASE; ballVY = (Math.random() - 0.5) * SPEED_BASE;
        mats.uExplosion.value.set(0.5, 0, 1.0);
        setTimeout(() => { if (mats.uExplosion) mats.uExplosion.value.set(9999, 9999, 0); }, 500);
      }
      if (ballX < -ARENA_W - 2) {
        scoreR = Math.min(scoreR + 1, 99);
        if (scoreElR) scoreElR.textContent = String(scoreR).padStart(2, '0');
        ballX = 0; ballY = 0;
        ballVX = SPEED_BASE; ballVY = (Math.random() - 0.5) * SPEED_BASE;
        mats.uExplosion.value.set(-0.5, 0, 1.0);
        setTimeout(() => { if (mats.uExplosion) mats.uExplosion.value.set(9999, 9999, 0); }, 500);
      }

      /* Push ball position to shader as mouse force */
      if (mats.uMouseForce) {
        mats.uMouseForce.value.set(ballX / 130, ballY / 130, 0.9);
      }

      /* Update visual particle positions */
      if (!this._pongBase) {
        this._pongBase = Float32Array.from(this.threeCtx.mainParticles.geometry.attributes.aTarget7.array);
      }
      const attr = this.threeCtx.mainParticles.geometry.attributes.aTarget7;
      const arr = attr.array;
      const base = this._pongBase;
      const count = attr.count;

      /* 0.40 - 0.60: Left Paddle */
      const idxLPStart = Math.floor(0.40 * count);
      const idxLPEnd   = Math.floor(0.60 * count);
      for (let i = idxLPStart; i < idxLPEnd; i++) {
        arr[i*3 + 1] = base[i*3 + 1] + paddleLY;
      }
      
      /* 0.60 - 0.80: Right Paddle */
      const idxRPStart = Math.floor(0.60 * count);
      const idxRPEnd   = Math.floor(0.80 * count);
      for (let i = idxRPStart; i < idxRPEnd; i++) {
        arr[i*3 + 1] = base[i*3 + 1] + paddleRY;
      }

      /* 0.80 - 0.95: Ball */
      const idxBallStart = Math.floor(0.80 * count);
      const idxBallEnd   = Math.floor(0.95 * count);
      for (let i = idxBallStart; i < idxBallEnd; i++) {
        arr[i*3]     = base[i*3]     + ballX;
        arr[i*3 + 1] = base[i*3 + 1] + ballY;
      }
      
      attr.needsUpdate = true;
    };
    requestAnimationFrame(step);

    /* ─── Exit handler ─── */
    const exitPong = (e) => {
      if (e && e.type === 'keydown' && e.key !== 'Escape') return;
      this._pongActive = false;
      document.body.classList.remove('pong-active');
      cancelAnimationFrame(pongRAF);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('keydown', exitPong);
      document.getElementById('pong-close-btn')?.removeEventListener('click', exitPong);

      /* Restore uniforms */
      mats.uMouseForce.value.set(9999, 9999, 0);
      this.tweenUniform(mats.uProgress7, 1, 0, 1000);
      this.tweenUniform(mats.uProgress4, 0, savedP4, 800);
      this.tweenUniform(mats.uProgress5, 0, savedP5, 800);
      this.tweenUniform(mats.uProgress6, 0, savedP6, 800);
      if (window.gsap && this.threeCtx.mainParticles) {
        gsap.to(this.threeCtx.mainParticles.position, { z: 0, duration: 1.2, ease: 'power2.inOut' });
      }

      /* Remove HUD */
      const hudEl = document.getElementById('pong-hud');
      if (hudEl) { hudEl.style.opacity = '0'; setTimeout(() => hudEl.remove(), 600); }
    };
    document.addEventListener('keydown', exitPong);
    document.getElementById('pong-close-btn')?.addEventListener('click', exitPong);

    /* Expose exit for UI use */
    this._exitPong = exitPong;
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
        .limit(3);

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

      /* Animate cards in */
      if (window.gsap) {
        gsap.fromTo('.project-card', { opacity: 0, y: 40 }, {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1,
          scrollTrigger: { trigger: grid, start: 'top 85%', once: true }
        });
      }

      /* Bind card clicks */
      grid.querySelectorAll('.project-card').forEach((card, i) => {
        const p = projects[i];
        if (!p) return;
        const handleCardClick = () => {
          if (p.case_study && p.case_study.startsWith('/projects/')) {
            window.location.href = p.case_study;
          } else {
            this.openModal(p);
          }
        };
        card.addEventListener('click', handleCardClick);
        card.addEventListener('keydown', e => { if (e.key === 'Enter') handleCardClick(); });
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View project: ${p.title || 'Untitled'}`);
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
    const conceptBadge = p.concept ? `<span class="badge concept-badge" style="font-size:var(--text-2xs); letter-spacing:0.1em; background:var(--accent); color:var(--bg); padding:2px 6px; border-radius:4px; margin-left:12px; vertical-align:middle; font-weight:700;">CONCEPT</span>` : '';

    return `
      <article class="project-card" data-id="${p.id}">
        ${imagePart}
        <div class="project-card-body">
          <div class="project-card-meta">
            <span class="project-card-category">${p.category || 'Project'}</span>
            <span class="project-card-year">${p.year || ''}</span>
          </div>
          <h3 class="project-card-title" style="display:flex; align-items:center;">${p.title}${conceptBadge}</h3>
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
    this._triggerElement = document.activeElement;

    if (this._escListener) document.removeEventListener('keydown', this._escListener);
    if (this._tabListener) document.removeEventListener('keydown', this._tabListener);

    /* If Pong is running, exit it first so the modal z-index stack is clean */
    if (this._pongActive && this._exitPong) {
      this._exitPong(null);
    }

    /* Remove any existing modal */
    document.getElementById('jx-modal-overlay')?.remove();

    const tools = (p.tools || []).map(t => `<span class="tag">${t}</span>`).join('');

    // 1. Meta Grid
    const roleMeta = p.project_role ? `<div style="display:flex;flex-direction:column;gap:var(--s-1);"><span style="font-family:var(--font-mono);font-size:var(--text-xs);letter-spacing:var(--track-widest);text-transform:uppercase;color:var(--green);">Role</span><span style="font-size:var(--text-sm);color:var(--gray-2);">${p.project_role}</span></div>` : '';
    const timelineMeta = p.timeline ? `<div style="display:flex;flex-direction:column;gap:var(--s-1);"><span style="font-family:var(--font-mono);font-size:var(--text-xs);letter-spacing:var(--track-widest);text-transform:uppercase;color:var(--green);">Timeline</span><span style="font-size:var(--text-sm);color:var(--gray-2);">${p.timeline}</span></div>` : '';
    const typeMeta = p.project_type ? `<div style="display:flex;flex-direction:column;gap:var(--s-1);"><span style="font-family:var(--font-mono);font-size:var(--text-xs);letter-spacing:var(--track-widest);text-transform:uppercase;color:var(--green);">Type</span><span style="font-size:var(--text-sm);color:var(--gray-2);">${p.project_type}</span></div>` : '';
    const toolsMeta = tools ? `<div style="display:flex;flex-direction:column;gap:var(--s-2);"><span style="font-family:var(--font-mono);font-size:var(--text-xs);letter-spacing:var(--track-widest);text-transform:uppercase;color:var(--green);">Tools</span><div class="project-card-tools" style="margin-top:0;">${tools}</div></div>` : '';
    
    const metaGrid = (roleMeta || timelineMeta || typeMeta || toolsMeta) ? 
      `<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(120px, 1fr));gap:var(--s-4);margin-top:var(--s-4);margin-bottom:var(--s-4);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:var(--s-4) 0;">
        ${roleMeta}
        ${timelineMeta}
        ${typeMeta}
        ${toolsMeta}
      </div>` : '';

    // 2. Case Study Link
    let caseStudyContent = '';
    let hasDedicatedPage = p.case_study && p.case_study.startsWith('/projects/');
    
    if (hasDedicatedPage) {
      caseStudyContent = `<a href="${p.case_study}" class="btn btn-primary" style="width: 100%; justify-content: center;">Read Full Case Study →</a>`;
    } else if (p.case_study) {
      if (p.case_study.startsWith('http')) {
        const linkText = p.case_study.includes('figma.com') ? 'View on Figma ↗' : 'Read Case Study ↗';
        caseStudyContent = `<a href="${p.case_study}" target="_blank" rel="noopener" class="btn btn-ghost" style="align-self:flex-start;margin-top:var(--s-2);">${linkText}</a>`;
      } else {
        caseStudyContent = `<p style="font-size:var(--text-sm);color:var(--gray-2);line-height:var(--lead-relaxed);margin-top:var(--s-4);overflow-wrap:anywhere;">${p.case_study}</p>`;
      }
    }

    const imagePart = p.image_url
      ? `<div class="modal-image-pane" style="background:var(--surface-2);">
           <img src="${p.image_url}" alt="${p.title}" style="object-fit:contain;background:var(--surface-2);">
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
      <style>
        .modal {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          max-width: 900px !important;
          height: 85vh !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          overscroll-behavior: contain !important;
        }
        .modal::-webkit-scrollbar { width: 6px; }
        .modal::-webkit-scrollbar-track { background: transparent; }
        .modal::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
        .modal::-webkit-scrollbar-thumb:hover { background: var(--gray-3); }
        .modal-image-pane {
          width: 100% !important;
          height: 400px !important;
          flex-shrink: 0 !important;
        }
        .modal-content {
          overflow-y: visible !important;
          padding: var(--s-12) var(--s-8) !important;
        }
        .modal-close {
          position: fixed !important;
          top: var(--s-8) !important;
          right: var(--s-8) !important;
          z-index: 1000 !important;
          width: 48px !important;
          height: 48px !important;
        }
      </style>
      <button class="modal-close" id="modal-close" aria-label="Close modal">✕</button>
      <div class="modal">
        ${imagePart}
        <div class="modal-content" style="overflow-wrap: anywhere;">
          <div class="section-label">${p.category || 'Project'}</div>
          <h2 class="modal-title">${p.title}</h2>
          <p style="font-size:var(--text-sm);color:var(--gray-2);line-height:var(--lead-relaxed);overflow-wrap:anywhere;">
            ${p.description || ''}
          </p>
          ${metaGrid}
          <div style="display:flex; gap:var(--s-3); flex-wrap:wrap; margin-top:var(--s-4);">
            ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener" class="btn btn-primary" style="align-self:flex-start;margin-top:var(--s-2);">View Project ↗</a>` : ''}
            ${(!hasDedicatedPage && caseStudyContent.includes('<a')) ? caseStudyContent : ''}
          </div>
          ${hasDedicatedPage ? `<div style="margin-top: var(--s-8);">${caseStudyContent}</div>` : (caseStudyContent.includes('<p') ? caseStudyContent : '')}
        </div>
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
      
      const focusable = overlay.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      
      document.addEventListener('keydown', this._tabListener = e => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }
      });
      first?.focus();
      
      document.body.style.overflow = 'hidden';
      if (this.lenis) this.lenis.stop();
    });
  },

  closeModal () {
    const overlay = document.getElementById('jx-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (this.lenis) this.lenis.start();
    document.removeEventListener('keydown', this._escListener);
    if (this._tabListener) document.removeEventListener('keydown', this._tabListener);
    if (this._triggerElement) {
      this._triggerElement.focus();
      this._triggerElement = null;
    }
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
        { text: '│  pong      → Play Particle Pong      │', class: 'amber' },
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
      pong: [
        { text: '> INITIATING PARTICLE PONG...', class: 'green' },
        { text: '' },
        { text: '  55,000 particles are rearranging...', class: 'dim' },
        { text: '  Move your mouse to control the left paddle.', class: 'amber' },
        { text: '  Press ESC to return to the universe.', class: 'dim' },
        { text: '' },
        { text: '  May the best consciousness win.', class: 'green' },
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
      if (window.JXLenis) window.JXLenis.stop();
    };

    const close = () => {
      panel.classList.remove('open');
      this.cliOpen = false;
      if (window.JXLenis) window.JXLenis.start();
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
          if (cmd === 'work')     setTimeout(() => { sessionStorage.setItem('ct-active','1'); window.location.href = '/work.html'; }, 1500);
          if (cmd === 'services') setTimeout(() => { sessionStorage.setItem('ct-active','1'); window.location.href = '/services.html'; }, 1500);
          if (cmd === 'contact' || cmd === 'hire me') setTimeout(() => { sessionStorage.setItem('ct-active','1'); window.location.href = '/contact.html'; }, 2200);
          /* Phase 4: Pong launch */
          if (cmd === 'pong') setTimeout(() => { close(); this.initPong(); }, 1600);
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
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    autoFitHeroText();
    window.addEventListener('resize', autoFitHeroText);
  });
} else {
  // Fallback for older browsers
  window.addEventListener('load', autoFitHeroText);
  window.addEventListener('resize', autoFitHeroText);
}
