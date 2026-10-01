import re

with open('about.html', 'r') as f:
    html = f.read()

# Add image to Origin
origin_target = """          <div class="ed-card">
            <h3>The Pivot</h3>
            <p>Design wasn't enough. Code wasn't enough. I realized that the true power lay in the intersection—Product Engineering. I didn't just want to paint the interface; I wanted to wire the explosive logic behind it.</p>
          </div>
        </div>"""
origin_replacement = origin_target + """\n        <img src="assets/images/okezie-1.webp" class="ed-image-full reveal-up" alt="Workspace" style="width:100%; height:auto; margin-top:3rem; border-radius:4px; filter:grayscale(100%); transition:filter 0.5s;">"""

# Add image to Philosophy
phil_target = """          <div class="ed-card">
            <h3>Unapologetic Excellence</h3>
            <p>We don't ship "good enough". If it doesn't drop jaws, it doesn't deploy.</p>
          </div>
        </div>"""
phil_replacement = phil_target + """\n        <img src="assets/images/okezie-designer.webp" class="ed-image-full reveal-up" alt="Vision" style="width:100%; height:auto; margin-top:3rem; border-radius:4px; filter:grayscale(100%); transition:filter 0.5s;">"""

html = html.replace(origin_target, origin_replacement)
html = html.replace(phil_target, phil_replacement)

with open('about.html', 'w') as f:
    f.write(html)
print("Images patched.")
