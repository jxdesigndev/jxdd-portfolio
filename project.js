document.addEventListener('DOMContentLoaded', async () => {
  const mainContent = document.getElementById('main-content');
  const footerTitle = document.getElementById('footer-project-title');
  const pageWrap = document.getElementById('page');

  /* ── Helper: detect if a URL is a video ── */
  function isVideoUrl(url) {
    if (!url) return false;
    const u = url.toLowerCase().split('?')[0];
    return u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.mov');
  }

  /* ── Helper: render image or video element ── */
  function makeMedia(src, altOrTitle, extraClass, lazy) {
    if (isVideoUrl(src)) {
      const vid = document.createElement('video');
      vid.src = src;
      vid.autoplay = true;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.className = extraClass || '';
      return vid;
    }
    const img = document.createElement('img');
    img.src = src;
    img.alt = altOrTitle || '';
    img.className = extraClass || '';
    if (lazy) img.loading = 'lazy';
    return img;
  }

  /* ── Terminal decoder animation on h2 elements ── */
  function attachDecoder(el) {
    if (!window.gsap || !window.ScrollTrigger) return;
    const original = el.textContent;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let frame = 0;
    let raf;
    const totalFrames = 18;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        el.classList.add('decoder-running');
        const run = () => {
          frame++;
          const progress = frame / totalFrames;
          el.textContent = original
            .split('')
            .map((c, i) => {
              if (c === ' ') return ' ';
              if (i / original.length < progress) return c;
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('');
          if (frame < totalFrames) {
            raf = requestAnimationFrame(run);
          } else {
            el.textContent = original;
            el.classList.remove('decoder-running');
          }
        };
        raf = requestAnimationFrame(run);
      }
    });
  }

  /* ── Lightbox setup ── */
  function setupLightbox() {
    let lb = document.getElementById('cs-lightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'cs-lightbox';
      lb.innerHTML = `<button id="cs-lightbox-close" aria-label="Close">✕</button><img src="" alt="">`;
      document.body.appendChild(lb);
      const closeBtn = lb.querySelector('#cs-lightbox-close');
      const closeIt = () => { lb.classList.remove('open'); };
      closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeIt(); });
      lb.addEventListener('click', closeIt);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeIt(); });
    }
    return lb;
  }

  function openLightbox(src, alt) {
    const lb = document.getElementById('cs-lightbox') || setupLightbox();
    const img = lb.querySelector('img');
    img.src = src;
    img.alt = alt || '';
    lb.classList.add('open');
  }

  /* ── Magnetic button effect ── */
  function attachMagnetic(el) {
    const strength = 0.3;
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0,0)';
    });
  }

  /* ── GSAP animations ── */
  const applyAnimations = () => {
    if (window.gsap) {
      gsap.to('#page', { opacity: 1, duration: 1, ease: 'power2.out' });

      const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur');
      reveals.forEach(el => {
        const isLeft  = el.classList.contains('reveal-left');
        const isRight = el.classList.contains('reveal-right');
        const isScale = el.classList.contains('reveal-scale');
        const isBlur  = el.classList.contains('reveal-blur');

        const from = isLeft  ? { opacity: 0, x: -40 }
                   : isRight ? { opacity: 0, x:  40 }
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
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      });

      // Staggered gallery reveals
      document.querySelectorAll('.screenshot-gallery').forEach(gallery => {
        const frames = gallery.querySelectorAll('.screenshot-frame');
        frames.forEach((frame, i) => {
          gsap.fromTo(frame,
            { opacity: 0, y: 40, scale: 0.95 },
            {
              opacity: 1, y: 0, scale: 1,
              duration: 0.7,
              ease: 'power3.out',
              delay: i * 0.08,
              scrollTrigger: { trigger: frame, start: 'top 90%', once: true }
            }
          );
        });
      });

      // Decoder on all h2 headings in content
      document.querySelectorAll('.case-study-content h2').forEach(attachDecoder);

      // Parallax on images
      gsap.utils.toArray('.parallax-img').forEach(img => {
        gsap.to(img, {
          y: -40, ease: 'none',
          scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    } else {
      pageWrap.style.opacity = '1';
      document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.filter = 'none';
      });
    }

    // Magnetic buttons (works without GSAP)
    document.querySelectorAll('.btn-magnetic').forEach(attachMagnetic);

    // Lightbox on all screenshot images
    setupLightbox();
    document.querySelectorAll('.screenshot-frame img').forEach(img => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(img.src, img.alt);
      });
      img.style.cursor = 'zoom-in';
    });
  };

  /* ── Not Found ── */
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
    if (!slug) { renderNotFound(); return; }

    try { if (window.initSupabase) await window.initSupabase(); } catch (err) { console.warn('Supabase init failed', err); }
    if (typeof supabase === 'undefined' || !supabase.from) { renderNotFound(); return; }

    const { data: project, error } = await window.supabase
      .from('projects').select('*').eq('slug', slug).single();

    if (error || !project) { console.error('Project fetch error:', error); renderNotFound(); return; }

    mainContent.innerHTML = '';

    // ── HERO SECTION ──
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

    // Meta grid: 2 rows × 3 cols
    const metaGrid = document.createElement('div');
    metaGrid.className = 'case-study-meta reveal-scale';

    const regularMeta = [
      { label: 'Category', value: project.category },
      { label: 'Year',     value: project.year },
      { label: 'Role',     value: project.project_role },
      { label: 'Timeline', value: project.timeline },
      { label: 'Type',     value: project.project_type },
    ];
    regularMeta.forEach(item => {
      if (!item.value) return;
      const cell = document.createElement('div');
      cell.className = 'meta-cell';
      const lbl = document.createElement('span');
      lbl.className = 'meta-label';
      lbl.textContent = item.label;
      const val = document.createElement('span');
      val.className = 'meta-value';
      val.textContent = item.value;
      cell.appendChild(lbl);
      cell.appendChild(val);
      metaGrid.appendChild(cell);
    });

    // Tools as pills (occupies last slot in the grid)
    if (project.tools && project.tools.length > 0) {
      const cell = document.createElement('div');
      cell.className = 'meta-cell';
      const lbl = document.createElement('span');
      lbl.className = 'meta-label';
      lbl.textContent = 'Tools';
      const pillRow = document.createElement('div');
      pillRow.className = 'meta-tools-row';
      project.tools.forEach(tool => {
        const pill = document.createElement('span');
        pill.className = 'tool-pill';
        pill.textContent = tool;
        pillRow.appendChild(pill);
      });
      cell.appendChild(lbl);
      cell.appendChild(pillRow);
      metaGrid.appendChild(cell);
    }

    if (metaGrid.children.length > 0) heroSection.appendChild(metaGrid);

    // Hero cover: image or video
    const heroSrc = project.cover_image_url || project.image_url;
    if (heroSrc) {
      const heroMedia = isVideoUrl(heroSrc)
        ? makeMedia(heroSrc, project.title, 'case-study-video-full reveal-scale')
        : makeMedia(heroSrc, project.title, 'case-study-image-full reveal-scale', true);
      heroSection.appendChild(heroMedia);
    }
    mainContent.appendChild(heroSection);

    // ── CONTENT SECTION ──
    const contentSection = document.createElement('section');
    contentSection.className = 'case-study-content';

    // ── OVERVIEW ──
    const overviewText = project.content || project.description;
    if (overviewText || project.persona_image_url) {
      const h2 = document.createElement('h2');
      h2.className = 'reveal';
      h2.textContent = 'Overview';
      contentSection.appendChild(h2);

      const ALLOWED = {
        ALLOWED_TAGS: ['b','strong','i','em','blockquote','p','br','ul','ol','li','h2','h3','h4']
      };

      // Wrapper for text + float image
      const overviewWrap = document.createElement('div');
      overviewWrap.className = 'overview-wrap overview-clearfix';

      // Float persona image right if exists
      if (project.persona_image_url) {
        const pImg = document.createElement('img');
        pImg.src = project.persona_image_url;
        pImg.alt = 'Persona';
        pImg.className = 'persona-float reveal-blur';
        pImg.loading = 'lazy';
        overviewWrap.appendChild(pImg);
      }

      if (overviewText) {
        const cleanHTML = window.DOMPurify
          ? window.DOMPurify.sanitize(overviewText, ALLOWED)
          : (() => { const d = document.createElement('div'); d.textContent = new DOMParser().parseFromString(overviewText || '', 'text/html').body.textContent || ''; return d.innerHTML; })();
        const tempDiv = document.createElement('div');
        tempDiv.className = 'tiptap-content';
        tempDiv.innerHTML = cleanHTML;
        tempDiv.querySelectorAll('p, blockquote, ul, ol, h2, h3, h4').forEach(el => el.classList.add('reveal'));
        overviewWrap.appendChild(tempDiv);
      }

      contentSection.appendChild(overviewWrap);
    }

    // ── PROCESS & WIREFRAMES ──
    if (project.process_image_urls && project.process_image_urls.length > 0) {
      const h2 = document.createElement('h2');
      h2.className = 'reveal';
      h2.textContent = 'Process & Wireframes';
      h2.style.marginTop = 'var(--s-32)';
      contentSection.appendChild(h2);

      const gallery = document.createElement('div');
      gallery.className = 'screenshot-gallery';

      project.process_image_urls.forEach((url, i) => {
        const frame = document.createElement('div');
        frame.className = 'screenshot-frame frame-portrait';
        frame.style.transitionDelay = `${i * 0.1}s`;
        const img = document.createElement('img');
        img.onload = () => {
          if (img.naturalWidth > img.naturalHeight) {
            frame.classList.remove('frame-portrait');
            frame.classList.add('frame-landscape');
          }
          if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        };
        img.src = url;
        img.alt = `Process ${i + 1}`;
        const pic = document.createElement('picture');
        pic.appendChild(img);
        frame.appendChild(pic);
        gallery.appendChild(frame);
      });

      if (project.process_image_urls.length === 1) {
        gallery.classList.add('single-portrait');
      }

      contentSection.appendChild(gallery);
    }

    // ── SCREENS ──
    if (project.screenshot_urls && project.screenshot_urls.length > 0) {
      const h2 = document.createElement('h2');
      h2.className = 'reveal';
      h2.textContent = 'Screens';
      h2.style.marginTop = 'var(--s-32)';
      contentSection.appendChild(h2);

      const gallery = document.createElement('div');
      gallery.className = 'screenshot-gallery';

      project.screenshot_urls.forEach((url, i) => {
        const frame = document.createElement('div');
        frame.className = 'screenshot-frame frame-portrait';
        frame.style.transitionDelay = `${i * 0.1}s`;
        const img = document.createElement('img');
        img.onload = () => {
          if (img.naturalWidth > img.naturalHeight) {
            frame.classList.remove('frame-portrait');
            frame.classList.add('frame-landscape');
          }
          if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        };
        img.src = url;
        img.alt = `Screen ${i + 1}`;
        const pic = document.createElement('picture');
        pic.appendChild(img);
        frame.appendChild(pic);
        gallery.appendChild(frame);
      });

      if (project.screenshot_urls.length === 1) {
        gallery.classList.add('single-portrait');
      }

      contentSection.appendChild(gallery);
    }

    // ── OUTCOME ──
    if (project.outcome_text) {
      const h2 = document.createElement('h2');
      h2.className = 'reveal';
      h2.textContent = 'Outcome';
      contentSection.appendChild(h2);

      const ALLOWED = {
        ALLOWED_TAGS: ['b','strong','i','em','blockquote','p','br','ul','ol','li','h2','h3','h4']
      };
      const cleanHTML = window.DOMPurify
        ? window.DOMPurify.sanitize(project.outcome_text, ALLOWED)
        : (() => { const d = document.createElement('div'); d.textContent = new DOMParser().parseFromString(project.outcome_text || '', 'text/html').body.textContent || ''; return d.innerHTML; })();
      const tempDiv = document.createElement('div');
      tempDiv.className = 'tiptap-content';
      tempDiv.innerHTML = cleanHTML;
      tempDiv.querySelectorAll('p, blockquote, ul, ol, h2, h3, h4').forEach(el => el.classList.add('reveal'));
      contentSection.appendChild(tempDiv);
    }

    // ── ACTION BUTTONS ──
    const hasButtons = project.url || project.case_study || project.github_url;
    if (hasButtons) {
      const btnWrap = document.createElement('div');
      btnWrap.className = 'project-actions reveal-scale';

      if (project.url) {
        const a = document.createElement('a');
        a.href = project.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'btn btn-primary btn-magnetic';
        a.textContent = 'View Live Project ↗';
        btnWrap.appendChild(a);
      }
      if (project.case_study) {
        const a = document.createElement('a');
        a.href = project.case_study;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'btn btn-primary btn-magnetic';
        a.textContent = 'View Case Study ↗';
        btnWrap.appendChild(a);
      }
      if (project.github_url) {
        const a = document.createElement('a');
        a.href = project.github_url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = 'btn btn-ghost btn-magnetic';
        a.textContent = 'View on GitHub ↗';
        btnWrap.appendChild(a);
      }
      contentSection.appendChild(btnWrap);
    }

    mainContent.appendChild(contentSection);

    footerTitle.textContent = `${(project.title || '').toUpperCase()} / CASE STUDY`;
    document.title = `${project.title || 'Project'} | JX Design & Dev`;

    applyAnimations();

  } catch (err) {
    console.error('Project page error:', err);
    renderNotFound();
  }
});
