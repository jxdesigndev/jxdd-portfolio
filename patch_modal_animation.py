import re

with open('about-dbx.js', 'r') as f:
    js = f.read()

target = """    cell.addEventListener('click', () => {
      const targetId = cell.getAttribute('data-target');
      const modal = document.getElementById(targetId);
      if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden'; // prevent bg scroll
      }
    });"""

replacement = """    cell.addEventListener('click', () => {
      const targetId = cell.getAttribute('data-target');
      const modal = document.getElementById(targetId);
      if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden'; // prevent bg scroll
        
        // Staggered fade-in for the cards inside this specific modal
        const cards = modal.querySelectorAll('.ed-card, .ed-image-full');
        gsap.fromTo(cards, 
          { y: 30, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.2 }
        );
      }
    });"""

js = js.replace(target, replacement)

with open('about-dbx.js', 'w') as f:
    f.write(js)

print("Patched interior modal staggered animations.")
