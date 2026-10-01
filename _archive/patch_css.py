import re

with open('style.css', 'r') as f:
    content = f.read()

# Replace .viscose-center-text
new_css = """
.viscose-center-text {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  z-index: 1;
  pointer-events: none;
}

.viscose-headline {
  font-family: var(--font-display);
  font-size: clamp(3rem, 5.5vw, 5rem);
  font-weight: 800;
  line-height: 1.1;
  margin: 0;
  color: var(--white);
}
"""

content = re.sub(r'\.viscose-center-text\s*\{[^}]*\}', new_css.strip(), content)

with open('style.css', 'w') as f:
    f.write(content)

print("CSS updated.")
