import re

with open('index.html', 'r') as f:
    html = f.read()

# 1. Update Tools Section
old_tools = """        <div class="tools-group" style="margin-bottom:var(--s-16);">
          <h3 class="reveal" style="font-size:var(--text-xs); color:var(--gray-2); letter-spacing:var(--track-widest); text-transform:uppercase; margin-bottom:var(--s-6);">Design</h3>
          <div class="tools-grid db-tools-container" style="margin-top:var(--s-4);" data-tool-category="design"></div>
        </div>

        <div class="tools-group" style="margin-bottom:var(--s-16);">
          <h3 class="reveal" style="font-size:var(--text-xs); color:var(--gray-2); letter-spacing:var(--track-widest); text-transform:uppercase; margin-bottom:var(--s-6);">Development</h3>
          <div class="tools-grid db-tools-container" style="margin-top:var(--s-4);" data-tool-category="dev"></div>
        </div>

        <div class="tools-group" style="margin-bottom:var(--s-16);">
          <h3 class="reveal" style="font-size:var(--text-xs); color:var(--gray-2); letter-spacing:var(--track-widest); text-transform:uppercase; margin-bottom:var(--s-6);">Automation</h3>
          <div class="tools-grid db-tools-container" style="margin-top:var(--s-4);" data-tool-category="automation"></div>
        </div>

        <div class="tools-group">
          <h3 class="reveal" style="font-size:var(--text-xs); color:var(--gray-2); letter-spacing:var(--track-widest); text-transform:uppercase; margin-bottom:var(--s-6);">Security & Other</h3>
          <div class="tools-grid db-tools-container" style="margin-top:var(--s-4);" data-tool-category="security"></div>
        </div>"""

new_tools = """        <div class="bento-grid" id="bento-grid-tools">
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

if old_tools in html:
    html = html.replace(old_tools, new_tools)
else:
    print("Failed to find old tools block!")


# 2. Update Testimonials Section
old_testm = """        <!-- EDIT_HERE: Replace testimonials. Supports either text quote or video -->
        <div id="testimonials-grid" class="testimonials-grid">
          <!-- Rendered via JS -->
        </div>
        <!-- END_EDIT_HERE -->"""

new_testm = """        <!-- BENTO TESTIMONIALS WALL -->
        <div class="bento-marquee-wrapper" id="testimonials-marquee-wrapper">
          <div class="testimonials-bento-track" id="testimonials-grid">
            <!-- Rendered via JS -->
          </div>
        </div>
        <!-- END BENTO -->"""

if old_testm in html:
    html = html.replace(old_testm, new_testm)
else:
    print("Failed to find old testimonials block!")


with open('index.html', 'w') as f:
    f.write(html)
