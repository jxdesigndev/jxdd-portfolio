import sys

with open('script.js', 'r') as f:
    content = f.read()

old_block = """        if (container.classList.contains('physics-grid')) {
          // Force visibility immediately
          newNodes.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
          });"""

new_block = """        if (container.classList.contains('physics-grid')) {
          container.style.position = 'relative'; // Ensure coordinate system matches
          container.style.overflow = 'hidden';
          
          // Force absolute positioning for Matter.js coordinate sync
          newNodes.forEach(el => {
            el.style.position = 'absolute';
            el.style.top = '0';
            el.style.left = '0';
            el.style.margin = '0';
            el.style.opacity = '1';
            el.style.transform = 'none';
          });"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open('script.js', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Block not found!")

