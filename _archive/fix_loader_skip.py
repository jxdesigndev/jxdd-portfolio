import re

with open('style.css', 'r') as f:
    content = f.read()

replacement = """
.loader-skip:hover {
  color: var(--green);
}

@media (max-width: 768px) {
  .loader-skip {
    bottom: calc(var(--s-16) + env(safe-area-inset-bottom, 0px));
  }
}
"""

content = content.replace('.loader-skip:hover {\n  color: var(--green);\n}', replacement.strip())

with open('style.css', 'w') as f:
    f.write(content)
