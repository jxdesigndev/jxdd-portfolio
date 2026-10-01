import re

with open('script.js', 'r') as f:
    content = f.read()

target = r"if \(\!isHoverable\) \{"

replacement = """
    if (!isHoverable) {
      if (!window.ScrollTrigger) {
        setTimeout(() => this.initVaultHover(), 100);
        return;
      }
"""

content = re.sub(target, replacement.strip(), content, count=1)

with open('script.js', 'w') as f:
    f.write(content)

print("Race condition patched.")
