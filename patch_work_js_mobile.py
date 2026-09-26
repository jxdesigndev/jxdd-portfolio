import re

with open('work.js', 'r') as f:
    content = f.read()

replacement = """
    const isMobile = window.innerWidth <= 768;
    const zoomScale = isMobile ? 1.05 : 2.4;
    const shiftXVH = 55 * zoomScale; 
"""

content = re.sub(
    r"const zoomScale = 2\.4;\s*const shiftXVH = 55 \* zoomScale;",
    replacement.strip(),
    content
)

with open('work.js', 'w') as f:
    f.write(content)

print("work.js patched.")
