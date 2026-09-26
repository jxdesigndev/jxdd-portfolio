with open('style.css', 'r') as f:
    content = f.read()

old_block = """/* Make tool items position absolute for Matter.js sync */
.physics-grid .tool-item {
  position: absolute;
  top: 0;
  left: 0;
  margin: 0;
  cursor: grab;
  /* Matter.js calculates transform, so we remove transition to prevent lag */
  transition: none !important; 
  opacity: 1 !important; /* Force visibility immediately */
}
.physics-grid .tool-item:active {
  cursor: grabbing;
}
.physics-grid .tool-item img {
  pointer-events: none; /* Let the container handle dragging */
}
"""

if old_block in content:
    content = content.replace(old_block, '')
    with open('style.css', 'w') as f:
        f.write(content)
    print("Success: removed old physics-grid .tool-item rules")
else:
    print("Block not found!")

