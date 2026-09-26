const fs = require('fs');
let code = fs.readFileSync('project.js', 'utf8');

const processOld = `      const procPromises = project.process_image_urls.map((url, i) => new Promise(resolve => {
        const frame = document.createElement('div');
        frame.className = 'screenshot-frame';
        frame.style.transitionDelay = \`\${i * 0.1}s\`;
        const img = document.createElement('img');
        img.onload = () => {
          frame.classList.add(img.naturalWidth > img.naturalHeight ? 'frame-landscape' : 'frame-portrait');
          resolve(frame);
        };
        img.onerror = () => resolve(null);
        img.src = url;
        img.alt = \`Process \${i + 1}\`;
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
      }`;

const processNew = `      project.process_image_urls.forEach((url, i) => {
        const frame = document.createElement('div');
        frame.className = 'screenshot-frame frame-portrait';
        frame.style.transitionDelay = \`\${i * 0.1}s\`;
        const img = document.createElement('img');
        img.onload = () => {
          if (img.naturalWidth > img.naturalHeight) {
            frame.classList.remove('frame-portrait');
            frame.classList.add('frame-landscape');
          }
          if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        };
        img.src = url;
        img.alt = \`Process \${i + 1}\`;
        const pic = document.createElement('picture');
        pic.appendChild(img);
        frame.appendChild(pic);
        gallery.appendChild(frame);
      });

      if (project.process_image_urls.length === 1) {
        gallery.classList.add('single-portrait');
      }`;

code = code.replace(processOld, processNew);

const screensOld = `      const framePromises = project.screenshot_urls.map((url, i) => new Promise(resolve => {
        const frame = document.createElement('div');
        frame.className = 'screenshot-frame';
        frame.style.transitionDelay = \`\${i * 0.1}s\`;
        const img = document.createElement('img');
        img.onload = () => {
          frame.classList.add(img.naturalWidth > img.naturalHeight ? 'frame-landscape' : 'frame-portrait');
          resolve(frame);
        };
        img.onerror = () => resolve(null);
        img.src = url;
        img.alt = \`Screen \${i + 1}\`;
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
      }`;

const screensNew = `      project.screenshot_urls.forEach((url, i) => {
        const frame = document.createElement('div');
        frame.className = 'screenshot-frame frame-portrait';
        frame.style.transitionDelay = \`\${i * 0.1}s\`;
        const img = document.createElement('img');
        img.onload = () => {
          if (img.naturalWidth > img.naturalHeight) {
            frame.classList.remove('frame-portrait');
            frame.classList.add('frame-landscape');
          }
          if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        };
        img.src = url;
        img.alt = \`Screen \${i + 1}\`;
        const pic = document.createElement('picture');
        pic.appendChild(img);
        frame.appendChild(pic);
        gallery.appendChild(frame);
      });

      if (project.screenshot_urls.length === 1) {
        gallery.classList.add('single-portrait');
      }`;

code = code.replace(screensOld, screensNew);

fs.writeFileSync('project.js', code);
