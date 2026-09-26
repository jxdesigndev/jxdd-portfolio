import re

with open('services.js', 'r') as f:
    content = f.read()

services_logic = """
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
"""

# Insert the function before init()
content = content.replace("  function init () {", services_logic + "\n  function init () {")

# Add loadServices() to init()
content = content.replace("    initScrollAnimations();\n    initHoverEffects();", "    initScrollAnimations();\n    loadServices();\n    initHoverEffects();")

with open('services.js', 'w') as f:
    f.write(content)
