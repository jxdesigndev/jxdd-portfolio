export function attach(universe) {
  universe.loadTestimonials = () {
    const section = document.getElementById('testimonials-section');
    const grid = document.getElementById('testimonials-grid');
    const logoStrip = document.getElementById('logo-strip');
    
    if (!section || !grid || !logoStrip) return;

    try {
      if (window.initSupabase) await window.initSupabase();
    } catch (err) {
      console.warn("Supabase init failed", err);
    }
    if (typeof supabase === 'undefined' || !supabase.from) return;

    try {
      const { data: testimonials, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      if (!testimonials || testimonials.length === 0) {
        section.style.display = 'none';
        return;
      }

      /* Render logo strip */
      logoStrip.innerHTML = '';
      const logoNodes = [];
      testimonials.forEach(t => {
        if (t.logo_url) {
          const img = document.createElement('img');
          img.src = t.logo_url;
          img.alt = t.role_company || 'Company Logo';
          
          
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
      }, 100);

      /* Render testimonials grid */
      grid.innerHTML = '';
      
      function scrambleText(element, originalText) {
        if (element.dataset.scrambling === 'true') return;
        element.dataset.scrambling = 'true';
        let iterations = 0;
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        const interval = setInterval(() => {
          element.textContent = originalText.split("").map((letter, index) => {
            if(index < Math.floor(iterations)) {
              return originalText[index];
            }
            return letters[Math.floor(Math.random() * letters.length)]
          }).join("");
          if(iterations >= originalText.length) {
            clearInterval(interval);
            element.dataset.scrambling = 'false';
            element.textContent = originalText;
          }
          iterations += 1/2; // Smoother decrypt reveal
        }, 20);
      }

      const cardNodes = [];
      testimonials.forEach((t) => {
        const card = document.createElement('div');
        card.className = 'testimonial-card secure-log';

        if (t.video_url) {
          const video = document.createElement('video');
          video.className = 'testimonial-video';
          video.src = t.video_url;
          if (t.photo_url) video.poster = t.photo_url;
          video.controls = true;
          video.preload = 'metadata';
          card.appendChild(video);
        } else {
          const blockquote = document.createElement('blockquote');
          blockquote.className = 'testimonial-quote';
          blockquote.dataset.value = `"${t.quote_text}"`;
          blockquote.textContent = `"${t.quote_text}"`;
          card.appendChild(blockquote);
          
          card.addEventListener('mouseenter', () => scrambleText(blockquote, blockquote.dataset.value));
        }

        const meta = document.createElement('div');
        meta.className = 'testimonial-meta';
        
        const author = document.createElement('div');
        author.className = 'testimonial-author';
        author.textContent = t.name;

        const role = document.createElement('div');
        role.className = 'testimonial-role';
        role.textContent = t.role_company;

        meta.appendChild(author);
        meta.appendChild(role);
        card.appendChild(meta);

        grid.appendChild(card);
        cardNodes.push(card);
      });
      
      // Smart Toggle: Clone for infinite marquee ONLY if items overflow the container
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
      }

      /* Trigger GSAP if ready */
      if (window.gsap && window.ScrollTrigger) {
        const reveals = grid.querySelectorAll('.reveal-scale');
        reveals.forEach(el => {
          gsap.fromTo(el, { opacity: 0, scale: 0.92 }, {
            opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true }
          });
        });
        ScrollTrigger.refresh();
      } else {
        /* Fallback to visible if GSAP missing */
        const reveals = grid.querySelectorAll('.reveal-scale');
        reveals.forEach(el => {
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
      }
    } catch (err) {
      console.error('JX: Testimonials load error:', err);
      section.style.display = 'none';
    }
  };

}
