import re

with open('style.css', 'r') as f:
    content = f.read()

# Replace transform: none !important; with transform: scale(0.95); or remove it
new_mobile = """
      .reelfolio-card {
        position: relative;
        left: auto;
        top: auto;
        width: 100%;
        max-width: 380px;
        aspect-ratio: 16/9;
        /* Remove transform: none !important so GSAP scroll can animate it */
        transform: scale(0.95);
        opacity: 0.7; /* fade slightly */
        z-index: 1 !important;
        margin: 0 auto;
      }
"""

content = re.sub(r'\.reelfolio-card\s*\{\s*position:\s*relative;\s*left:\s*auto;\s*top:\s*auto;\s*width:\s*100%;\s*max-width:\s*380px;\s*aspect-ratio:\s*16/9;\s*transform:\s*none\s*!important;\s*/\*\s*GSAP override\s*\*/\s*opacity:\s*1\s*!important;\s*z-index:\s*1\s*!important;\s*\}', new_mobile.strip(), content, flags=re.MULTILINE|re.DOTALL)

with open('style.css', 'w') as f:
    f.write(content)

print("Reelfolio mobile CSS updated.")
