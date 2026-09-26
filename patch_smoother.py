import re

with open('script.js', 'r') as f:
    js = f.read()

# Replace the initial state setup
target_initial = r"cards\.forEach\(\(card, i\) => \{\s*gsap\.set\(card, \{\s*xPercent: -50,\s*yPercent: -50,\s*y: i \* 20,\s*scale: 1 - i \* 0\.05,\s*zIndex: numCards - i,\s*opacity: 1 - i \* 0\.15\s*\}\);\s*\}\);"

replacement_initial = """
      // Initial Stack State (Deeper, more elegant spacing)
      cards.forEach((card, i) => {
        gsap.set(card, {
          xPercent: -50,
          yPercent: -50,
          y: i * 25,
          scale: 1 - i * 0.06,
          zIndex: numCards - i,
          opacity: 1 - i * 0.2
        });
      });
"""
js = re.sub(target_initial, replacement_initial.strip(), js, flags=re.DOTALL)


# Replace the scrub timeline
target_timeline = r"const tl = gsap\.timeline\(\{\s*scrollTrigger: \{\s*trigger: '\.featured-section',\s*start: \"top top\",\s*end: \"bottom bottom\", \s*scrub: true\s*\}\s*\}\);"

replacement_timeline = """
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.featured-section',
          start: "top top",
          end: "bottom bottom", 
          scrub: 1 // Adds luxurious fluid momentum to the scroll
        }
      });
"""
js = re.sub(target_timeline, replacement_timeline.strip(), js, flags=re.DOTALL)


# Replace the peeling animation
target_peel = r"// Peeling Animation.*?(?=\s*return;)"

replacement_peel = """
      // Smoother Peeling Animation
      cards.forEach((card, i) => {
        if (i < numCards - 1) {
          // Top card peels UP, slightly sideways, and fades out
          tl.to(card, {
            y: -window.innerHeight * 0.8,
            x: (i % 2 === 0 ? -40 : 40), // Gentle horizontal drift
            rotation: (i % 2 === 0 ? -5 : 5), // Softer, more elegant rotation
            opacity: 0,
            duration: 1,
            ease: "power2.inOut" // Silkier easing
          }, i);

          // All cards beneath it elegantly slide up and brighten
          for (let j = i + 1; j < numCards; j++) {
            tl.to(cards[j], {
              y: (j - i - 1) * 25,
              scale: 1 - (j - i - 1) * 0.06,
              opacity: 1 - (j - i - 1) * 0.2,
              duration: 1,
              ease: "power2.inOut" // Match the top card's smoothness
            }, i); 
          }
        }
      });
"""
js = re.sub(target_peel, replacement_peel.strip(), js, flags=re.DOTALL)

with open('script.js', 'w') as f:
    f.write(js)

print("Smoother animation applied.")
