with open('about.js', 'r') as f:
    js = f.read()

import re
js = re.sub(
    r"tl\.to\('\.hub-logo', \{ scale: 0\.2, y: -20, duration: 1, ease: 'power2\.inOut' \}, 0\);",
    "tl.to('.hub-logo', { scale: 0.15, y: '-35vh', duration: 1, ease: 'power2.inOut' }, 0);",
    js
)

with open('about.js', 'w') as f:
    f.write(js)
