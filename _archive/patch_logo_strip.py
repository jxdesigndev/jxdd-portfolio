import re
with open('index.html', 'r') as f:
    html = f.read()

old_logo = """        <!-- EDIT_HERE: Replace with real company logos -->
        <div id="logo-strip" class="logo-strip reveal">
          <!-- Rendered via JS -->
        </div>
        <!-- END_EDIT_HERE -->"""

new_logo = """        <!-- EDIT_HERE: Replace with real company logos -->
        <div class="marquee-wrapper">
          <div id="logo-strip" class="logo-strip reveal">
            <!-- Rendered via JS -->
          </div>
        </div>
        <!-- END_EDIT_HERE -->"""
html = html.replace(old_logo, new_logo)

with open('index.html', 'w') as f:
    f.write(html)
