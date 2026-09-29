export function attach(universe) {
  universe.initParticles = async function() {
    const canvas = universe.heroCanvas;
    if (!canvas) return;

    /* Try WebGL first */
    if (window.THREE) {
      try {
        await universe.initThreeJS(canvas);
        return;
      } catch (e) {
        console.warn('JX: WebGL failed, switching to Canvas2D.', e.message);
      }
    }

    /* Canvas2D fallback */
    universe.initCanvas2D(canvas);
  };

  universe.initThreeJS = async function(canvas) {
    if (!universe.particleWorker) {
      universe.particleWorker = new Worker('particle-worker.js');
      universe.workerPending = {};
      universe.workerId = 0;
      universe.particleWorker.onmessage = (e) => {
        const data = e.data;
        if (universe.workerPending[data.id]) {
          clearTimeout(universe.workerPending[data.id].timer);
          if (data.error) universe.workerPending[data.id].reject(new Error(data.error));
          else universe.workerPending[data.id].resolve(data);
          delete universe.workerPending[data.id];
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
        
        universe.workerId++;
        const id = universe.workerId;
        
        const fallback = () => {
          console.warn(`JX: Worker timed out or failed for id ${id}, falling back to synchronous math.`);
          extractPixelsFallback(img, posArr, colorArr, useColor, offsetX, offsetY, offsetZ, scale);
          resolve();
        };

        const timer = setTimeout(() => {
          if (universe.workerPending[id]) {
            delete universe.workerPending[id];
            fallback();
          }
        }, 3000); // 3s timeout

        universe.workerPending[id] = {
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

        universe.particleWorker.postMessage({
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
      extractPixels(universe.imgOkezie1, pOkezie1, cOkezie1, true, heroOffsetX, 0, 0, heroScale),
      extractPixels(universe.imgHero2, pHero2, cHero2, true, heroOffsetX, 0, 0, heroScale),
      // Target 4 (About): offset to left (-25.0, 0, -10.0, scale=0.5) so it never overlaps or disturbs text on right
      extractPixels(universe.imgPortrait, pPortrait, cPortrait, true, -25.0, 0, -10.0, 0.5),
      // Target 5 (Work): offset to right (+28.0, 5.0, -12.0, scale=0.5) so it never overlaps text on left
      extractPixels(universe.imgCoder, pCoder, cCoder, true, 28.0, 5.0, -12.0, 0.5),
      // Target 6 (Services): offset to left (-28.0, 5.0, -12.0, scale=0.5) so it never overlaps text on right
      extractPixels(universe.imgDesigner, pDesigner, cDesigner, true, -28.0, 5.0, -12.0, 0.5)
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
    universe._pText            = () => pText;
    universe._createTextCanvas = createTextCanvas;

    /* ── Main particle field & Dynamic Count ── */
    let mainParticles; // captured for geometry updates

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

    universe.rebuildGeometry = async (count) => {
      const geo = new THREE.BufferGeometry();
      const mainPos    = new Float32Array(count * 3);
      const target1    = new Float32Array(count * 3);
      const target2    = new Float32Array(count * 3);
      const targetText = new Float32Array(count * 3);
      const target4    = new Float32Array(count * 3);
      const target5    = new Float32Array(count * 3);
      const target6    = new Float32Array(count * 3);

      const col1 = new Float32Array(count * 3);
      const col2 = new Float32Array(count * 3);
      const col4 = new Float32Array(count * 3);
      const col5 = new Float32Array(count * 3);
      const col6 = new Float32Array(count * 3);

      const mainAlpha  = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        const r_rand = 80 + Math.random() * 150;
        const theta_rand = Math.random() * Math.PI * 2;
        const phi_rand = Math.acos(2 * Math.random() - 1);
        mainPos[i*3]   = r_rand * Math.sin(phi_rand) * Math.cos(theta_rand);
        mainPos[i*3+1] = r_rand * Math.sin(phi_rand) * Math.sin(theta_rand);
        mainPos[i*3+2] = r_rand * Math.cos(phi_rand);

        const setTarget = (arr, tp, colorArr, cp) => {
          if (arr.length > 0) {
            const idx = Math.floor((i / count) * arr.length);
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
      const target7 = buildPongArena(count);
      universe._pongArena = target7; // store for potential runtime updates

      geo.setAttribute('position',   new THREE.BufferAttribute(mainPos, 3));
      geo.setAttribute('aTarget1',   new THREE.BufferAttribute(target1, 3));
      geo.setAttribute('aTarget2',   new THREE.BufferAttribute(target2, 3));
      geo.setAttribute('aTarget3',   new THREE.BufferAttribute(targetText, 3));
      geo.setAttribute('aTarget4',   new THREE.BufferAttribute(target4, 3));
      geo.setAttribute('aTarget5',   new THREE.BufferAttribute(target5, 3));
      geo.setAttribute('aTarget6',   new THREE.BufferAttribute(target6, 3));
      geo.setAttribute('aTarget7',   new THREE.BufferAttribute(target7, 3)); /* Phase 4 Pong */
      geo.setAttribute('aColor1',    new THREE.BufferAttribute(col1, 3));
      geo.setAttribute('aColor2',    new THREE.BufferAttribute(col2, 3));
      geo.setAttribute('aColor4',    new THREE.BufferAttribute(col4, 3));
      geo.setAttribute('aColor5',    new THREE.BufferAttribute(col5, 3));
      geo.setAttribute('aColor6',    new THREE.BufferAttribute(col6, 3));
      geo.setAttribute('aAlpha',     new THREE.BufferAttribute(mainAlpha, 1));

      if (mainParticles) {
        mainParticles.geometry.dispose();
        mainParticles.geometry = geo;
      }
      return geo;
    };

    const initialCount = window.innerWidth < 768 ? 28000 : 55000;
    const mainGeo = universe.rebuildGeometry(initialCount);

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
            float radius = 42.0; /* Phase 6A: widened for dramatic scatter (was 28.0) */
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

    mainParticles = new THREE.Points(mainGeo, mainMat);
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
      if (universe.threeCtx && universe.threeCtx.mainMat) {
        const u = universe.threeCtx.mainMat.uniforms;
        u.uMouse.value.set(mouseX * 2, -mouseY * 2);
        /* Phase 3: Force field follows cursor with moderate strength */
        u.uMouseForce.value.set(mouseX * 2, -mouseY * 2, 0.55);
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      isMouseOnCanvas = false;
      if (universe.threeCtx && universe.threeCtx.mainMat) {
        const u = universe.threeCtx.mainMat.uniforms;
        u.uMouse.value.set(9999, 9999);
        u.uMouseForce.value.set(9999, 9999, 0);
      }
    });

    /* ── Phase 3: Click explosion ── */
    document.addEventListener('click', e => {
      if (!universe.threeCtx || universe.threeCtx.is2D) return;
      const nx = (e.clientX / window.innerWidth  - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * -2;
      const u  = universe.threeCtx.mainMat.uniforms;
      /* Trigger explosion, then decay */
      u.uExplosion.value.set(nx, ny, 1.0);
      if (window.JXAudio && window.JXAudio.enabled) window.JXAudio.sculptPing(1.0);
      setTimeout(() => {
        if (universe.threeCtx && universe.threeCtx.mainMat)
          universe.threeCtx.mainMat.uniforms.uExplosion.value.set(9999, 9999, 0);
      }, 400);
    });

    /* ── Phase 3: Mobile touch sculpt ── */
    document.addEventListener('touchmove', e => {
      if (!universe.threeCtx || universe.threeCtx.is2D) return;
      const t  = e.touches[0];
      const nx = (t.clientX / window.innerWidth  - 0.5) * 2;
      const ny = (t.clientY / window.innerHeight - 0.5) * -2;
      universe.threeCtx.mainMat.uniforms.uMouseForce.value.set(nx, ny, 0.7);
    }, { passive: true });
    document.addEventListener('touchend', () => {
      if (universe.threeCtx && universe.threeCtx.mainMat)
        universe.threeCtx.mainMat.uniforms.uMouseForce.value.set(9999, 9999, 0);
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
          if (universe.threeCtx && universe.threeCtx.mainMat) {
            const u = universe.threeCtx.mainMat.uniforms;
            u.uExplosion.value.set(0, 0, 1.0);
            setTimeout(() => {
              if (universe.threeCtx && universe.threeCtx.mainMat)
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

    universe.fpsCheckActive = true;
    universe.fpsStart = 0;
    universe.fpsFrames = 0;

    const tick = (now) => {
      rafId = requestAnimationFrame(tick);
      if (!_mqlRM.matches) clock += 0.016;

      if (universe.fpsCheckActive && now) {
        if (!universe.fpsStart) {
          universe.fpsStart = now;
          universe.fpsFrames = 0;
        }
        universe.fpsFrames++;
        const elapsed = now - universe.fpsStart;
        if (elapsed > 1000) {
          universe.fpsCheckActive = false;
          const fps = (universe.fpsFrames * 1000) / elapsed;
          if (fps < 30) {
            console.warn(`JX: Low framerate detected (${fps.toFixed(1)} fps). Reducing particle count for performance.`);
            universe.rebuildGeometry(15000);
          }
        }
      }

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

    universe.threeCtx = { mainMat, ambMat, mainParticles };
  };

  universe.initCanvas2D = async function(canvas) {
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

    universe.canvas2DAlpha = () => ga;
    universe.canvas2DSetAlpha = v => { ga = v; };

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
    universe.threeCtx = { is2D: true }; /* mark as active so loader knows */
  };

  universe.tweenUniform = async function(uniform, from, to, duration) {
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
  };

}
