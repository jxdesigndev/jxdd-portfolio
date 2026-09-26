import re

with open('script.js', 'r') as f:
    js = f.read()

old_testm = """      /* Render testimonials grid */
      grid.innerHTML = '';
      testimonials.forEach((t, index) => {
        const card = document.createElement('div');
        card.className = 'testimonial-card reveal-scale';
        if (index > 0) card.style.transitionDelay = (index * 0.1) + 's';

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
          blockquote.textContent = `"${t.quote_text}"`;
          card.appendChild(blockquote);
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
      });

      /* Trigger GSAP if ready */"""

new_testm = """      /* Render testimonials grid */
      grid.innerHTML = '';
      
      function scrambleText(element, originalText) {
        let iterations = 0;
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        const interval = setInterval(() => {
          element.textContent = originalText.split("").map((letter, index) => {
            if(index < iterations) {
              return originalText[index];
            }
            return letters[Math.floor(Math.random() * letters.length)]
          }).join("");
          if(iterations >= originalText.length) {
            clearInterval(interval);
          }
          iterations += 1;
        }, 15);
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
      
      // Clone for infinite marquee
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
      }

      /* Trigger GSAP if ready */"""

js = js.replace(old_testm, new_testm)

with open('script.js', 'w') as f:
    f.write(js)
