document.addEventListener('DOMContentLoaded', async () => {
  const mainContent = document.getElementById('main-content');
  const footerTitle = document.getElementById('footer-project-title');
  const pageWrap = document.getElementById('page');

  // GSAP or CSS fallback animation wrapper
  const applyAnimations = () => {
    // Fade page in
    if (window.gsap) {
      gsap.to('#page', { opacity: 1, duration: 1, ease: 'power2.out' });
      
      const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur');
      reveals.forEach(el => {
        const isLeft  = el.classList.contains('reveal-left');
        const isRight = el.classList.contains('reveal-right');
        const isScale = el.classList.contains('reveal-scale');
        const isBlur  = el.classList.contains('reveal-blur');

        const from = isLeft  ? { opacity: 0, x: -40 }
                   : isRight ? { opacity: 0, x: 40  }
                   : isScale ? { opacity: 0, scale: 0.92 }
                   : isBlur  ? { opacity: 0, filter: 'blur(12px)' }
                   : { opacity: 0, y: 40 };

        const to = isLeft || isRight ? { opacity: 1, x: 0 }
                 : isScale           ? { opacity: 1, scale: 1 }
                 : isBlur            ? { opacity: 1, filter: 'blur(0px)' }
                 : { opacity: 1, y: 0 };

        gsap.fromTo(el, from, {
          ...to,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          }
        });
      });
      
      gsap.utils.toArray('.parallax-img').forEach(img => {
        gsap.to(img, {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: img,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        });
      });
    } else {
      // Fallback
      pageWrap.style.opacity = '1';
      pageWrap.style.transition = 'opacity 0.6s ease';
      document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.filter = 'none';
      });
    }
  };

  const renderNotFound = () => {
    mainContent.innerHTML = '';
    const section = document.createElement('section');
    section.className = 'case-study-hero';
    section.style.textAlign = 'center';
    
    const backBtn = document.createElement('a');
    backBtn.href = 'work.html';
    backBtn.className = 'btn btn-ghost';
    backBtn.style.marginBottom = 'var(--s-12)';
    backBtn.textContent = '← Back to Work';
    
    const title = document.createElement('h1');
    title.className = 'case-study-title reveal';
    title.textContent = 'Project Not Found';
    
    const subtitle = document.createElement('p');
    subtitle.style.fontFamily = 'var(--font-mono)';
    subtitle.style.color = 'var(--gray-2)';
    subtitle.textContent = 'The case study you are looking for does not exist.';
    
    section.appendChild(backBtn);
    section.appendChild(title);
    section.appendChild(subtitle);
    mainContent.appendChild(section);
    
    applyAnimations();
  };

  try {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
      renderNotFound();
      return;
    }

    try {
      if (window.initSupabase) await window.initSupabase();
    } catch (err) {
      console.warn("Supabase init failed", err);
    }
    
    if (typeof supabase === 'undefined' || !supabase.from) {
      renderNotFound();
      return;
    }

    const { data: project, error } = await window.supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !project) {
      console.error('Project fetch error:', error);
      renderNotFound();
      return;
    }

    // Build DOM safely
    mainContent.innerHTML = '';

    // -- Hero Section --
    const heroSection = document.createElement('section');
    heroSection.className = 'case-study-hero';
    
    const backLink = document.createElement('a');
    backLink.href = 'work.html';
    backLink.className = 'btn btn-ghost';
    backLink.style.marginBottom = 'var(--s-12)';
    backLink.style.alignSelf = 'flex-start';
    backLink.textContent = '← Back to Work';
    heroSection.appendChild(backLink);

    const titleH1 = document.createElement('h1');
    titleH1.className = 'case-study-title reveal';
    titleH1.textContent = project.title || 'Untitled';
    heroSection.appendChild(titleH1);

    const metaGrid = document.createElement('div');
    metaGrid.className = 'case-study-meta reveal-scale';
    
    const metaItems = [
      { label: 'Role', value: project.project_role },
      { label: 'Tools', value: (project.tools || []).join(', ') },
      { label: 'Timeline', value: project.timeline },
      { label: 'Type', value: project.project_type }
    ];

    metaItems.forEach(item => {
      if (item.value) {
        const div = document.createElement('div');
        div.textContent = item.label + ' ';
        const span = document.createElement('span');
        span.textContent = item.value;
        div.appendChild(span);
        metaGrid.appendChild(div);
      }
    });
    if (metaGrid.children.length > 0) {
      heroSection.appendChild(metaGrid);
    }

    if (project.image_url) {
      const heroImg = document.createElement('img');
      heroImg.src = project.image_url;
      heroImg.alt = project.title;
      heroImg.className = 'case-study-image-full reveal-scale';
      heroImg.loading = 'lazy';
      heroSection.appendChild(heroImg);
    }
    mainContent.appendChild(heroSection);

    // -- Content Section --
    const contentSection = document.createElement('section');
    contentSection.className = 'case-study-content';

    // Persona / Description Split Section
    if (project.persona_image_url || project.description) {
      const descHeading = document.createElement('h2');
      descHeading.className = 'reveal';
      descHeading.textContent = 'Overview';
      contentSection.appendChild(descHeading);

      const splitDiv = document.createElement('div');
      splitDiv.className = 'split-section';
      splitDiv.style.marginTop = '0';

      const textWrapper = document.createElement('div');
      if (project.description) {
        // Split description by double newlines into paragraphs
        const paras = project.description.split('\n\n').filter(p => p.trim() !== '');
        paras.forEach(pText => {
          const p = document.createElement('p');
          p.className = 'reveal';
          p.textContent = pText.trim();
          textWrapper.appendChild(p);
        });
      }
      splitDiv.appendChild(textWrapper);

      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'reveal-blur';
      if (project.persona_image_url) {
        const pImg = document.createElement('img');
        pImg.src = project.persona_image_url;
        pImg.alt = 'Persona Image';
        pImg.className = 'case-study-image-full';
        pImg.loading = 'lazy';
        pImg.style.margin = '0';
        pImg.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
        imgWrapper.appendChild(pImg);
      }
      splitDiv.appendChild(imgWrapper);
      
      contentSection.appendChild(splitDiv);
    }

    // Screenshots Gallery
    if (project.screenshot_urls && project.screenshot_urls.length > 0) {
      const galleryDiv = document.createElement('div');
      galleryDiv.className = 'screenshot-gallery';

      // Preload images in memory to determine orientation BEFORE appending to DOM
      // This prevents layout shifts/flashes and avoids ScrollTrigger recalculation issues.
      const framePromises = project.screenshot_urls.map((url, i) => {
        return new Promise((resolve) => {
          const frame = document.createElement('div');
          frame.className = 'screenshot-frame reveal-scale';
          frame.style.transitionDelay = `${i * 0.1}s`;
          
          const img = document.createElement('img');
          // Removed loading='lazy' because off-DOM lazy images may never trigger onload
          
          img.onload = () => {
            if (img.naturalWidth > img.naturalHeight) {
              frame.classList.add('frame-landscape');
            } else {
              frame.classList.add('frame-portrait');
            }
            resolve(frame);
          };
          img.onerror = () => {
            console.warn('Failed to load screenshot:', url);
            resolve(null);
          };

          img.src = url;
          img.alt = `Screenshot ${i + 1}`;
          
          const picture = document.createElement('picture');
          picture.appendChild(img);
          frame.appendChild(picture);
        });
      });

      const loadedFrames = await Promise.all(framePromises);
      loadedFrames.forEach(frame => {
        if (frame) galleryDiv.appendChild(frame);
      });

      contentSection.appendChild(galleryDiv);
    }

    // Outcome
    if (project.outcome_text) {
      const outHeading = document.createElement('h2');
      outHeading.className = 'reveal';
      outHeading.textContent = 'Outcome';
      contentSection.appendChild(outHeading);

      const outParas = project.outcome_text.split('\n\n').filter(p => p.trim() !== '');
      outParas.forEach(pText => {
        const p = document.createElement('p');
        p.className = 'reveal';
        p.textContent = pText.trim();
        contentSection.appendChild(p);
      });
    }

    // Case Study Link (if exists, e.g. external link or further reading)
    if (project.case_study) {
      const linkWrap = document.createElement('div');
      linkWrap.style.marginTop = 'var(--s-16)';
      linkWrap.className = 'reveal-scale';

      const a = document.createElement('a');
      a.href = project.case_study;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'btn btn-primary';
      a.textContent = 'View Case Study ↗';
      
      linkWrap.appendChild(a);
      contentSection.appendChild(linkWrap);
    }

    mainContent.appendChild(contentSection);
    
    // Update footer
    footerTitle.textContent = `${(project.title || '').toUpperCase()} / CASE STUDY`;
    document.title = `${project.title || 'Project'} | JX Design & Dev`;

    applyAnimations();

  } catch (err) {
    console.error('Project page error:', err);
    renderNotFound();
  }
});
