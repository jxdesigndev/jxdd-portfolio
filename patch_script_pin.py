import re

with open('script.js', 'r') as f:
    content = f.read()

content = content.replace("pin: true", "pin: true, pinType: window.JXLenis ? 'transform' : 'fixed'")

with open('script.js', 'w') as f:
    f.write(content)

print("Pin type patched.")
