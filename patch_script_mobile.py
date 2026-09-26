import re

with open('script.js', 'r') as f:
    content = f.read()

replacement = """
  initVaultHover () {
    if (!window.gsap) return;

    const container = document.getElementById('featured-grid');
    if (!container) return;
    
    const cards = Array.from(container.querySelectorAll('.reelfolio-card'));
    if (!cards.length) return;

    const isHoverable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (!isHoverable) {
      /* Mobile Scroll-Driven Lift */
      cards.forEach(card => {
        gsap.to(card, {
          scale: 1.05,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 70%",
            end: "bottom 30%",
            toggleActions: "play reverse play reverse"
          }
        });
      });
      return;
    }

    const numCards = cards.length;
    let activeIndex = -1;

    // Securely center all absolute cards
    cards.forEach(card => gsap.set(card, { xPercent: -50, yPercent: -50 }));
"""

content = re.sub(
    r"initVaultHover\s*\(\)\s*\{[\s\S]*?cards\.forEach\(card => gsap\.set\(card,\s*\{\s*xPercent:\s*-50,\s*yPercent:\s*-50\s*\}\)\);",
    replacement.strip(),
    content,
    count=1
)

with open('script.js', 'w') as f:
    f.write(content)

print("script.js patched for mobile hover equivalent.")
