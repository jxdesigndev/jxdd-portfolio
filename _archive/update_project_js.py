import re

with open('project.js', 'r') as f:
    code = f.read()

# Fix DOMPurify allowed tags
allowed_old = "ALLOWED_TAGS: ['b','strong','i','em','blockquote','p','br','ul','ol','li','h2','h3','h4']"
allowed_new = "ALLOWED_TAGS: ['b','strong','i','em','blockquote','p','br','ul','ol','li','h2','h3','h4','img']"
code = code.replace(allowed_old, allowed_new)

# Fix Process Gallery Promises
proc_old = """      const procPromises = project.process_image_urls.map((url, i) => new Promise(resolve => {
        const frame = document.createElement('div');
        frame.className = 'screenshot-frame';
        frame.style.transitionDelay = `${i * 0.1}s`;
        const img = document.createElement('img');
        img.onload = () => {
          frame.classList.add(img.naturalWidth > img.naturalHeight ? 'frame-landscape' : 'frame-portrait');
          resolve(frame);
        };
        img.onerror = () => resolve(null);
        img.src = url;
        img.alt = `Process ${i + 1}`;
        img.loading = 'lazy';
        const pic = document.createElement('picture');
        pic.appendChild(img);
        frame.appendChild(pic);
      }));

      const loaded = await Promise.all(procPromises);
      loaded.forEach(f => { if (f) gallery.appendChild(f); });

      // Single image gets full width treatment
      const validFrames = loaded.filter(Boolean);
      if (validFrames.length === 1 && validFrames[0].classList.contains('frame-portrait')) {
        gallery.classList.add('single-portrait');
      }"""

proc_new = """      project.process_image_urls.forEach((url, i) => {
        const frame = document.createElement('div');
        frame.className = 'screenshot-frame';
        frame.style.transitionDelay = `${i * 0.1}s`;
        const img = document.createElement('img');
        img.onload = () => {
          const isLandscape = img.naturalWidth > img.naturalHeight;
          frame.classList.add(isLandscape ? 'frame-landscape' : 'frame-portrait');
          
          if (project.process_image_urls.length === 1 && !isLandscape) {
            gallery.classList.add('single-portrait');
          }
          if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        };
        img.src = url;
        img.alt = `Process ${i + 1}`;
        const pic = document.createElement('picture');
        pic.appendChild(img);
        frame.appendChild(pic);
        gallery.appendChild(frame);
      });"""

code = code.replace(proc_old, proc_new)

# Fix Screens Gallery Promises
scr_old = """      const framePromises = project.screenshot_urls.map((url, i) => new Promise(resolve => {
        const frame = document.createElement('div');
        frame.className = 'screenshot-frame';
        frame.style.transitionDelay = `${i * 0.1}s`;
        const img = document.createElement('img');
        img.onload = () => {
          frame.classList.add(img.naturalWidth > img.naturalHeight ? 'frame-landscape' : 'frame-portrait');
          resolve(frame);
        };
        img.onerror = () => resolve(null);
        img.src = url;
        img.alt = `Screen ${i + 1}`;
        const pic = document.createElement('picture');
        pic.appendChild(img);
        frame.appendChild(pic);
      }));

      const loadedFrames = await Promise.all(framePromises);
      loadedFrames.forEach(f => { if (f) gallery.appendChild(f); });

      // Single portrait image: center it nicely
      const validScreens = loadedFrames.filter(Boolean);
      if (validScreens.length === 1 && validScreens[0].classList.contains('frame-portrait')) {
        gallery.classList.add('single-portrait');
      }"""

scr_new = """      project.screenshot_urls.forEach((url, i) => {
        const frame = document.createElement('div');
        frame.className = 'screenshot-frame';
        frame.style.transitionDelay = `${i * 0.1}s`;
        const img = document.createElement('img');
        img.onload = () => {
          const isLandscape = img.naturalWidth > img.naturalHeight;
          frame.classList.add(isLandscape ? 'frame-landscape' : 'frame-portrait');
          
          if (project.screenshot_urls.length === 1 && !isLandscape) {
            gallery.classList.add('single-portrait');
          }
          if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        };
        img.src = url;
        img.alt = `Screen ${i + 1}`;
        const pic = document.createElement('picture');
        pic.appendChild(img);
        frame.appendChild(pic);
        gallery.appendChild(frame);
      });"""

code = code.replace(scr_old, scr_new)

with open('project.js', 'w') as f:
    f.write(code)
