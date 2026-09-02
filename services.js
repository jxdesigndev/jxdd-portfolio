/* ================================================================
   JX UNIVERSE — services.js v3.0
   The Forge - Page specific logic & 3D Hover Effects
   ================================================================ */

'use strict';

(function () {
  function revealPage () {
    const page = document.getElementById('page');
    if (!page) return;
    if (window.gsap) {
      gsap.to(page, { opacity: 1, duration: 0.7, ease: 'power2.out' });
      const tl = gsap.timeline({ delay: 0.1 });
      const shTitle = document.getElementById('sh-title');
      if (shTitle && window.SplitText) {
        gsap.registerPlugin(SplitText);
        shTitle.style.transform = 'none';
        shTitle.style.opacity = '1';
        const split = SplitText.create(shTitle, { type: 'chars', mask: 'chars' });
        tl.to('#sh-label', { opacity: 1, duration: 0.6 })
          .from(split.chars, { yPercent: 100, duration: 0.9, ease: 'expo.out', stagger: { each: 0.025 } }, '-=0.3')
          .to('#sh-sub',    { opacity: 1, duration: 0.7 }, '-=0.5');
      } else {
        tl.to('#sh-label', { opacity: 1, duration: 0.6 })
          .to('#sh-title',  { y: 0, opacity: 1, duration: 1, ease: 'expo.out' }, '-=0.3')
          .to('#sh-sub',    { opacity: 1, duration: 0.7 }, '-=0.5');
      }
    } else {
      page.style.opacity = '1';
    }
  }

  function initScrollAnimations () {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    /* SplitText char reveals for h2.headline-lg headings (Phase 4) */
    if (window.SplitText) {
      gsap.registerPlugin(SplitText);
      const prefsRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.querySelectorAll('h2.headline-lg.reveal').forEach(el => {
        el.classList.remove('reveal');
        if (prefsRM) { el.style.opacity = '1'; el.style.transform = 'none'; return; }
        el.style.opacity = '1';
        const split = SplitText.create(el, { type: 'words,chars', mask: 'chars' });
        gsap.from(split.chars, {
          yPercent: 100, opacity: 0, duration: 0.7, ease: 'expo.out',
          stagger: { each: 0.022 },
          scrollTrigger: { trigger: el, start: 'top 80%', once: true }
        });
      });
    }

    document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right').forEach(el => {
      const isScale = el.classList.contains('reveal-scale');
      gsap.fromTo(el,
        isScale ? { opacity: 0, scale: 0.94 } : { opacity: 0, y: 40 },
        { ...(isScale ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 }),
          duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        }
      );
    });
  }

  /* 3D Hover Tilt Effects */
  function initHoverEffects() {
    const visuals = document.querySelectorAll('.service-deep-visual');
    visuals.forEach(visual => {
      visual.addEventListener('mousemove', e => {
        const rect = visual.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -10; // Max rotation 10deg
        const rotateY = ((x - centerX) / centerX) * 10;
        
        visual.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        visual.style.transition = 'none';
      });
      
      visual.addEventListener('mouseleave', () => {
        visual.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        visual.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
      });
    });
  }

  function initLenis () {
    if (!window.Lenis) return;
    if (!window.JXLenis) {
      window.JXLenis = new Lenis({ duration: 1.4, smoothWheel: true });
      const raf = t => { window.JXLenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      if (window.ScrollTrigger) window.JXLenis.on('scroll', ScrollTrigger.update);
    }
  }


  async function loadServices() {
    const container = document.getElementById('services-container');
    if (!container) return;

    try {
      if (window.initSupabase) await window.initSupabase();
    } catch (err) {
      console.warn('JX: Supabase init failed', err);
    }
    const supabase = window.supabase;
    if (typeof supabase === 'undefined' || !supabase.from) return;

    try {
      const { data: services, error: svError } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (svError) throw svError;

      if (!services || services.length === 0) {
        container.innerHTML = '<p style="color:var(--gray-3); text-align:center; padding:var(--s-16) 0;">No services active.</p>';
        return;
      }

      // Fetch Tools for nested grids
      let tools = [];
      try {
        const { data: tData } = await supabase
          .from('tools')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false });
        if (tData) tools = tData;
      } catch (e) {
        console.warn('Failed to load tools', e);
      }

      container.innerHTML = ''; // Clear container

      services.forEach((sv, idx) => {
        const num = `0${idx + 1}`.slice(-2);
        
        const block = document.createElement('div');
        block.className = 'service-deep';

        const left = document.createElement('div');
        left.className = 'service-deep-left reveal';
        
        const numP = document.createElement('p');
        numP.className = 'service-deep-num';
        numP.textContent = `${num} / ${sv.name}`;
        left.appendChild(numP);

        const title = document.createElement('h2');
        title.className = 'service-deep-title';
        title.textContent = sv.name;
        left.appendChild(title);

        const body = document.createElement('p');
        body.className = 'service-deep-body';
        body.textContent = sv.description || '';
        left.appendChild(body);

        if (sv.deliverables && Array.isArray(sv.deliverables) && sv.deliverables.length > 0) {
          const ulist = document.createElement('ul');
          ulist.className = 'service-deep-deliverables';
          sv.deliverables.forEach(d => {
            const li = document.createElement('li');
            li.textContent = d;
            ulist.appendChild(li);
          });
          left.appendChild(ulist);
        }

        const right = document.createElement('div');
        right.className = 'service-deep-right reveal-scale';

        const visual = document.createElement('div');
        visual.className = 'service-deep-visual';
        
        if (sv.video_url) {
           visual.style.padding = '0';
           visual.style.border = 'none';
           visual.style.justifyContent = 'stretch';
           visual.style.overflow = 'hidden';
           
           const video = document.createElement('video');
           video.className = 'service-video';
           video.src = sv.video_url;
           if (sv.image_url) video.poster = sv.image_url;
           video.style.position = 'absolute';
           video.style.width = '100%';
           video.style.height = '100%';
           video.style.objectFit = 'cover';
           video.style.top = '0';
           video.style.left = '0';
           video.setAttribute('playsinline', '');
           video.muted = true;
           video.loop = true;
           
           visual.appendChild(video);
           
           if (window.JX && window.JX.initLoopingPreviewVideo) {
              window.JX.initLoopingPreviewVideo(video);
           }
        } else {
           const icon = document.createElement('span');
           icon.className = 'service-deep-icon';
           icon.textContent = sv.icon || '';
           visual.appendChild(icon);

           const label = document.createElement('span');
           label.className = 'service-deep-label';
           label.textContent = sv.label || '';
           visual.appendChild(label);
        }

        if (sv.tool_category) {
           const toolsDiv = document.createElement('div');
           toolsDiv.className = 'service-deep-tools db-tools-container';
           toolsDiv.setAttribute('data-tool-category', sv.tool_category);
           
           const category = sv.tool_category.toLowerCase();
           const filteredTools = category === 'all' 
             ? tools 
             : tools.filter(t => (t.category || '').toLowerCase() === category);
             
           const toolNodes = [];
           filteredTools.forEach(tool => {
              const item = document.createElement('div');
              item.className = 'tool-item';

              if (tool.logo_url) {
                const img = document.createElement('img');
                img.src    = tool.logo_url;
                img.alt    = tool.name;
                img.title  = tool.name;
                img.width  = 48;
                img.height = 48;
                img.loading = 'lazy';
                item.appendChild(img);
              } else {
                const tlabel = document.createElement('span');
                tlabel.className   = 'tool-item-name';
                tlabel.textContent = tool.name;
                item.appendChild(tlabel);
              }
              toolsDiv.appendChild(item);
              toolNodes.push(item);
           });
           
           visual.appendChild(toolsDiv);
           
           if (window.gsap && window.ScrollTrigger && toolNodes.length > 0) {
              toolNodes.forEach((el, i) => {
                gsap.fromTo(el, { opacity: 0, scale: 0.92 }, {
                  opacity: 1, scale: 1,
                  duration: 0.7,
                  delay: i * 0.04,
                  ease: 'power3.out',
                  scrollTrigger: { trigger: el, start: 'top 90%', once: true }
                });
              });
           }
        }

        right.appendChild(visual);
        block.appendChild(left);
        block.appendChild(right);
        container.appendChild(block);

        // GSAP animate injected element individually if ScrollTrigger exists
        if (window.gsap && window.ScrollTrigger) {
           gsap.fromTo(left, { opacity: 0, y: 40 }, { 
             opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', 
             scrollTrigger: { trigger: left, start: 'top 88%', once: true } 
           });
           gsap.fromTo(right, { opacity: 0, scale: 0.94 }, { 
             opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out', 
             scrollTrigger: { trigger: right, start: 'top 88%', once: true } 
           });
        } else {
           left.style.opacity = '1'; left.style.transform = 'none';
           right.style.opacity = '1'; right.style.transform = 'none';
        }
      });

      // Re-init hover effects for new visuals
      if (typeof initHoverEffects === 'function') {
        initHoverEffects();
      }

    } catch (err) {
      console.error(err);
      container.innerHTML = '<p style="color:var(--red); text-align:center; padding:var(--s-16) 0;">Failed to load systems.</p>';
    }
  }

  function init () {
    if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    revealPage();
    initScrollAnimations();
    loadServices();
    initHoverEffects();
    initLenis();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
