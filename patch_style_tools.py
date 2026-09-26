import re

with open('style.css', 'r') as f:
    css = f.read()

old_css = """.tool-item img {
  width: clamp(32px, 5vw, 56px);
  height: clamp(32px, 5vw, 56px);
  object-fit: contain;
  border-radius: var(--radius-md);
  filter: grayscale(30%) brightness(0.9);
  transition: filter 0.3s ease, transform 0.3s ease;
}
.tool-item:hover img {
  filter: grayscale(0%) brightness(1);
  transform: scale(1.1);
}"""

new_css = """.tool-item img {
  width: clamp(48px, 8vw, 80px);
  height: clamp(48px, 8vw, 80px);
  object-fit: contain;
  border-radius: var(--radius-md);
  filter: grayscale(30%) brightness(0.9);
  transition: filter 0.3s ease, transform 0.3s ease, drop-shadow 0.3s ease;
}
.tool-item:hover img {
  filter: grayscale(0%) brightness(1.1) drop-shadow(0 0 16px rgba(0, 255, 170, 0.4));
  transform: scale(1.15) translateY(-4px);
}"""

css = css.replace(old_css, new_css)

with open('style.css', 'w') as f:
    f.write(css)
