import re

with open('script.js', 'r') as f:
    js = f.read()

old_block = """            // Turn off gravity for magnetic matrix effect
            engine.world.gravity.y = 0;
            engine.world.gravity.x = 0;
            
            // Container dimensions
            const rect = container.getBoundingClientRect();
            const width = rect.width || 400;
            const height = rect.height || 240;

            // Walls (invisible) so they don't get thrown out
            const wallOpts = { isStatic: true, render: { visible: false } };
            const floor = Bodies.rectangle(width/2, height + 25, width*2, 50, wallOpts);
            const ceiling = Bodies.rectangle(width/2, -25, width*2, 50, wallOpts);
            const leftWall = Bodies.rectangle(-25, height/2, 50, height*2, wallOpts);
            const rightWall = Bodies.rectangle(width + 25, height/2, 50, height*2, wallOpts);
            
            Composite.add(world, [floor, ceiling, leftWall, rightWall]);

            const bodyMap = [];
            const size = 64; // Approximated box size for tool
            const gap = 24;  // Gap between grid items
            const itemSize = size + gap;
            
            // Calculate grid columns and rows based on container width
            // leaving some padding around edges
            const cols = Math.max(1, Math.floor((width - 40) / itemSize));
            const rows = Math.ceil(newNodes.length / cols);
            
            // Calculate grid total dimensions to center it
            const gridWidth = cols * itemSize;
            const gridHeight = rows * itemSize;"""

new_block = """            // Turn off gravity for magnetic matrix effect
            engine.world.gravity.y = 0;
            engine.world.gravity.x = 0;
            
            // Container dimensions initial
            let rect = container.getBoundingClientRect();
            const width = rect.width || 400;

            const size = 64; // Approximated box size for tool
            const gap = 24;  // Gap between grid items
            const itemSize = size + gap;
            
            // Calculate grid columns and rows based on container width
            const cols = Math.max(1, Math.floor((width - 40) / itemSize));
            const rows = Math.ceil(newNodes.length / cols);
            
            // Calculate grid total dimensions to center it
            const gridWidth = cols * itemSize;
            const gridHeight = rows * itemSize;
            
            // Ensure container is tall enough to fit the matrix
            const requiredHeight = Math.max(240, gridHeight + 40);
            container.style.height = requiredHeight + 'px';
            
            // Re-fetch rect for accurate walls
            const height = requiredHeight;

            // Walls (invisible) so they don't get thrown out
            const wallOpts = { isStatic: true, render: { visible: false } };
            const floor = Bodies.rectangle(width/2, height + 25, width*2, 50, wallOpts);
            const ceiling = Bodies.rectangle(width/2, -25, width*2, 50, wallOpts);
            const leftWall = Bodies.rectangle(-25, height/2, 50, height*2, wallOpts);
            const rightWall = Bodies.rectangle(width + 25, height/2, 50, height*2, wallOpts);
            
            Composite.add(world, [floor, ceiling, leftWall, rightWall]);

            const bodyMap = [];"""

if old_block in js:
    js = js.replace(old_block, new_block)
    with open('script.js', 'w') as f:
        f.write(js)
    print("Patch applied successfully.")
else:
    print("Old block not found.")
