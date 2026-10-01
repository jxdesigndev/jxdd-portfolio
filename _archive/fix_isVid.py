import re

with open('script.js', 'r') as f:
    script_js = f.read()

script_js = script_js.replace("  renderProjectCard (p, i) {\n    const imagePart = p.image_url", "  renderProjectCard (p, i) {\n    const isVid = p.image_url && (p.image_url.toLowerCase().endsWith('.mp4') || p.image_url.toLowerCase().endsWith('.webm'));\n    const imagePart = p.image_url")
with open('script.js', 'w') as f:
    f.write(script_js)

with open('work.js', 'r') as f:
    work_js = f.read()

work_js = work_js.replace("  function renderCard (p) {\n    const img   = p.image_url", "  function renderCard (p) {\n    const isVid = p.image_url && (p.image_url.toLowerCase().endsWith('.mp4') || p.image_url.toLowerCase().endsWith('.webm'));\n    const img   = p.image_url")
with open('work.js', 'w') as f:
    f.write(work_js)

