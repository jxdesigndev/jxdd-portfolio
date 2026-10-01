import re

with open('admin.html', 'r') as f:
    content = f.read()

# Add nav button
old_nav = """        <button class="admin-nav-btn" data-tab="tools">06 // STACK (Tools)</button>
      </nav>"""
new_nav = """        <button class="admin-nav-btn" data-tab="tools">06 // STACK (Tools)</button>
        <button class="admin-nav-btn" data-tab="services">07 // SYSTEMS (Services)</button>
      </nav>"""
content = content.replace(old_nav, new_nav)

# Add tab section
tab_html = """
      <!-- ── TAB: SERVICES ── -->
      <section id="tab-services" class="admin-tab-content" style="display:none;">
        <header class="admin-header">
          <h1 class="headline-md">Systems (Services)</h1>
          <button id="btn-new-service" class="btn btn-primary btn-sm">+ Add Service</button>
        </header>

        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th style="width:50px;">Pri</th>
                <th>Name</th>
                <th>Category</th>
                <th style="width:80px; text-align:center;">Active</th>
                <th style="width:120px; text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="tbody-services">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
      </section>
"""
content = content.replace("    </main>", tab_html + "    </main>")

# Add modal section
modal_html = """
    <!-- ── SERVICES MODAL ── -->
    <div id="service-modal-overlay" class="admin-modal-overlay">
      <div class="admin-modal">
        <div class="admin-modal-header">
          <h2 id="service-modal-title" class="headline-sm">Add Service</h2>
          <button id="service-modal-close" class="btn btn-ghost btn-sm">✕</button>
        </div>
        <form id="service-form" class="admin-modal-body">
          <input type="hidden" id="sv-id">
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="sv-name">Name *</label>
              <input type="text" id="sv-name" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="sv-tool-category">Tool Category</label>
              <select id="sv-tool-category" class="form-input">
                <option value="">None</option>
                <option value="design">Design</option>
                <option value="dev">Development</option>
                <option value="automation">Automation</option>
                <option value="security">Security & Other</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="sv-desc">Description</label>
            <textarea id="sv-desc" class="form-textarea" rows="4"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="sv-deliverables">Deliverables (comma separated)</label>
            <input type="text" id="sv-deliverables" class="form-input" placeholder="Wireframing, UI Design, Prototyping">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="sv-icon">Text Icon</label>
              <input type="text" id="sv-icon" class="form-input" placeholder="◈">
            </div>
            <div class="form-group">
              <label class="form-label" for="sv-label">Code Label</label>
              <input type="text" id="sv-label" class="form-input" placeholder="// DESIGN_SYSTEM_LOADED">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="sv-image">Poster Image (single)</label>
            <input type="file" id="sv-image" class="form-input" accept="image/*">
            <div id="sv-image-preview" style="margin-top:var(--s-2); font-size:var(--text-xs); color:var(--gray-2); word-break: break-all;"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="sv-video">Demo Video (single, mp4/webm)</label>
            <input type="file" id="sv-video" class="form-input" accept="video/mp4,video/webm">
            <div id="sv-video-preview" style="margin-top:var(--s-2); font-size:var(--text-xs); color:var(--gray-2); word-break: break-all;"></div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="sv-priority">Sort Priority</label>
              <input type="number" id="sv-priority" class="form-input" value="0">
            </div>
            <div class="form-group" style="flex-direction:row; align-items:center; gap:var(--s-3); margin-top:30px;">
              <input type="checkbox" id="sv-active" style="width:18px; height:18px; accent-color:var(--green); cursor:pointer;" checked>
              <label class="form-label" for="sv-active" style="margin:0; cursor:pointer;">Is Active</label>
            </div>
          </div>

          <div class="admin-modal-actions">
            <button type="button" id="btn-delete-service" class="btn btn-ghost btn-sm" style="color:var(--red); display:none;">Delete_Service</button>
            <div style="flex:1;"></div>
            <button type="submit" class="btn btn-primary btn-sm">Save_To_Systems ↗</button>
          </div>
        </form>
      </div>
    </div>
"""
content = content.replace("  </div> <!-- /admin-layout -->", modal_html + "\n  </div> <!-- /admin-layout -->")

with open('admin.html', 'w') as f:
    f.write(content)
