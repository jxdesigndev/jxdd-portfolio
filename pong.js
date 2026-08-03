document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('pong-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  
  const updateCameraZ = () => {
    const aspect = window.innerWidth / window.innerHeight;
    // We want to ensure at least 140 units of width (120 arena + padding) and 100 units of height (80 arena + padding) fit on screen
    const targetHeight = Math.max(140 / aspect, 100);
    // targetHeight = 2 * z * tan(FOV/2)
    camera.position.z = targetHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
  };
  updateCameraZ();

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Calculate subset size used for paddles+ball+walls (0.0 to 0.95 of MAIN_COUNT)
  const MAIN_COUNT = window.innerWidth < 768 ? 28000 : 55000;
  const PONG_COUNT = Math.floor(MAIN_COUNT * 0.95); 
  const geometry = new THREE.BufferGeometry();
  
  const positions = new Float32Array(PONG_COUNT * 3);
  const colors = new Float32Array(PONG_COUNT * 3);
  const alphas = new Float32Array(PONG_COUNT);

  // Constants
  const ARENA_W = 60, ARENA_H = 40, PADDLE_H = 12;

  // Build arena (logic from buildPongArena, without the dust)
  for (let i = 0; i < PONG_COUNT; i++) {
    const roll = i / MAIN_COUNT; // Note: roll uses MAIN_COUNT to match original ratios
    let x = 0, y = 0, z = 0;

    if (roll < 0.20) {
      // Top wall
      x = (Math.random() * 2 - 1) * ARENA_W;
      y = ARENA_H + Math.random() * 1.0;
    } else if (roll < 0.40) {
      // Bottom wall
      x = (Math.random() * 2 - 1) * ARENA_W;
      y = -ARENA_H - Math.random() * 1.0;
    } else if (roll < 0.60) {
      // Left paddle
      x = -ARENA_W + (Math.random() - 0.5) * 2;
      y = (Math.random() * 2 - 1) * PADDLE_H;
    } else if (roll < 0.80) {
      // Right paddle
      x = ARENA_W - (Math.random() - 0.5) * 2;
      y = (Math.random() * 2 - 1) * PADDLE_H;
    } else if (roll < 0.95) {
      // Ball dot
      const br = Math.random() * 3;
      const ba = Math.random() * Math.PI * 2;
      x = Math.cos(ba) * br;
      y = Math.sin(ba) * br;
    }

    positions[i * 3 + 0] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    colors[i * 3 + 0] = 1.0;
    colors[i * 3 + 1] = 1.0;
    colors[i * 3 + 2] = 1.0;

    alphas[i] = 1.0;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

  // Store base positions for frame-by-frame updates
  const base = Float32Array.from(positions);

  // Single-target particle shader, stripped of interpolation logic
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: window.innerWidth < 768 ? 1.5 : 2.5 }
    },
    vertexShader: `
      attribute vec3 aColor;
      attribute float aAlpha;

      uniform float uTime;
      uniform float uSize;

      varying float vAlpha;
      varying vec3  vColor;

      float hash(float n) { return fract(sin(n) * 43758.5453); }

      void main () {
        vAlpha = aAlpha;
        vColor = aColor;
        
        vec3 pos = position;
        
        /* Ambient drift motion (matching homepage style) */
        float pid = hash(position.x + position.y * 13.7);
        pos.x += sin(uTime * 0.3 + position.y * 0.05 + pid) * 0.6;
        pos.y += cos(uTime * 0.2 + position.x * 0.05 + pid) * 0.6;
        pos.z += sin(uTime * 0.25 + position.z * 0.05 + pid) * 0.4;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        /* Perspective sizing */
        gl_PointSize = uSize * (200.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying vec3  vColor;

      void main () {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float core = smoothstep(0.5, 0.1, d);
        gl_FragColor = vec4(vColor * core, vAlpha * core);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    updateCameraZ();
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    material.uniforms.uSize.value = window.innerWidth < 768 ? 1.5 : 2.5;
  });

  // GAME LOGIC
  let ballX = 0, ballY = 0;
  const SPEED_BASE = 0.45;
  let ballVX = SPEED_BASE * (Math.random() > 0.5 ? 1 : -1);
  let ballVY = SPEED_BASE * (Math.random() * 0.8 - 0.4);
  let paddleLY = 0, paddleRY = 0;
  let scoreL = 0, scoreR = 0;
  let mouseNY = 0;
  const AI_SPEED = 0.06;

  const scoreElL = document.getElementById('pong-score-l');
  const scoreElR = document.getElementById('pong-score-r');

  // Device-aware hint text
  const isTouch = window.matchMedia('(hover: none)').matches;
  const hintEl = document.querySelector('.pong-hint');
  if (hintEl) {
    hintEl.textContent = isTouch ? 'Drag to play · Tap × to exit' : 'Move mouse · Esc to exit';
  }

  const onMove = (e) => {
    if (e.touches) e.preventDefault(); // Stop iOS Safari pull-to-refresh / rubber-banding
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    mouseNY = -(cy / window.innerHeight - 0.5) * 2;
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchstart', onMove, { passive: false });
  document.addEventListener('touchmove', onMove, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.location.href = '/';
    }
  });

  // Render loop
  const clock = new THREE.Clock();
  
  function render() {
    const dt = clock.getDelta();
    // Cap dt at 0.1s to prevent massive jumps when returning from background tabs
    const dt60 = Math.min(dt, 0.1) * 60;

    // Use elapsed time from clock
    material.uniforms.uTime.value += dt;

    // Physics step
    paddleLY += (mouseNY * (ARENA_H - PADDLE_H) - paddleLY) * (0.12 * dt60);
    paddleLY = Math.max(-ARENA_H + PADDLE_H, Math.min(ARENA_H - PADDLE_H, paddleLY));

    const aiTarget = ballY;
    paddleRY += (aiTarget - paddleRY) * (AI_SPEED * dt60);
    paddleRY = Math.max(-ARENA_H + PADDLE_H, Math.min(ARENA_H - PADDLE_H, paddleRY));

    ballX += ballVX * dt60;
    ballY += ballVY * dt60;

    // Walls
    if (ballY > ARENA_H - 1 || ballY < -ARENA_H + 1) {
      ballVY *= -1;
      ballY = Math.sign(ballY) * (ARENA_H - 1);
    }

    // Left paddle collision
    if (ballX < -ARENA_W + 3 && Math.abs(ballY - paddleLY) < PADDLE_H) {
      ballVX = Math.abs(ballVX) * 1.03;
      ballVY += (ballY - paddleLY) * 0.04;
      ballX = -ARENA_W + 3.01; // Snap outside collision zone to prevent multi-hit
    }

    // Right paddle collision
    if (ballX > ARENA_W - 3 && Math.abs(ballY - paddleRY) < PADDLE_H) {
      ballVX = -Math.abs(ballVX) * 1.03;
      ballVY += (ballY - paddleRY) * 0.04;
      ballX = ARENA_W - 3.01; // Snap outside collision zone to prevent multi-hit
    }

    // Speed cap
    const speed = Math.sqrt(ballVX**2 + ballVY**2);
    if (speed > 1.4) { ballVX /= speed / 1.4; ballVY /= speed / 1.4; }

    // Scoring
    if (ballX > ARENA_W + 2) {
      scoreL = Math.min(scoreL + 1, 99);
      if (scoreElL) scoreElL.textContent = String(scoreL).padStart(2, '0');
      ballX = 0; ballY = 0;
      ballVX = -SPEED_BASE; ballVY = (Math.random() - 0.5) * SPEED_BASE;
    }
    if (ballX < -ARENA_W - 2) {
      scoreR = Math.min(scoreR + 1, 99);
      if (scoreElR) scoreElR.textContent = String(scoreR).padStart(2, '0');
      ballX = 0; ballY = 0;
      ballVX = SPEED_BASE; ballVY = (Math.random() - 0.5) * SPEED_BASE;
    }

    // Update geometry
    const arr = geometry.attributes.position.array;
    const count = PONG_COUNT;

    const idxLPStart = Math.floor(0.40 * MAIN_COUNT);
    const idxLPEnd   = Math.floor(0.60 * MAIN_COUNT);
    for (let i = idxLPStart; i < idxLPEnd; i++) {
      arr[i*3 + 1] = base[i*3 + 1] + paddleLY;
    }
    
    const idxRPStart = Math.floor(0.60 * MAIN_COUNT);
    const idxRPEnd   = Math.floor(0.80 * MAIN_COUNT);
    for (let i = idxRPStart; i < idxRPEnd; i++) {
      arr[i*3 + 1] = base[i*3 + 1] + paddleRY;
    }

    const idxBallStart = Math.floor(0.80 * MAIN_COUNT);
    const idxBallEnd   = Math.floor(0.95 * MAIN_COUNT);
    for (let i = idxBallStart; i < idxBallEnd; i++) {
      arr[i*3]     = base[i*3]     + ballX;
      arr[i*3 + 1] = base[i*3 + 1] + ballY;
    }

    geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  
  render();
});
