with open('about.html', 'r') as f:
    html = f.read()

import re
html = re.sub(
    r'<h2 class="cv-title">The Origin</h2>',
    '<h2 class="cv-title"><span class="cv-title-inner">The Origin</span></h2>',
    html
)
html = re.sub(
    r'<h2 class="cv-title">The Arsenal</h2>',
    '<h2 class="cv-title"><span class="cv-title-inner">The Arsenal</span></h2>',
    html
)

with open('about.html', 'w') as f:
    f.write(html)

with open('style.css', 'r') as f:
    css = f.read()

css = re.sub(
    r'\.cv-title \{.*?\n\}',
    '''.cv-title {
  font-family: var(--font-display);
  font-size: clamp(3rem, 8vw, 8rem);
  font-weight: 900;
  line-height: 1;
  color: var(--white);
  overflow: hidden; /* For masking */
}
.cv-title-inner {
  display: inline-block;
  will-change: transform;
}''',
    css,
    flags=re.DOTALL
)

with open('style.css', 'w') as f:
    f.write(css)

with open('about.js', 'r') as f:
    js = f.read()

js = js.replace(
    "gsap.fromTo('.cv-title', { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power4.out' });",
    "gsap.fromTo('.cv-title-inner', { y: 150, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power4.out' });"
)

with open('about.js', 'w') as f:
    f.write(js)
