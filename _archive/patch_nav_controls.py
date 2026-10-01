import re

with open('nav.js', 'r') as f:
    content = f.read()

content = content.replace("videoEl.setAttribute('playsinline', '');", "videoEl.setAttribute('playsinline', '');\n      if (!videoEl.hasAttribute('controls')) videoEl.setAttribute('controls', '');")

with open('nav.js', 'w') as f:
    f.write(content)
