import re

with open('style.css', 'r') as f:
    css = f.read()

new_css = """

/* ────────────────────────────────────────────────────────────────
   THE HUB (NEW ABOUT PAGE)
   ──────────────────────────────────────────────────────────────── */
.hub-view {
  height: 300vh; /* Scroll space for the Shrink & Surround animation */
  position: relative;
  background: var(--bg);
}

.hub-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hub-logo {
  font-family: var(--font-display);
  font-size: clamp(8rem, 25vw, 25rem);
  font-weight: 900;
  line-height: 1;
  color: var(--white);
  text-shadow: 0 0 40px rgba(100, 255, 100, 0.1);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  z-index: 10;
  pointer-events: none;
}

.hub-manifesto {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 3vw, 3rem);
  text-align: center;
  color: var(--gray-1);
  margin-top: 15vh;
  width: 100%;
  opacity: 1;
  z-index: 5;
}
.hub-manifesto em {
  color: var(--green);
  font-style: normal;
}

/* 4-Corner Grid */
.hub-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 20;
}

.hub-card {
  position: absolute;
  width: clamp(200px, 22vw, 320px);
  padding: var(--s-8);
  background: rgba(10, 10, 10, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  cursor: pointer;
  pointer-events: auto;
  opacity: 0; /* Hidden initially, revealed by GSAP */
  transition: background 0.3s ease, border-color 0.3s ease, transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.hub-card:hover {
  background: rgba(20, 20, 20, 0.8);
  border-color: rgba(100, 255, 100, 0.3);
  transform: scale(1.05) !important;
}

.hub-card[data-target="view-origin"] { top: 15%; left: 10%; }
.hub-card[data-target="view-arsenal"] { top: 15%; right: 10%; text-align: right; }
.hub-card[data-target="view-philosophy"] { bottom: 15%; left: 10%; }
.hub-card[data-target="view-transmission"] { bottom: 15%; right: 10%; text-align: right; }

.hc-num {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--green);
  margin-bottom: var(--s-2);
}
.hc-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--white);
  line-height: 1.1;
  margin-bottom: var(--s-1);
}
.hc-sub {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--gray-2);
  text-transform: uppercase;
}

/* Mobile Adjustments for the Grid */
@media (max-width: 768px) {
  .hub-card {
    width: 42vw;
    padding: var(--s-4);
  }
  .hub-card[data-target="view-origin"] { top: 12%; left: 4%; }
  .hub-card[data-target="view-arsenal"] { top: 12%; right: 4%; }
  .hub-card[data-target="view-philosophy"] { bottom: 12%; left: 4%; }
  .hub-card[data-target="view-transmission"] { bottom: 12%; right: 4%; }
  .hc-title { font-size: var(--text-lg); }
}

/* ────────────────────────────────────────────────────────────────
   THE WIPE OVERLAY & CONTROLS
   ──────────────────────────────────────────────────────────────── */
.page-wipe {
  position: fixed;
  inset: 0;
  background: var(--bg);
  z-index: 9998;
  transform: translateY(100%);
  pointer-events: none;
  border-top: 1px solid var(--green);
}

.back-to-hub {
  position: fixed;
  top: var(--s-6);
  left: var(--s-6);
  z-index: 9999;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--white);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  padding: var(--s-3) var(--s-5);
  border-radius: 100px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--s-2);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease, border-color 0.3s ease, color 0.3s ease;
}
.back-to-hub:hover {
  border-color: var(--green);
  color: var(--green);
}
.back-to-hub.active {
  opacity: 1;
  pointer-events: auto;
}

/* ────────────────────────────────────────────────────────────────
   INTERIOR VIEWS
   ──────────────────────────────────────────────────────────────── */
.content-view {
  min-height: 100vh;
  padding: 15vh 10vw;
  background: var(--bg);
}

.cv-header {
  margin-bottom: 10vh;
}
.cv-title {
  font-family: var(--font-display);
  font-size: clamp(3rem, 8vw, 8rem);
  font-weight: 900;
  line-height: 1;
  color: var(--white);
  /* Dropbox masking effect style */
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
}

/* Origin Timeline */
.origin-timeline-container {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}
.timeline-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 20px;
  width: 2px;
  background: rgba(255,255,255,0.1);
}
.timeline-line-fill {
  position: absolute;
  top: 0;
  left: 20px;
  width: 2px;
  background: var(--green);
  height: 0%;
}
.timeline-node {
  position: relative;
  padding-left: 60px;
  margin-bottom: 15vh;
  opacity: 0;
  transform: translateY(40px);
}
.timeline-dot {
  position: absolute;
  left: 15px;
  top: 10px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 15px var(--green);
}
.timeline-era {
  font-family: var(--font-mono);
  color: var(--green);
  font-size: var(--text-sm);
  margin-bottom: var(--s-2);
}
.timeline-heading {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: 800;
  margin-bottom: var(--s-4);
}
.timeline-body {
  font-size: var(--text-lg);
  color: var(--gray-1);
  line-height: 1.6;
}

/* Arsenal Stack */
.arsenal-stack-container {
  display: flex;
  flex-direction: column;
  gap: 100vh; /* They pin and overlap! */
  padding-bottom: 50vh;
}
.arsenal-card {
  height: 60vh;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--s-10);
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 -20px 40px rgba(0,0,0,0.5);
  position: sticky;
  top: 20vh;
}
.ac-title {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  color: var(--green);
  margin-bottom: var(--s-4);
}
.ac-tools {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  color: var(--gray-1);
}

/* Philosophy Kinetic */
.philosophy-kinetic-container {
  height: 300vh; /* Scrolled for kinetic effect */
  position: relative;
}
.kinetic-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.kinetic-text {
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 6rem);
  font-weight: 900;
  text-align: center;
  line-height: 1.1;
  color: var(--gray-2);
  opacity: 0.1;
  transform: translateY(20px);
  will-change: transform, opacity, color;
}
.kinetic-text .glow {
  color: var(--green);
  text-shadow: 0 0 40px rgba(100,255,100,0.4);
}

/* Transmission Portal */
.transmission-portal {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 9997;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tp-ring {
  position: absolute;
  width: 100px;
  height: 100px;
  border: 1px solid var(--green);
  border-radius: 50%;
  opacity: 0;
  box-shadow: 0 0 40px var(--green);
}
.tp-video-wrapper {
  width: 80vw;
  height: 80vh;
  max-width: 1200px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  opacity: 0;
  transform: scale(0.5);
}
.tp-video-wrapper video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

"""

css += new_css

with open('style.css', 'w') as f:
    f.write(css)

print("style.css updated with Hub & View styles.")
