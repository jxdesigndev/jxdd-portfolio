import re

with open('index.html', 'r') as f:
    content = f.read()

pattern = re.compile(r'<div class="tools-section-inner">.*?</div>\n    </section>', re.DOTALL)

replacement = """<div class="tools-section-inner">
        <div class="section-label">Built With</div>
        <h2 class="headline-lg reveal" style="max-width:600px; margin-bottom:var(--s-16);">
          The <span class="text-green">Stack</span>
        </h2>
        
        <div class="tools-section" style="margin-bottom:var(--s-16);">
          <h3 class="reveal" style="font-size:var(--text-xs); color:var(--gray-2); letter-spacing:var(--track-widest); text-transform:uppercase; margin-bottom:var(--s-6);">Design</h3>
          <div class="tools-grid db-tools-container" data-tool-category="design"></div>
        </div>

        <div class="tools-section" style="margin-bottom:var(--s-16);">
          <h3 class="reveal" style="font-size:var(--text-xs); color:var(--gray-2); letter-spacing:var(--track-widest); text-transform:uppercase; margin-bottom:var(--s-6);">Development</h3>
          <div class="tools-grid db-tools-container" data-tool-category="dev"></div>
        </div>

        <div class="tools-section" style="margin-bottom:var(--s-16);">
          <h3 class="reveal" style="font-size:var(--text-xs); color:var(--gray-2); letter-spacing:var(--track-widest); text-transform:uppercase; margin-bottom:var(--s-6);">Automation</h3>
          <div class="tools-grid db-tools-container" data-tool-category="automation"></div>
        </div>

        <div class="tools-section">
          <h3 class="reveal" style="font-size:var(--text-xs); color:var(--gray-2); letter-spacing:var(--track-widest); text-transform:uppercase; margin-bottom:var(--s-6);">Security & Other</h3>
          <div class="tools-grid db-tools-container" data-tool-category="security"></div>
        </div>
      </div>
    </section>"""

content = pattern.sub(replacement, content)

with open('index.html', 'w') as f:
    f.write(content)

