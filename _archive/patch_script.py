import re

with open('script.js', 'r') as f:
    js = f.read()

# 1. Update loadTools filtering logic
old_filter = """        if (category && category !== 'all') {
          filteredTools = tools.filter(t => (t.category || '').toLowerCase() === category.toLowerCase());
        }"""
new_filter = """        if (category && category !== 'all') {
          const cats = category.split(',').map(c => c.trim().toLowerCase());
          filteredTools = tools.filter(t => cats.includes((t.category || '').toLowerCase()));
        }"""
js = js.replace(old_filter, new_filter)

# 2. Update loadTools DOM appending logic and add Matter.js logic
old_append = """        let allNodes = [...newNodes];
        if (container.classList.contains('marquee-track')) {
          // Clone nodes for infinite scroll
          const clones = newNodes.map(n => n.cloneNode(true));
          clones.forEach(c => { container.appendChild(c); allNodes.push(c); });
          
          const clones2 = newNodes.map(n => n.cloneNode(true));
          clones2.forEach(c => { container.appendChild(c); allNodes.push(c); });
          
          // Force immediate visibility for marquee items (skip GSAP stagger to avoid scrolling invisible items)
          allNodes.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
          });
        } else {
          /* Animate Normal Grids */
          if (window.gsap && window.ScrollTrigger) {
            allNodes.forEach((el, i) => {
              gsap.fromTo(el, { opacity: 0, scale: 0.92 }, {
                opacity: 1, scale: 1,
                duration: 0.7,
                delay: i * 0.04,
                ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 90%', once: true }
              });
            });
            ScrollTrigger.refresh();
          } else {
            allNodes.forEach(el => {
              el.style.opacity   = '1';
              el.style.transform = 'none';
            });
          }
        }"""

new_append = """        // Matter.js Physics implementation
        if (container.classList.contains('physics-grid')) {
          // Force visibility immediately
          newNodes.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
          });
          
          if (window.Matter && newNodes.length > 0) {
            const Engine = Matter.Engine,
                  Render = Matter.Render,
                  Runner = Matter.Runner,
                  Bodies = Matter.Bodies,
                  Composite = Matter.Composite,
                  Mouse = Matter.Mouse,
                  MouseConstraint = Matter.MouseConstraint,
                  Events = Matter.Events;

            const engine = Engine.create();
            const world = engine.world;
            
            // Container dimensions
            const rect = container.getBoundingClientRect();
            const width = rect.width || 400;
            const height = rect.height || 240;

            // Walls (invisible)
            const wallOpts = { isStatic: true, render: { visible: false } };
            const floor = Bodies.rectangle(width/2, height + 25, width*2, 50, wallOpts);
            const leftWall = Bodies.rectangle(-25, height/2, 50, height*2, wallOpts);
            const rightWall = Bodies.rectangle(width + 25, height/2, 50, height*2, wallOpts);
            const ceiling = Bodies.rectangle(width/2, -100, width*2, 50, wallOpts);
            
            Composite.add(world, [floor, leftWall, rightWall, ceiling]);

            const bodyMap = [];
            const size = 64; // Approximated box size for tool

            newNodes.forEach((node, i) => {
               // Random start position near top
               const startX = (width / 2) + (Math.random() * 100 - 50);
               const startY = Math.random() * -100 - 50;
               const body = Bodies.rectangle(startX, startY, size, size, {
                   restitution: 0.6, // Bounciness
                   friction: 0.1,
                   density: 0.04
               });
               bodyMap.push({ body, node });
               Composite.add(world, body);
            });

            // Add Mouse Control
            const mouse = Mouse.create(container);
            const mouseConstraint = MouseConstraint.create(engine, {
                mouse: mouse,
                constraint: {
                    stiffness: 0.2,
                    render: { visible: false }
                }
            });
            Composite.add(world, mouseConstraint);

            // Sync DOM elements with Physics bodies
            Events.on(engine, 'afterUpdate', function() {
                bodyMap.forEach(({ body, node }) => {
                    const x = body.position.x - size/2;
                    const y = body.position.y - size/2;
                    // Apply position and rotation
                    node.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
                });
            });

            // Run Physics
            Runner.run(Runner.create(), engine);
          }
        }"""
