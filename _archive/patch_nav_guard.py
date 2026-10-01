import re

with open('nav.js', 'r') as f:
    content = f.read()

old_code = """    function initLoopingPreviewVideo(videoEl) {
      if (!videoEl || videoEl.tagName !== 'VIDEO') return;
      
      const prefsRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;"""

new_code = """    function initLoopingPreviewVideo(videoEl) {
      if (!videoEl || videoEl.tagName !== 'VIDEO') return;
      if (videoEl.dataset.loopInit) return; // Prevent duplicate observers
      videoEl.dataset.loopInit = 'true';
      
      const prefsRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;"""

content = content.replace(old_code, new_code)

with open('nav.js', 'w') as f:
    f.write(content)
