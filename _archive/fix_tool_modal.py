import re

with open('admin.js', 'r') as f:
    js = f.read()

old_tool = """  function openToolModal(tool) {
    if (!DOM.toolForm) return;
    DOM.toolForm.reset();
    document.getElementById('tlf-logo-preview').value = '';

    if (tool) {
      DOM.toolModalTitle.textContent = 'Edit Tool';
      document.getElementById('tlf-id').value = tool.id;
      document.getElementById('tlf-name').value = tool.name || '';
      document.getElementById('tlf-category').value = tool.category || '';
      document.getElementById('tlf-priority').value = tool.priority || 0;
      document.getElementById('tlf-active').checked = tool.is_active !== false;
      document.getElementById('tlf-logo-preview').value = tool.logo_url || '';
      DOM.btnDeleteTool.style.display = 'block';"""

new_tool = """  function openToolModal(tool) {
    if (!DOM.toolForm) return;
    DOM.toolForm.reset();
    currentEditingToolLogo = null;
    document.getElementById('tlf-logo-preview').innerHTML = '';

    if (tool) {
      DOM.toolModalTitle.textContent = 'Edit Tool';
      document.getElementById('tlf-id').value = tool.id;
      document.getElementById('tlf-name').value = tool.name || '';
      document.getElementById('tlf-category').value = tool.category || '';
      document.getElementById('tlf-priority').value = tool.priority || 0;
      document.getElementById('tlf-active').checked = tool.is_active !== false;
      currentEditingToolLogo = tool.logo_url || null;
      renderSingleGallery('tlf-logo-preview', currentEditingToolLogo, 'toolLogo');
      DOM.btnDeleteTool.style.display = 'block';"""

js = js.replace(old_tool, new_tool)

with open('admin.js', 'w') as f:
    f.write(js)
