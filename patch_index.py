import re

with open('index.html', 'r') as f:
    html = f.read()

# 1. Add Matter.js CDN
if 'matter-js' not in html:
    html = html.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" defer></script>',
                        '<script src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js" defer></script>\n  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" defer></script>')

# 2. Update Bento HTML to remove tool marquees and add physics-grid
old_bento = """        <div class="bento-grid" id="bento-grid-tools">
          <div class="bento-item bento-dev">
            <div class="bento-header">
              <h3>Development</h3>
              <span class="bento-meta">// THE_ENGINE_ROOM</span>
            </div>
            <div class="marquee-wrapper">
              <div class="marquee-track db-tools-container" data-tool-category="dev"></div>
            </div>
          </div>

          <div class="bento-item bento-sec">
             <div class="bento-header">
               <h3>Security</h3>
               <span class="bento-meta">// THE_VAULT</span>
             </div>
             <div class="bento-content radar-scan db-tools-container" data-tool-category="security"></div>
          </div>

          <div class="bento-item bento-des">
             <div class="bento-header">
               <h3>Design</h3>
               <span class="bento-meta">// CREATIVE_STUDIO</span>
             </div>
             <div class="bento-content float-grid db-tools-container" data-tool-category="design"></div>
          </div>

          <div class="bento-item bento-aut">
             <div class="bento-header">
               <h3>Automation & Other</h3>
               <span class="bento-meta">// NETWORK_NODES</span>
             </div>
             <div class="bento-content nodes-grid db-tools-container" data-tool-category="automation"></div>
          </div>
        </div>"""

new_bento = """        <div class="bento-grid" id="bento-grid-tools">
          <div class="bento-item bento-dev">
            <div class="bento-header">
              <h3>Development</h3>
              <span class="bento-meta">// THE_ENGINE_ROOM</span>
            </div>
            <div class="bento-content physics-grid db-tools-container" data-tool-category="dev"></div>
          </div>

          <div class="bento-item bento-sec">
             <div class="bento-header">
               <h3>Security</h3>
               <span class="bento-meta">// THE_VAULT</span>
             </div>
             <div class="bento-content physics-grid db-tools-container" data-tool-category="security"></div>
          </div>

          <div class="bento-item bento-des">
             <div class="bento-header">
               <h3>Design</h3>
               <span class="bento-meta">// CREATIVE_STUDIO</span>
             </div>
             <div class="bento-content physics-grid db-tools-container" data-tool-category="design"></div>
          </div>

          <div class="bento-item bento-aut">
             <div class="bento-header">
               <h3>Automation & Other</h3>
               <span class="bento-meta">// NETWORK_NODES</span>
             </div>
             <div class="bento-content physics-grid db-tools-container" data-tool-category="automation,other"></div>
          </div>
        </div>"""

if old_bento in html:
    html = html.replace(old_bento, new_bento)

with open('index.html', 'w') as f:
    f.write(html)
