import re

with open('script.js', 'r') as f:
    content = f.read()

hud_old = """    const isTouch = window.matchMedia('(hover: none)').matches;
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

hud_new = """    const isTouch = window.matchMedia('(hover: none)').matches;
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
    }"""

content = content.replace(hud_old, hud_new)

with open('script.js', 'w') as f:
    f.write(content)
