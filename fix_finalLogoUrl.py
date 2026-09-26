with open('admin.js', 'r') as f:
    js = f.read()

target = """    try {
      const payload = {"""

replacement = """    try {
      let finalLogoUrl = null;
      const logoFile = document.getElementById('ef-logo-file') ? document.getElementById('ef-logo-file').files[0] : null;
      if (logoFile) {
        finalLogoUrl = await uploadMedia(logoFile);
      } else if (document.getElementById('ef-logo-preview')) {
        finalLogoUrl = document.getElementById('ef-logo-preview').dataset.existingUrl || null;
      }

      const payload = {"""

js = js.replace(target, replacement)

with open('admin.js', 'w') as f:
    f.write(js)

print("Fixed reference error.")
