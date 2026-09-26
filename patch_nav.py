import re

with open('nav.js', 'r') as f:
    content = f.read()

helper_function = """    /* Shared Video Looping Utility */
    function initLoopingPreviewVideo(videoEl) {
      if (!videoEl || videoEl.tagName !== 'VIDEO') return;
      
      const prefsRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefsRM) {
        // Reduced motion: Do not autoplay or loop. 
        // Leave static on poster frame (requires manual click).
        return; 
      }
      
      videoEl.muted = true;
      videoEl.loop = true;
      videoEl.setAttribute('playsinline', '');
      
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              videoEl.play().catch(e => console.warn('JX: Video autoplay prevented', e));
            } else {
              videoEl.pause();
            }
          });
        }, { threshold: 0.1 });
        observer.observe(videoEl);
      } else {
        videoEl.autoplay = true;
      }
    }

    /* Expose helpers globally */"""

content = content.replace("    /* Expose helpers globally */", helper_function)

export_block = """    window.JX.nav = {
      startClock,
      loadAvailability,
    };"""

new_export_block = """    window.JX.nav = {
      startClock,
      loadAvailability,
    };
    window.JX.initLoopingPreviewVideo = initLoopingPreviewVideo;"""

content = content.replace(export_block, new_export_block)

with open('nav.js', 'w') as f:
    f.write(content)

