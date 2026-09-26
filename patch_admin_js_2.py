import re

with open('admin.js', 'r') as f:
    content = f.read()

# Add loadServices to showDashboard
old_show = """    loadTestimonials();
    loadTools();
  }"""
new_show = """    loadTestimonials();
    loadTools();
    loadServices();
  }"""
content = content.replace(old_show, new_show)

with open('admin.js', 'w') as f:
    f.write(content)
