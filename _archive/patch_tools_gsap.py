import re

with open('script.js', 'r') as f:
    js = f.read()

old_logic = """        if (container.classList.contains('marquee-track')) {
          // Clone nodes for infinite scroll
          const clones = newNodes.map(n => n.cloneNode(true));
          clones.forEach(c => container.appendChild(c));
          // Add second set just in case the track is short
          const clones2 = newNodes.map(n => n.cloneNode(true));
          clones2.forEach(c => container.appendChild(c));
        }

        /* Animate */
        if (window.gsap && window.ScrollTrigger) {
          newNodes.forEach((el, i) => {
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
          newNodes.forEach(el => {
            el.style.opacity   = '1';
            el.style.transform = 'none';
          });
        }"""

new_logic = """        let allNodes = [...newNodes];
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

js = js.replace(old_logic, new_logic)

with open('script.js', 'w') as f:
    f.write(js)
