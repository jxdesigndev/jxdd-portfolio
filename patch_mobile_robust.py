import re

with open('style.css', 'r') as f:
    css = f.read()

# Update CSS for sticky
target_css = r"/\*\s*Mobile Fallback: Stacked Deck\s*\*/\s*@media\s*\(hover:\s*none\),\s*\(max-width:\s*768px\)\s*\{\s*\.reelfolio-container\s*\{.*?\s*aspect-ratio:\s*16/9;\s*\}\s*\}"

replacement_css = """
    /* Mobile Fallback: Stacked Deck */
    @media (hover: none), (max-width: 768px) {
      .featured-section {
        height: 300vh;
      }
      .reelfolio-container {
        position: sticky;
        top: 10vh;
        height: 80vh;
        min-height: 400px;
        padding: 0;
        overflow: visible;
      }
      .reelfolio-card {
        width: 90vw;
        max-width: 380px;
        aspect-ratio: 16/9;
      }
    }
"""
css = re.sub(target_css, replacement_css.strip(), css, flags=re.DOTALL)
with open('style.css', 'w') as f:
    f.write(css)


with open('script.js', 'r') as f:
    js = f.read()

# Replace the GSAP timeline
target_js = r"// Pin and Scrub\s*const tl = gsap\.timeline\(\{.*?\}\);"

replacement_js = """
      // Native Sticky Scrub (No JS Pinning)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.featured-section',
          start: "top top",
          end: "bottom bottom", 
          scrub: true
        }
      });
"""
js = re.sub(target_js, replacement_js.strip(), js, flags=re.DOTALL)
with open('script.js', 'w') as f:
    f.write(js)

print("Robust mobile sticky patch applied.")
