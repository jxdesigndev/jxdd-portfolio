#!/bin/bash
cat << 'INNER_EOF' > tools_replacement.txt
      <div class="tools-section-inner">
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
          <h3 class="reveal" style="font-size:var(--text-xs); color:var(--gray-2); letter-spacing:var(--track-widest); text-transform:uppercase; margin-bottom:var(--s-6);">Automation & DevOps</h3>
          <div class="tools-grid db-tools-container" data-tool-category="automation"></div>
        </div>

        <div class="tools-section">
          <h3 class="reveal" style="font-size:var(--text-xs); color:var(--gray-2); letter-spacing:var(--track-widest); text-transform:uppercase; margin-bottom:var(--s-6);">Security & Other</h3>
          <div class="tools-grid db-tools-container" data-tool-category="security"></div>
        </div>
      </div>
INNER_EOF

# Replace the inner block of the section in index.html
awk '/<div class="tools-section-inner">/{p=1; print; system("cat tools_replacement.txt"); next} /<\/section>/{if(p) {p=0}} !p{print}' index.html > temp.html

# Wait, awk logic will skip </section> completely or fail. Let's do it safer.