js = js.replace(old_append, new_append)


# 3. Smart Toggle Testimonials
old_testm_clone = """      // Clone for infinite marquee
      if (grid.classList.contains('testimonials-bento-track')) {
        const clones1 = cardNodes.map(n => {
          const clone = n.cloneNode(true);
          const bq = clone.querySelector('blockquote');
          if (bq) clone.addEventListener('mouseenter', () => scrambleText(bq, bq.dataset.value));
          return clone;
        });
        clones1.forEach(c => grid.appendChild(c));
        
        const clones2 = cardNodes.map(n => {
          const clone = n.cloneNode(true);
          const bq = clone.querySelector('blockquote');
          if (bq) clone.addEventListener('mouseenter', () => scrambleText(bq, bq.dataset.value));
          return clone;
        });
        clones2.forEach(c => grid.appendChild(c));
      }"""

new_testm_clone = """      // Smart Toggle: Clone for infinite marquee ONLY if items overflow the container
      if (grid.classList.contains('testimonials-bento-track')) {
        setTimeout(() => {
          const wrapper = document.getElementById('testimonials-marquee-wrapper');
          let totalWidth = 0;
          cardNodes.forEach(node => totalWidth += node.offsetWidth + 12); // include gap
          
          if (totalWidth > wrapper.offsetWidth) {
            // Enable scrolling and cloning
            const clones1 = cardNodes.map(n => {
              const clone = n.cloneNode(true);
              const bq = clone.querySelector('blockquote');
              if (bq) clone.addEventListener('mouseenter', () => scrambleText(bq, bq.dataset.value));
              return clone;
            });
            clones1.forEach(c => grid.appendChild(c));
            
            const clones2 = cardNodes.map(n => {
              const clone = n.cloneNode(true);
              const bq = clone.querySelector('blockquote');
              if (bq) clone.addEventListener('mouseenter', () => scrambleText(bq, bq.dataset.value));
              return clone;
            });
            clones2.forEach(c => grid.appendChild(c));
          } else {
            // Disable marquee animation, center items
            grid.style.animation = 'none';
            grid.style.justifyContent = 'center';
            grid.style.width = '100%';
          }
        }, 100);
      }"""
js = js.replace(old_testm_clone, new_testm_clone)

# 4. Smart Toggle Logos
old_logos = """      /* Render logo strip */
      logoStrip.innerHTML = '';
      testimonials.forEach(t => {
        if (t.logo_url) {
          const img = document.createElement('img');
          img.src = t.logo_url;
          img.alt = t.role_company || 'Company Logo';
          img.loading = 'lazy';
          
          if (t.client_website_url) {
            const a = document.createElement('a');
            a.href = t.client_website_url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.appendChild(img);
            logoStrip.appendChild(a);
          } else {
            logoStrip.appendChild(img);
          }
        }
      });"""

new_logos = """      /* Render logo strip */
      logoStrip.innerHTML = '';
      const logoNodes = [];
      testimonials.forEach(t => {
        if (t.logo_url) {
          const img = document.createElement('img');
          img.src = t.logo_url;
          img.alt = t.role_company || 'Company Logo';
          img.loading = 'lazy';
          
          if (t.client_website_url) {
            const a = document.createElement('a');
            a.href = t.client_website_url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.appendChild(img);
            logoStrip.appendChild(a);
            logoNodes.push(a);
          } else {
            logoStrip.appendChild(img);
            logoNodes.push(img);
          }
        }
      });
      
      // Smart Toggle for Logo Strip
      setTimeout(() => {
         let totalLogoWidth = 0;
         logoNodes.forEach(n => totalLogoWidth += n.offsetWidth + 16); // including gap
         if (totalLogoWidth > logoStrip.parentElement.offsetWidth) {
             logoStrip.classList.add('marquee-track');
             logoStrip.style.flexWrap = 'nowrap';
             const clones = logoNodes.map(n => n.cloneNode(true));
             clones.forEach(c => logoStrip.appendChild(c));
         } else {
             logoStrip.style.justifyContent = 'center';
             logoStrip.classList.remove('marquee-track');
         }
      }, 100);"""
js = js.replace(old_logos, new_logos)

with open('script.js', 'w') as f:
    f.write(js)
