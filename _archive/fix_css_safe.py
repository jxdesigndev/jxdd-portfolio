with open('style.css', 'r') as f:
    lines = f.readlines()

new_css = """/* ────────────────────────────────────────────────────────────────
   THE HUB (STRICT DBX GRID)
   ──────────────────────────────────────────────────────────────── */
.dbx-hub-view {
  height: 300vh; /* Scroll space */
  position: relative;
  background: var(--bg);
}

.dbx-massive-logo {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-display);
  font-size: clamp(8rem, 30vw, 30rem);
  font-weight: 900;
  line-height: 1;
  color: var(--white);
  text-shadow: 0 0 60px rgba(100, 255, 100, 0.15);
  margin: 0;
  z-index: 50;
  pointer-events: none;
  will-change: transform, font-size;
}

.dbx-hero-manifesto {
  position: fixed;
  top: 65%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-display);
  font-size: clamp(1.2rem, 2.5vw, 2.5rem);
  text-align: center;
  color: var(--gray-1);
  width: 100%;
  z-index: 40;
  pointer-events: none;
}
.dbx-hero-manifesto em {
  color: var(--green);
  font-style: normal;
}

/* Strict Grid Container */
.dbx-bento-container {
  position: sticky;
  top: 0;
  width: 100vw;
  height: 100vh;
  padding: var(--s-6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  pointer-events: none;
}

.dbx-bento-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  width: 100%;
  height: 100%;
  gap: 1px;
  background: rgba(100, 255, 100, 0.2);
  border: 1px solid rgba(100, 255, 100, 0.2);
  opacity: 0;
  pointer-events: auto;
}

/* Cell Architecture */
.dbx-cell {
  position: relative;
  background: var(--bg);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: var(--s-8);
}

.dbx-cell-bg {
  position: absolute;
  inset: -10%;
  background-size: cover;
  background-position: center;
  opacity: 0.3;
  filter: grayscale(100%) contrast(1.2);
  transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.8s ease, opacity 0.8s ease;
  will-change: transform;
}

.dbx-cell-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(4,10,15,0.9) 0%, transparent 100%);
  transition: background 0.4s ease;
}

.dbx-cell-content {
  position: relative;
  z-index: 10;
}

.dbx-num {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--green);
  margin-bottom: var(--s-4);
  transform: translateY(20px);
  opacity: 0;
}

.dbx-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 4rem);
  font-weight: 800;
  color: var(--white);
  line-height: 1.1;
  overflow: hidden;
}

.mask-text {
  display: inline-block;
  transform: translateY(110%);
}

.dbx-marquee-bg {
  background: none !important;
  display: flex;
  align-items: center;
  opacity: 0.15;
}
.marquee-track {
  display: flex;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 8rem;
  font-weight: 800;
  color: var(--green);
  animation: marquee 20s linear infinite;
}
@keyframes marquee {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-50%); }
}

.dbx-cell:hover .dbx-cell-bg {
  transform: scale(1.05);
  filter: grayscale(0%) contrast(1.1);
  opacity: 0.7;
}
.dbx-cell:hover .dbx-cell-overlay {
  background: linear-gradient(to top, rgba(100,255,100,0.2) 0%, transparent 100%);
}
.dbx-cell:hover .dbx-num {
  color: var(--white);
}

@media (max-width: 768px) {
  .dbx-bento-grid {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr;
  }
  .dbx-cell {
    padding: var(--s-4);
  }
}

.dbx-takeover-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--green);
  z-index: 9998;
  transform: scaleY(0);
  transform-origin: bottom;
  pointer-events: none;
}
"""

final_lines = lines[:3066] + [new_css + "\n"] + lines[3231:]

with open('style.css', 'w') as f:
    f.writelines(final_lines)

print("CSS safely patched.")
