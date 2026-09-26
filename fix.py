with open('about.html', 'r') as f:
    html = f.read()

import re
html = re.sub(
    r'<div class="philosophy-kinetic-container">.*?</div>\s*</section>',
    '''<div class="philosophy-kinetic-container">
        <div class="kinetic-sticky">
          <div class="kinetic-text">I wanted to showcase myself.</div>
          <div class="kinetic-text">To show people who I am.</div>
          <div class="kinetic-text">JX isn't a brand;</div>
          <div class="kinetic-text">It's a <span class="glow">universe.</span></div>
        </div>
      </div>
    </section>''',
    html,
    flags=re.DOTALL
)

with open('about.html', 'w') as f:
    f.write(html)
