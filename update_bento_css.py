import re

with open('style.css', 'r') as f:
    css = f.read()

# I will append the Bento Box CSS to the end of style.css
bento_css = """
/* ────────────────────────────────────────────────────────────────
   BENTO BOX / COMMAND CENTER
   ──────────────────────────────────────────────────────────────── */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--s-8);
  margin-top: var(--s-16);
  position: relative;
}

.bento-item {
  position: relative;
  background: rgba(2, 3, 5, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 255, 170, 0.1);
  border-radius: 24px;
  overflow: hidden;
  padding: var(--s-12);
  display: flex;
  flex-direction: column;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.bento-item::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(800px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(0, 255, 170, 0.08), transparent 40%);
  opacity: 0;
  transition: opacity 0.5s;
  pointer-events: none;
  z-index: 1;
}

.bento-item:hover::before {
  opacity: 1;
}
.bento-item:hover {
  border-color: rgba(0, 255, 170, 0.4);
  box-shadow: 0 0 30px rgba(0, 255, 170, 0.05);
}

.bento-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--s-16);
  z-index: 2;
  position: relative;
}
.bento-header h3 {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  color: var(--white);
  margin: 0;
}
.bento-meta {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--green);
  opacity: 0.8;
}

.bento-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  position: relative;
  min-height: 140px;
}

/* Grid Cell Sizes */
.bento-dev { grid-column: span 12; }
.bento-sec { grid-column: span 4; }
.bento-des { grid-column: span 4; }
.bento-aut { grid-column: span 4; }

@media (max-width: 1024px) {
  .bento-sec { grid-column: span 6; }
  .bento-des { grid-column: span 6; }
  .bento-aut { grid-column: span 12; }
}
@media (max-width: 768px) {
  .bento-item { grid-column: span 12; }
}

/* Marquee Track inside Dev Box */
.marquee-wrapper {
  overflow: hidden;
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  z-index: 2;
  mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
}
.marquee-track {
  display: flex;
  gap: var(--s-16);
  width: max-content;
  animation: scroll-left 30s linear infinite;
  padding: var(--s-8) 0;
}
.marquee-wrapper:hover .marquee-track {
  animation-play-state: paused;
}

@keyframes scroll-left {
  from { transform: translateX(0); }
  to { transform: translateX(calc(-50% - var(--s-16)/2)); }
}

/* Sub-grid styles inside Bentos */
.radar-scan {
  flex-wrap: wrap;
  gap: var(--s-6);
  background: radial-gradient(circle, rgba(0,255,170,0.1) 0%, transparent 70%);
  border-radius: 50%;
  padding: var(--s-4);
}
.radar-scan:hover .tool-item img {
  animation: glitch-anim 0.3s ease infinite alternate;
}
@keyframes glitch-anim {
  0% { transform: translate(0, 0); filter: hue-rotate(0deg); }
  100% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
}

.float-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-8);
}
.float-grid .tool-item {
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.bento-des:hover .float-grid .tool-item {
  transform: perspective(400px) rotateX(10deg) rotateY(-10deg) translateZ(10px);
}

.nodes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-8);
  background-image: radial-gradient(rgba(0, 255, 170, 0.2) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* Testimonial Marquee / Secure Logs */
.bento-marquee-wrapper {
  overflow: hidden;
  position: relative;
  width: 100%;
  margin-top: var(--s-16);
  padding: var(--s-8) 0;
  mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
}
.testimonials-bento-track {
  display: flex;
  gap: var(--s-12);
  width: max-content;
  animation: scroll-left 40s linear infinite;
}
.bento-marquee-wrapper:hover .testimonials-bento-track {
  animation-play-state: paused;
}

.testimonial-card.secure-log {
  width: 400px;
  background: rgba(2, 3, 5, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 255, 170, 0.15);
  box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}
.testimonial-card.secure-log::before {
  content: 'ENCRYPTED_LOG // VERIFIED';
  position: absolute;
  top: 10px; right: 12px;
  font-family: var(--font-mono);
  font-size: 8px;
  color: var(--green);
  opacity: 0.5;
}
.testimonial-card.secure-log .testimonial-quote {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--gray-2);
  line-height: 1.6;
}
"""

if "BENTO BOX" not in css:
    css += bento_css

with open('style.css', 'w') as f:
    f.write(css)
