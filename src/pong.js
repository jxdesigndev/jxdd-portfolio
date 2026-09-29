export function attach(universe) {
  universe.initPong = async function() {
    if (universe._pongActive) return; // already running
    if (!universe.threeCtx || universe.threeCtx.is2D) {
      console.warn('JX Pong: WebGL required');
      return;
    }

    universe._pongActive = true;
    document.body.classList.add('pong-active');
    const mats = universe.threeCtx.mainMat.uniforms;

    /* Transition particles to pong arena */
    universe.tweenUniform(mats.uProgress7, 0, 1, 1200);
    if (window.JXAudio && window.JXAudio.enabled) window.JXAudio.morphWhisper();
    /* Fade out portrait / section morphs while in game */
    const savedP4 = mats.uProgress4.value;
    const savedP5 = mats.uProgress5.value;
    const savedP6 = mats.uProgress6.value;
    universe.tweenUniform(mats.uProgress4, mats.uProgress4.value, 0, 800);
    universe.tweenUniform(mats.uProgress5, mats.uProgress5.value, 0, 800);
    universe.tweenUniform(mats.uProgress6, mats.uProgress6.value, 0, 800);
    /* Camera pull back */
    if (window.gsap && universe.threeCtx.mainParticles) {
      gsap.to(universe.threeCtx.mainParticles.position, { z: -20, duration: 1.2, ease: 'power2.inOut' });
    }

    /* \u2500\u2500 Build HUD overlay \u2500\u2500 */
    const isTouch = window.matchMedia('(hover: none)').matches;
    const isPortraitMobile = isTouch && (window.innerWidth < window.innerHeight);
    const rotateHint = isPortraitMobile ? `
      <div class="pong-rotate-hint" id="pong-rotate-hint">
        <span>Rotate device for best experience</span>
        <button id="pong-rotate-close" aria-label="Close hint">✕</button>
      </div>
    ` : '';

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
      ${rotateHint}
    `;
    document.body.append(hud);

    if (isPortraitMobile) {
      setTimeout(() => {
        document.getElementById('pong-rotate-close')?.addEventListener('click', () => {
          document.getElementById('pong-rotate-hint')?.remove();
        }, { once: true });
      }, 0);
    }

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
        .pong-rotate-hint {
          position: absolute;
          bottom: var(--s-8, 2rem);
          left: 50%;
          transform: translateX(-50%);
          background: var(--surface-2, #0c0e12);
          border: 1px solid var(--green, #00ff41);
          color: var(--green, #00ff41);
          padding: 8px 12px;
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 12px;
          pointer-events: auto;
          box-shadow: 0 4px 12px rgba(0, 255, 65, 0.15);
          white-space: nowrap;
        }
        .pong-rotate-hint button {
          background: none; border: none; color: inherit; cursor: pointer;
          font-size: 14px; padding: 0; line-height: 1; opacity: 0.8;
        }
        .pong-rotate-hint button:hover { opacity: 1; }
      `;
      document.head.append(s);
    }

    /* \u2500\u2500 Game state \u2500\u2500 */
    let ARENA_W = 60;
    const MAX_ARENA_W = 60, ARENA_H = 40, PADDLE_H = 12;
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
      if (!universe._pongActive) return;
      if (document.hidden) {
        pongRAF = requestAnimationFrame(step);
        return;
      }
      pongRAF = requestAnimationFrame(step);

      /* Responsive arena scaling */
      const aspect = window.innerWidth / window.innerHeight;
      ARENA_W = Math.min(MAX_ARENA_W, aspect * 55);
      const scaleX = ARENA_W / MAX_ARENA_W;

      /* Player paddle (left) follows mouse */
      paddleLY += (mouseNY * (ARENA_H - PADDLE_H) - paddleLY) * 0.12;
      paddleLY  = Math.max(-ARENA_H + PADDLE_H, Math.min(ARENA_H - PADDLE_H, paddleLY));

      /* AI paddle (right) tracks ball with humanized imperfection */
      const aiTarget = (ballVX > 0) ? ballY : 0;
      const ballSpeed = Math.sqrt(ballVX*ballVX + ballVY*ballVY);
      const panicFactor = Math.max(0, ballSpeed - SPEED_BASE);
      const dynamicAISpeed = Math.max(0.02, AI_SPEED * (1 - panicFactor * 0.7));
      paddleRY += (aiTarget - paddleRY) * dynamicAISpeed;
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
      if (!universe._pongBase) {
        universe._pongBase = Float32Array.from(universe.threeCtx.mainParticles.geometry.attributes.aTarget7.array);
      }
      const attr = universe.threeCtx.mainParticles.geometry.attributes.aTarget7;
      const arr = attr.array;
      const base = universe._pongBase;
      const count = attr.count;

      const idxLPStart = Math.floor(0.40 * count);
      const idxLPEnd   = Math.floor(0.60 * count);
      const idxRPStart = Math.floor(0.60 * count);
      const idxRPEnd   = Math.floor(0.80 * count);
      const idxBallStart = Math.floor(0.80 * count);
      const idxBallEnd   = Math.floor(0.95 * count);

      for (let i = 0; i < count; i++) {
        if (i >= idxBallStart && i < idxBallEnd) {
          /* Ball */
          arr[i*3]     = base[i*3] + ballX;
          arr[i*3 + 1] = base[i*3 + 1] + ballY;
        } else {
          /* Walls, paddles, and dust scaled proportionally */
          arr[i*3] = base[i*3] * scaleX;
          
          /* Paddle Y updates */
          if (i >= idxLPStart && i < idxLPEnd) {
            arr[i*3 + 1] = base[i*3 + 1] + paddleLY;
          } else if (i >= idxRPStart && i < idxRPEnd) {
            arr[i*3 + 1] = base[i*3 + 1] + paddleRY;
          }
        }
      }
      
      attr.needsUpdate = true;
    };
    requestAnimationFrame(step);

    /* ─── Exit handler ─── */
    const exitPong = (e) => {
      if (e && e.type === 'keydown' && e.key !== 'Escape') return;
      universe._pongActive = false;
      document.body.classList.remove('pong-active');
      cancelAnimationFrame(pongRAF);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('keydown', exitPong);
      document.getElementById('pong-close-btn')?.removeEventListener('click', exitPong);

      /* Restore uniforms */
      mats.uMouseForce.value.set(9999, 9999, 0);
      universe.tweenUniform(mats.uProgress7, 1, 0, 1000);
      if (window.JXAudio && window.JXAudio.enabled) window.JXAudio.morphWhisper();
      universe.tweenUniform(mats.uProgress4, 0, savedP4, 800);
      universe.tweenUniform(mats.uProgress5, 0, savedP5, 800);
      universe.tweenUniform(mats.uProgress6, 0, savedP6, 800);
      if (window.gsap && universe.threeCtx.mainParticles) {
        gsap.to(universe.threeCtx.mainParticles.position, { z: 0, duration: 1.2, ease: 'power2.inOut' });
      }

      /* Remove HUD */
      const hudEl = document.getElementById('pong-hud');
      if (hudEl) { hudEl.style.opacity = '0'; setTimeout(() => hudEl.remove(), 600); }
    };
    document.addEventListener('keydown', exitPong);
    document.getElementById('pong-close-btn')?.addEventListener('click', exitPong);

    /* Expose exit for UI use */
    universe._exitPong = exitPong;
  };

}
