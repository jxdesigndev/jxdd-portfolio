import re

with open('script.js', 'r') as f:
    content = f.read()

hud_old = """    /* \u2500\u2500 Build HUD overlay \u2500\u2500 */
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
    document.body.append(hud);"""

hud_new = """    /* \u2500\u2500 Build HUD overlay \u2500\u2500 */
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
      document.getElementById('pong-rotate-close')?.addEventListener('click', () => {
        document.getElementById('pong-rotate-hint')?.remove();
      }, { once: true });
    }"""

content = content.replace(hud_old, hud_new)

css_old = """        .pong-close-btn:hover {
          border-color: var(--green, #00FF41);
          color: var(--green, #00FF41);
        }
      `;"""

css_new = """        .pong-close-btn:hover {
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
      `;"""

content = content.replace(css_old, css_new)

with open('script.js', 'w') as f:
    f.write(content)
