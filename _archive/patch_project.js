const fs = require('fs');

let code = fs.readFileSync('project.js', 'utf8');

// 1. Hero image patch
const heroOld = `
    if (project.image_url) {
      const heroImg = document.createElement('img');
      heroImg.src = project.image_url;
      heroImg.alt = project.title;
      heroImg.className = 'case-study-image-full reveal-scale';
      heroImg.loading = 'lazy';
      heroSection.appendChild(heroImg);
    }
`;
const heroNew = `
    const heroSrc = project.cover_image_url || project.image_url;
    if (heroSrc) {
      const heroImg = document.createElement('img');
      heroImg.src = heroSrc;
      heroImg.alt = project.title;
      heroImg.className = 'case-study-image-full reveal-scale';
      heroImg.loading = 'lazy';
      heroSection.appendChild(heroImg);
    }
`;
code = code.replace(heroOld, heroNew);

// 2. Process section patch
const galleryStart = "    // Screenshots Gallery";
const processCode = `
    // Process Images
    if (project.process_image_urls && project.process_image_urls.length > 0) {
      const procHeading = document.createElement('h2');
      procHeading.className = 'reveal';
      procHeading.textContent = 'Process & Wireframes';
      procHeading.style.marginTop = 'var(--s-32)';
      contentSection.appendChild(procHeading);

      const processGallery = document.createElement('div');
      processGallery.className = 'screenshot-gallery';

      const procPromises = project.process_image_urls.map((url, i) => {
        return new Promise((resolve) => {
          const frame = document.createElement('div');
          frame.className = 'screenshot-frame reveal-scale';
          frame.style.transitionDelay = \`\${i * 0.1}s\`;
          
          const img = document.createElement('img');
          
          img.onload = () => {
            if (img.naturalWidth > img.naturalHeight) {
              frame.classList.add('frame-landscape');
            } else {
              frame.classList.add('frame-portrait');
            }
            resolve(frame);
          };
          img.onerror = () => {
            console.warn('Failed to load process image:', url);
            resolve(null);
          };

          img.src = url;
          img.alt = \`Process \${i + 1}\`;
          
          const picture = document.createElement('picture');
          picture.appendChild(img);
          frame.appendChild(picture);
        });
      });

      const loadedProcFrames = await Promise.all(procPromises);
      loadedProcFrames.forEach(frame => {
        if (frame) processGallery.appendChild(frame);
      });

      contentSection.appendChild(processGallery);
    }

`;
code = code.replace(galleryStart, processCode + galleryStart);

fs.writeFileSync('project.js', code);
