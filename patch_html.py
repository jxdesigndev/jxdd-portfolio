import re

with open('index.html', 'r') as f:
    html = f.read()

old_block = """          <div class="bento-item bento-aut">
             <div class="bento-header">
               <h3>Automation & Other</h3>
               <span class="bento-meta">// NETWORK_NODES</span>
             </div>
             <div class="bento-content physics-grid db-tools-container" data-tool-category="automation,other"></div>
          </div>"""

new_block = """          <div class="bento-item bento-aut">
             <div class="bento-header">
               <h3>Automation</h3>
               <span class="bento-meta">// NETWORK_NODES</span>
             </div>
             <div class="bento-content physics-grid db-tools-container" data-tool-category="automation"></div>
          </div>
          
          <div class="bento-item bento-oth">
             <div class="bento-header">
               <h3>Others</h3>
               <span class="bento-meta">// MISC_MODULES</span>
             </div>
             <div class="bento-content physics-grid db-tools-container" data-tool-category="other"></div>
          </div>"""

if old_block in html:
    html = html.replace(old_block, new_block)
    with open('index.html', 'w') as f:
        f.write(html)
    print("HTML patch applied successfully.")
else:
    print("Old block not found.")
