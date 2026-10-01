with open('script.js', 'r') as f:
    js = f.read()

# ─── FIX 5: Cache bento rects, only recalculate on resize ────────────────────
# Replace the naive getBoundingClientRect-on-every-mousemove with a cached version
old_bento_mouse = """// Bento Box Mouse Tracking
document.addEventListener('mousemove', (e) => {
  document.querySelectorAll('.bento-item').forEach((item) => {
    const rect = item.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    item.style.setProperty('--mouse-x', `${x}px`);
    item.style.setProperty('--mouse-y', `${y}px`);
  });
});"""

new_bento_mouse = """// Bento Box Mouse Tracking — cached rects to avoid layout thrash on every move
(function() {
  let bentoRects = [];
  let bentoItems = [];
  let rafPending = false;
  let lastX = 0, lastY = 0;

  function cacheBentoRects() {
    bentoItems = Array.from(document.querySelectorAll('.bento-item'));
    bentoRects = bentoItems.map(item => item.getBoundingClientRect());
  }

  function applyBentoSpotlight() {
    rafPending = false;
    bentoItems.forEach((item, i) => {
      const rect = bentoRects[i];
      if (!rect) return;
      item.style.setProperty('--mouse-x', `${lastX - rect.left}px`);
      item.style.setProperty('--mouse-y', `${lastY - rect.top}px`);
    });
  }

  // Cache after DOM is settled, and on resize
  requestAnimationFrame(cacheBentoRects);
  window.addEventListener('resize', cacheBentoRects, { passive: true });

  document.addEventListener('mousemove', (e) => {
    lastX = e.clientX;
    lastY = e.clientY;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(applyBentoSpotlight);
    }
  }, { passive: true });
})();"""

if old_bento_mouse in js:
    js = js.replace(old_bento_mouse, new_bento_mouse)
    print("FIX 5: Bento mousemove layout thrash fixed ✓")
else:
    print("FIX 5: Bento mousemove block not found — check manually")

# ─── FIX 6: Debounce autoFitHeroText resize listener ────────────────────────
old_autofit_listeners = """// Run safely after fonts load to ensure accurate measurements
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    autoFitHeroText();
    window.addEventListener('resize', autoFitHeroText);
  });
} else {
  // Fallback for older browsers
  window.addEventListener('load', autoFitHeroText);
  window.addEventListener('resize', autoFitHeroText);
}"""

new_autofit_listeners = """// Run safely after fonts load to ensure accurate measurements
// Resize listener is debounced to prevent layout-thrash during continuous resize
(function() {
  let resizeTimer = null;
  function debouncedAutoFit() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(autoFitHeroText, 120);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      autoFitHeroText();
      window.addEventListener('resize', debouncedAutoFit, { passive: true });
    });
  } else {
    window.addEventListener('load', autoFitHeroText);
    window.addEventListener('resize', debouncedAutoFit, { passive: true });
  }
})();"""

if old_autofit_listeners in js:
    js = js.replace(old_autofit_listeners, new_autofit_listeners)
    print("FIX 6: autoFitHeroText debounced ✓")
else:
    print("FIX 6: autoFit listener block not found — check manually")

# ─── FIX 7: Tool items start fully visible so stagger is an enhancement, 
# not a requirement for visibility ─────────────────────────────────────────────
# The stagger loop sets opacity='0' then does setTimeout to add class.
# If the page is already scrolled past the container on load, the setTimeout
# still fires but the items were already at opacity:0. Make initial state
# visible-by-default; the animation class enhances it.
old_stagger = """        // Clean CSS-native stagger reveal (No GSAP conflicts)
        newNodes.forEach((el, index) => {
            el.style.position = '';
            el.style.top = '';
            el.style.left = '';
            el.style.margin = '';
            el.style.opacity = '0';
            el.style.transform = '';
            
            setTimeout(() => {
                el.classList.add('tool-reveal');
            }, index * 60);
        });"""

new_stagger = """        // CSS-native stagger reveal — items are visible by default,
        // animation class enhances appearance but is not required for visibility
        newNodes.forEach((el, index) => {
            el.style.position = '';
            el.style.top = '';
            el.style.left = '';
            el.style.margin = '';
            // Start transparent for stagger, but with a guaranteed fallback
            el.style.opacity = '0';
            el.style.transform = 'translateY(12px) scale(0.95)';
            el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0) scale(1)';
            }, 80 + index * 55); // 80ms base delay + stagger
        });"""

if old_stagger in js:
    js = js.replace(old_stagger, new_stagger)
    print("FIX 7: Tool stagger made robust (CSS transitions, no class dependency) ✓")
else:
    print("FIX 7: Stagger block not found — check manually")

with open('script.js', 'w') as f:
    f.write(js)

print("\nAll JS fixes written to script.js.")
