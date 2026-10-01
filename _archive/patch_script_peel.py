import re

with open('script.js', 'r') as f:
    content = f.read()

target_pattern = r"if \(\!isHoverable\) \{\s*/\*\s*Mobile Scroll-Driven Lift\s*\*/.*?return;\s*\}"

replacement = """
    if (!isHoverable) {
      /* Mobile Scroll-Driven Stack Peel */
      const numCards = cards.length;
      
      // Initial Stack State
      cards.forEach((card, i) => {
        gsap.set(card, {
          xPercent: -50,
          yPercent: -50,
          y: i * 20,
          scale: 1 - i * 0.05,
          zIndex: numCards - i,
          opacity: 1 - i * 0.15
        });
      });

      // Pin and Scrub
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "center center",
          end: `+=${numCards * 60}%`, 
          scrub: true,
          pin: true
        }
      });

      // Peeling Animation
      cards.forEach((card, i) => {
        if (i < numCards - 1) {
          // Top card peels UP and fades out
          tl.to(card, {
            y: -window.innerHeight * 0.8,
            rotation: (i % 2 === 0 ? -10 : 10),
            opacity: 0,
            duration: 1,
            ease: "power1.inOut"
          }, i);

          // All cards beneath it slide up, scale up, and brighten
          for (let j = i + 1; j < numCards; j++) {
            tl.to(cards[j], {
              y: (j - i - 1) * 20,
              scale: 1 - (j - i - 1) * 0.05,
              opacity: 1 - (j - i - 1) * 0.15,
              duration: 1,
              ease: "none"
            }, i); 
          }
        }
      });

      return;
    }
"""

content = re.sub(target_pattern, replacement.strip(), content, flags=re.DOTALL)

with open('script.js', 'w') as f:
    f.write(content)

print("script.js updated with Stack Peel effect.")
