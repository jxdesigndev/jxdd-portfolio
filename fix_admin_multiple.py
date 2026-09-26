import re

with open('admin.html', 'r') as f:
    html = f.read()

# Add CSS for the mini gallery
css_injection = """  .admin-gallery-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
  .admin-gallery-item {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: 4px;
    overflow: hidden;
    background: var(--surface-2);
  }
  .admin-gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .admin-gallery-item .btn-remove {
    position: absolute;
    top: 2px;
    right: 2px;
    background: rgba(255, 0, 0, 0.8);
    color: white;
    border: none;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    font-size: 10px;
    line-height: 16px;
    cursor: pointer;
    text-align: center;
    padding: 0;
  }
</style>"""

html = html.replace('</style>', css_injection)

# Change the preview containers to have the class
old_process = """<div id="pf-process-preview" style="margin-top:var(--s-2); font-size:var(--text-xs); color:var(--gray-2); word-break: break-all;"></div>"""
new_process = """<div id="pf-process-preview" class="admin-gallery-preview"></div>"""
html = html.replace(old_process, new_process)

old_screens = """<div id="pf-screenshots-preview" style="margin-top:var(--s-2); font-size:var(--text-xs); color:var(--gray-2); word-break: break-all;"></div>"""
new_screens = """<div id="pf-screenshots-preview" class="admin-gallery-preview"></div>"""
html = html.replace(old_screens, new_screens)

with open('admin.html', 'w') as f:
    f.write(html)
